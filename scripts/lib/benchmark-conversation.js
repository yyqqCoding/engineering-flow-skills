const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { withoutConfiguredPlugins } = require('./benchmark-utils');

function promptsForBenchmark(benchmark) {
  if (benchmark.followUps !== undefined && !Array.isArray(benchmark.followUps)) {
    throw new Error('Benchmark followUps must be an array');
  }
  const prompts = [benchmark.prompt, ...(benchmark.followUps || [])];
  const freshSessionTurns = benchmark.freshSessionTurns || [];
  if (!Array.isArray(freshSessionTurns)
      || freshSessionTurns.some((turn) => !Number.isInteger(turn) || turn < 2 || turn > prompts.length)
      || new Set(freshSessionTurns).size !== freshSessionTurns.length) {
    throw new Error('freshSessionTurns must contain unique turn numbers between 2 and the final turn');
  }
  const nativeCompactionTurns = benchmark.nativeCompactionTurns || [];
  if (!Array.isArray(nativeCompactionTurns)
      || nativeCompactionTurns.some((turn) => !Number.isInteger(turn)
        || turn < 2 || turn > prompts.length || freshSessionTurns.includes(turn))
      || new Set(nativeCompactionTurns).size !== nativeCompactionTurns.length) {
    throw new Error('nativeCompactionTurns must contain unique resumed turn numbers, excluding fresh sessions');
  }
  for (const [index, entry] of prompts.entries()) {
    const prompt = typeof entry === 'string' ? entry : entry?.prompt;
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Benchmark prompts and followUps must contain non-empty strings');
    }
    if (typeof entry === 'string') continue;
    if (index === 0 || !entry || Array.isArray(entry)
        || Object.keys(entry).some((key) => !['prompt', 'handoffFromTurn'].includes(key))) {
      throw new Error('A handoff follow-up accepts only prompt and handoffFromTurn');
    }
    if (!Number.isInteger(entry.handoffFromTurn)
        || entry.handoffFromTurn < 1 || entry.handoffFromTurn > index) {
      throw new Error('handoffFromTurn must reference an earlier turn');
    }
    if (!freshSessionTurns.includes(index + 1)) {
      throw new Error('handoffFromTurn requires a fresh session');
    }
  }
  return prompts;
}

function freshSessionTurnsForBenchmark(benchmark) {
  promptsForBenchmark(benchmark);
  return new Set(benchmark.freshSessionTurns || []);
}

function nativeCompactionTurnsForBenchmark(benchmark) {
  promptsForBenchmark(benchmark);
  return new Set(benchmark.nativeCompactionTurns || []);
}

function prepareCodexHome(codexHome, sourceCodexHome) {
  const authPath = path.join(sourceCodexHome, 'auth.json');
  if (!fs.existsSync(authPath)) {
    throw new Error(`Codex authentication not found at ${authPath}`);
  }
  // The caller supplies a new HOME. Never reuse or copy another session's history.
  fs.mkdirSync(codexHome);
  const authTarget = path.join(codexHome, 'auth.json');
  try {
    fs.symlinkSync(authPath, authTarget);
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
    fs.copyFileSync(authPath, authTarget);
  }
  for (const entry of fs.readdirSync(sourceCodexHome, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.toml')) continue;
    const source = fs.readFileSync(path.join(sourceCodexHome, entry.name), 'utf8');
    fs.writeFileSync(path.join(codexHome, entry.name), entry.name === 'config.toml'
      ? withoutConfiguredPlugins(source)
      : source);
  }
}

function resolveTurnPrompt(entry, { turnNumber, freshSession, turns, handoffDirectory }) {
  if (typeof entry === 'string') return { prompt: entry, handoff: null };
  const source = turns.find((turn) => turn.index === entry.handoffFromTurn);
  if (!freshSession || !Number.isInteger(entry.handoffFromTurn)
      || entry.handoffFromTurn < 1 || entry.handoffFromTurn >= turnNumber
      || !source?.modelRun?.completed || !source.session?.threadId) {
    throw new Error('A handoff requires a completed earlier turn and a fresh session');
  }
  if (typeof source.finalMessage !== 'string') {
    throw new Error('The source handoff response must be a string');
  }
  const handoffPath = path.join(handoffDirectory, `handoff-for-turn-${turnNumber}.md`);
  fs.writeFileSync(handoffPath, source.finalMessage, { flag: 'wx' });
  return {
    prompt: `${entry.prompt}\n\nContinuation record: ${handoffPath}\nRead this record as the supplied prior-session context.`,
    handoff: {
      sourceTurn: source.index,
      sourceThreadId: source.session.threadId,
      path: handoffPath,
      sha256: crypto.createHash('sha256').update(source.finalMessage).digest('hex'),
    },
  };
}

function extractThreadId(events) {
  for (const line of String(events || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'thread.started' && event.thread_id) return event.thread_id;
    } catch {
      // Invalid JSONL is reported by the metrics parser; keep looking for the thread event.
    }
  }
  return null;
}

function extractTurnFailure(events) {
  let lastError = null;
  for (const line of String(events || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'turn.failed' && event.error?.message) return event.error.message;
      if (event.type === 'error' && event.message) lastError = event.message;
      if (event.type === 'turn.completed') lastError = null;
    } catch {
      // Invalid JSONL is reported by the metrics parser.
    }
  }
  return lastError;
}

function buildCodexArgs({
  prompt,
  threadId,
  persistent,
  configOverrides,
  workspace,
  finalPath,
}) {
  const common = [
    '--json',
    '--dangerously-bypass-hook-trust',
    ...configOverrides.flatMap((override) => ['-c', override]),
    '-o',
    finalPath,
  ];

  if (threadId) {
    return ['exec', 'resume', ...common, threadId, prompt];
  }

  return [
    'exec',
    ...(persistent ? [] : ['--ephemeral']),
    ...common,
    '-s',
    'workspace-write',
    '-C',
    workspace,
    prompt,
  ];
}

function readRequirementStates(workspace) {
  const docsRoot = path.join(workspace, 'docs');
  if (!fs.existsSync(docsRoot)) return [];

  const documents = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(
        /^(?:\*\*)?(?:status|状态)(?:\*\*)?\s*:\s*(?:\*\*)?\s*(Draft|Accepted|Implemented|Superseded)\s*(?:\*\*)?\s*$/im,
      );
      if (match) {
        documents.push({
          path: path.relative(workspace, fullPath).split(path.sep).join('/'),
          status: match[1],
          content,
        });
      }
    }
  }

  visit(docsRoot);
  return documents.sort((left, right) => left.path.localeCompare(right.path));
}

module.exports = {
  buildCodexArgs,
  extractThreadId,
  extractTurnFailure,
  freshSessionTurnsForBenchmark,
  nativeCompactionTurnsForBenchmark,
  prepareCodexHome,
  promptsForBenchmark,
  readRequirementStates,
  resolveTurnPrompt,
};
