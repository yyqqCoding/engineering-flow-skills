const fs = require('node:fs');
const path = require('node:path');

function promptsForBenchmark(benchmark) {
  const prompts = [benchmark.prompt, ...(benchmark.followUps || [])];
  if (prompts.some((prompt) => typeof prompt !== 'string' || prompt.trim() === '')) {
    throw new Error('Benchmark prompts and followUps must be non-empty strings');
  }
  return prompts;
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
  promptsForBenchmark,
  readRequirementStates,
};
