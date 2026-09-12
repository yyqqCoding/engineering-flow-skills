const fs = require('node:fs');
const path = require('node:path');
const { stripVTControlCharacters } = require('node:util');
const { runFixtureVerification } = require('../../scripts/lib/benchmark-verification');

function turnItems(turn) {
  if (!turn?.events || !fs.existsSync(turn.events)) return [];
  const items = [];
  for (const line of fs.readFileSync(turn.events, 'utf8').split(/\r?\n/)) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'item.completed' && event.item) items.push(event.item);
    } catch {
      // The runner reports malformed JSONL separately.
    }
  }
  return items;
}

function unchangedSinceStart(turn, initial) {
  return Boolean(initial && turn?.workspaceState
    && turn.diff === initial.diff
    && turn.workspaceState.status === initial.status
    && turn.workspaceState.head === initial.head
    && turn.workspaceState.unauthorizedCommit === false
    && turn.metrics?.fileChanges === 0
    && Array.isArray(initial.requirementDocuments)
    && Array.isArray(turn.requirementDocuments)
    && JSON.stringify(turn.requirementDocuments) === JSON.stringify(initial.requirementDocuments));
}

function requestsApproval(message) {
  const clauses = String(message || '').replace(/[*_`]/g, '')
    .split(/[.!?;\n,。！？；，]+|\b(?:but|however)\b|但是|不过|但/i);
  const settled = /\bno\s+(?:(?:further|new|additional|more|user|implementation)\s+)*(?:approval|authorization|confirmation)\s+(?:(?:is|will be)\s+)?(?:required|needed|necessary)\b|\b(?:approval|authorization|confirmation)\s+(?:(?:is|will be)\s+)?(?:not|no longer)\s+(?:required|needed|necessary)\b|\b(?:do not|don't|no need to)\s+(?:need to\s+)?(?:wait|ask|request)\b|\bno need for\s+(?:approval|authorization|confirmation)\b|\balready (?:been )?(?:approved|authorized)\b|无需|不需要|不必/i;
  const pending = /\b(?:await(?:ing)?|wait(?:ing)?|pending|need(?:s|ed)?|request(?:s|ed|ing)?)\b.{0,80}(?:approv|authoriz|confirmation)|(?:approval|authorization|confirmation).{0,40}\b(?:pending|required|needed)\b|\bnot (?:yet )?(?:approved|authorized)\b|\b(?:please|reply|say|confirm)\b.{0,80}(?:approv|proceed|implement)|(?:等待|等候|待|尚未|未).{0,20}(?:批准|授权|确认)|请.{0,20}(?:批准|授权|确认)/i;
  const missing = /\bno\s+(?:(?:explicit|implementation|user)\s+)*(?:approval|authorization)\s+(?:(?:was|is|has been)\s+)?(?:supplied|provided|given|granted|received)\b|\b(?:approval|authorization)(?:\s+for (?:the )?(?:new|added) scope)?\s+(?:has not(?: yet)? been|(?:was|is) not(?: yet)?)\s+(?:supplied|provided|given|granted|received)\b|\bimplementation\s+(?:has not(?: yet)? been|is not(?: yet)?)\s+(?:approved|authorized)\b/i;
  const localOnly = /\b(?:new|further|additional)\s+(?:implementation\s+)?(?:approval|authorization)\b|\b(?:this|current)\s+(?:message|turn)\b/i;
  return clauses.some((clause) => !settled.test(clause)
    && (pending.test(clause) || (!localOnly.test(clause) && missing.test(clause))));
}

function isTestCommand(item) {
  if (item.type !== 'command_execution') return false;
  let script = String(item.command || '').trim();
  const shell = script.match(/^(?:\S*\/)?(?:bash|sh|zsh)\s+-[a-z]*c[a-z]*\s+(['"])([\s\S]*)\1$/);
  if (shell) script = shell[2];
  // A command mentioned inside an argument or comment is not an invocation.
  script = script.replace(/\\\r?\n/g, ' ')
    .replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, ' ')
    .replace(/#[^\n]*/g, '').trim()
    .replace(/&&\s+/g, '&& ')
    .replace(/^cd\b[^;&|\n]*&&\s*/, '')
    .replace(/\|\|\s*true\s*$/, '').trim();
  // Bound attribution to the test itself and subsequent && commands. Arbitrary
  // output before a test, pipelines, or recovery commands can replay older TAP.
  if (/[;|&\n<>`]/.test(script.replaceAll('&&', ''))) return false;
  return /^(?:npm\s+(?:test|run\s+test)|node\s+--test)(?=\s|&|$)/.test(script);
}

function testCommandResult(item) {
  if (!isTestCommand(item) || !Number.isInteger(item.exit_code)) return null;
  const output = stripVTControlCharacters(String(item.aggregated_output || ''));
  const headers = [...output.matchAll(/^TAP version 13\r?$/gm)];
  if (headers.length !== 1) return null;
  const tap = output.slice(headers[0].index);
  // These fixtures use Node's TAP reporter. Require its completed summary and
  // numbered results; copied counts or an interrupted run are not test evidence.
  const summary = tap.match(/^1\.\.([1-9]\d*)\r?\n# tests ([1-9]\d*)\r?\n# suites \d+\r?\n# pass (\d+)\r?\n# fail (\d+)\r?\n# cancelled (\d+)\r?\n# skipped (\d+)\r?\n# todo (\d+)\r?\n# duration_ms \d+(?:\.\d+)?(?:\r?\n|$)/m);
  if (!summary) return null;
  const [planned, total, passed, failed, cancelled, skipped, todo] = summary.slice(1).map(Number);
  const results = [...tap.slice(0, summary.index).matchAll(/^(not ok|ok) ([1-9]\d*)(?: - [^\r\n]*)?\r?$/gm)];
  if (total !== passed + failed + cancelled + skipped + todo
      || results.length !== planned
      || results.some((result, index) => Number(result[2]) !== index + 1)) return null;
  if (failed > 0 && results.some((result) => result[1] === 'not ok')) return 'failed';
  if (failed === 0 && cancelled === 0 && passed > 0
      && results.every((result) => result[1] === 'ok')) return 'passed';
  return null;
}

function hasPassingTestCommand(turn) {
  return turnItems(turn).some((item) => testCommandResult(item) === 'passed');
}

function changesPath(item, relativePath) {
  return item.type === 'file_change' && (item.changes || []).some((change) => {
    const normalized = String(change.path || '').replaceAll('\\', '/');
    return normalized === relativePath || normalized.endsWith(`/${relativePath}`);
  });
}

function observesRegressionBeforeRepair(turn, productionPath, testPath) {
  const items = turnItems(turn);
  const production = items.findIndex((item) => changesPath(item, productionPath));
  const testWrite = items.findIndex((item) => changesPath(item, testPath));
  if (testWrite < 0 || production <= testWrite) return false;
  const red = items.findIndex((item, index) => index > testWrite && index < production
    && testCommandResult(item) === 'failed');
  return red >= 0 && items.slice(production + 1)
    .some((item) => testCommandResult(item) === 'passed');
}

function detectsMutation(workspace, relativePath, mutant) {
  const target = path.join(workspace, relativePath);
  const original = fs.readFileSync(target, 'utf8');
  try {
    fs.writeFileSync(target, mutant);
    const result = runFixtureVerification(workspace, {});
    return Number.isInteger(result.status) && result.status > 0 && !result.error
      && /not ok|AssertionError|ERR_ASSERTION|fail\s+[1-9]/i.test(result.stdout + result.stderr);
  } finally {
    fs.writeFileSync(target, original);
    delete require.cache[require.resolve(target)];
  }
}

module.exports = {
  detectsMutation,
  hasPassingTestCommand,
  observesRegressionBeforeRepair,
  requestsApproval,
  turnItems,
  unchangedSinceStart,
};
