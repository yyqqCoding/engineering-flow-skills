const { stripVTControlCharacters } = require('node:util');
const { turnItems } = require('./workflow-transition-evidence');

// A bounded shell reader keeps quoted mentions and saved-output commands from
// being mistaken for an invocation. These fixtures need only ordinary words,
// quotes, captured stderr merging, an optional cd, &&, and a final || true.
function shellWords(command, unwrap = true) {
  const script = String(command || '').trim().replace(/\\\r?\n/g, ' ');
  const words = [];
  let word = '';
  let started = false;
  let quote = null;
  for (let index = 0; index < script.length; index += 1) {
    const char = script[index];
    if (quote) {
      if (char === quote) quote = null;
      else if (char === '\\' && quote === '"' && index + 1 < script.length) word += script[++index];
      else if (quote === '"' && /[$`]/.test(char)) return null;
      else word += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      started = true;
    } else if (!started && script.startsWith('2>&1', index)
        && /^(?:$|\s|&&|\|\|)/.test(script.slice(index + 4))) {
      // Both streams are already captured. File redirections remain unsupported.
      index += 3;
    } else if (/\r|\n|[;<>`$]/.test(char)) return null;
    else if (/\s/.test(char)) {
      if (started) words.push(word);
      word = '';
      started = false;
    } else if (char === '&' || char === '|') {
      if (script[index + 1] !== char) return null;
      if (started) words.push(word);
      words.push(char + char);
      index += 1;
      word = '';
      started = false;
    } else if (char === '#' && !started) break;
    else if (char === '\\' && index + 1 < script.length) {
      word += script[++index];
      started = true;
    } else {
      word += char;
      started = true;
    }
  }
  if (quote) return null;
  if (started) words.push(word);
  if (unwrap && words.length === 3 && /^(?:.*\/)?(?:bash|sh|zsh)$/.test(words[0])
      && /^-[a-z]*c[a-z]*$/.test(words[1])) return shellWords(words[2], false);
  return words;
}

function isFollowingCheck(words) {
  if (!/^(?:.*\/)?git$/.test(words[0])) return false;
  if (words[1] === 'diff') {
    return (words.length === 3 && words[2] === '--check') || words[2] === '--';
  }
  return words.length === 3 && words[1] === 'status'
    && ['--short', '--porcelain'].includes(words[2]);
}

function pythonTestInvocation(item) {
  if (item?.type !== 'command_execution') return null;
  let words = shellWords(item.command);
  if (!words) return null;
  if (words.at(-2) === '||' && words.at(-1) === 'true') words = words.slice(0, -2);
  if (words.includes('||')) return null;
  if (words[0] === 'cd' && words[2] === '&&') words = words.slice(3);
  const segments = [[]];
  for (const word of words) {
    if (word === '&&') segments.push([]);
    else segments.at(-1).push(word);
  }
  if (segments.some((segment) => segment.length === 0)) return null;
  // Attribute compound output only for known follow-up checks. Arbitrary programs
  // or nested shells could replay a saved summary and require manual review.
  if (segments.slice(1).some((segment) => !isFollowingCheck(segment))) return null;
  const invocation = [...segments[0]];
  if (!/^(?:.*\/)?python(?:3(?:\.\d+)?)?$/.test(invocation.shift() || '')) return null;
  while (['-B', '-u'].includes(invocation[0])) invocation.shift();
  if (invocation.shift() !== '-m' || invocation.shift() !== 'unittest'
      || invocation.shift() !== 'discover') return null;
  // The promised verification discovers the whole tests directory. Display
  // options and the default pattern preserve that scope; filters do not.
  let start;
  let pattern;
  while (invocation.length > 0) {
    const argument = invocation.shift();
    if (['-v', '--verbose', '-q', '--quiet'].includes(argument)) continue;
    const assignment = argument.match(/^(--start-directory|--pattern)=(.*)$/);
    const option = assignment?.[1] || argument;
    if (['-s', '--start-directory'].includes(option)) {
      if (start !== undefined) return null;
      start = assignment ? assignment[2] : invocation.shift();
    } else if (['-p', '--pattern'].includes(option)) {
      if (pattern !== undefined) return null;
      pattern = assignment ? assignment[2] : invocation.shift();
      if (pattern === undefined) return null;
    } else if (!argument.startsWith('-') && start === undefined) start = argument;
    else return null;
  }
  if (typeof start !== 'string' || start.replace(/^\.\//, '').replace(/\/$/, '') !== 'tests'
      || (pattern !== undefined && pattern !== 'test*.py')) return null;
  return { hasFollowingCommand: segments.length > 1 };
}

function isPythonTestCommand(item) {
  return pythonTestInvocation(item) !== null;
}

function unittestResult(rawOutput) {
  const output = stripVTControlCharacters(String(rawOutput || '')).replaceAll('\r\n', '\n');
  const runs = [...output.matchAll(/^Ran (\d+) tests? in \d+(?:\.\d+)?(?:e[+-]?\d+)?s$/gm)];
  if (runs.length !== 1) return null;
  if ([...output.matchAll(/^(?:OK(?: \([^\n]*\))?|FAILED(?: \([^\n]*\))?)$/gm)].length !== 1) return null;
  const count = Number(runs[0][1]);
  if (!Number.isSafeInteger(count) || count <= 0) return null;
  const prefix = output.slice(0, runs[0].index);
  if (!/^-{20,}\n$/m.test(prefix.slice(prefix.lastIndexOf('\n', prefix.length - 2) + 1))) return null;
  const ending = output.slice(runs[0].index + runs[0][0].length)
    .match(/^\n\n(OK(?: \(([^\n]+)\))?|FAILED \(([^\n]+)\))(?:\n|$)/);
  if (!ending) return null;
  const counts = {};
  for (const entry of (ending[2] || ending[3] || '').split(', ').filter(Boolean)) {
    const match = entry.match(/^(failures|errors|skipped|expected failures|unexpected successes)=([1-9]\d*)$/);
    if (!match || counts[match[1]] !== undefined) return null;
    counts[match[1]] = Number(match[2]);
    if (!Number.isSafeInteger(counts[match[1]])) return null;
  }
  const failures = (counts.failures || 0) + (counts.errors || 0) + (counts['unexpected successes'] || 0);
  if (ending[1].startsWith('FAILED')) return failures > 0 ? 'failed' : null;
  // Skips and expected failures alone do not establish working accepted behavior.
  const successfulProgress = /^[.sFxEu]*\.[.sFxEu]*$/m.test(prefix)
    || /\.\.\. ok$/m.test(prefix);
  if (failures > 0 || ((counts.skipped || 0) + (counts['expected failures'] || 0) >= count
      && !successfulProgress)) return null;
  if (/^[.sFxEu]*[FEu][.sFxEu]*$/m.test(prefix)
      || /\.\.\. (?:FAIL|ERROR|unexpected success)$/m.test(prefix)) return null;
  return 'passed';
}

function pythonTestCommandResult(item) {
  const invocation = pythonTestInvocation(item);
  if (!invocation || !Number.isInteger(item.exit_code)) return null;
  const result = unittestResult(item.aggregated_output);
  if (result === 'passed' && item.exit_code !== 0 && !invocation.hasFollowingCommand) return null;
  return result;
}

function hasPassingPythonTestCommand(turn) {
  return turnItems(turn).some((item) => pythonTestCommandResult(item) === 'passed');
}

module.exports = {
  hasPassingPythonTestCommand,
  isPythonTestCommand,
  pythonTestCommandResult,
  unittestResult,
};
