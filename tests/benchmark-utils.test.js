const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  assessInvocation,
  detectContamination,
  looksLikeQuestion,
  parseJsonl,
  withoutConfiguredPlugins,
} = require('../scripts/lib/benchmark-utils');
const { isUsable } = require('../scripts/fill-codex-cohort');
const { loadEnvFile } = require('../scripts/lib/env-file');
const {
  buildCodexArgs,
  extractThreadId,
  extractTurnFailure,
  promptsForBenchmark,
  readRequirementStates,
} = require('../scripts/lib/benchmark-conversation');

test('benchmark provider override stays configurable and credential-free', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'scripts', 'run-codex-benchmark.js'),
    'utf8',
  );

  assert.match(source, /BENCH_MODEL_PROVIDER/);
  assert.match(source, /BENCH_BASE_URL/);
  assert.match(source, /BENCH_MODEL/);
  assert.match(source, /env_key=.*BENCH_API_KEY/);
  assert.match(source, /model_provider=/);
  assert.match(source, /BENCH_BASELINE_PLUGIN_ROOT/);
  assert.match(source, /extractThreadId/);
  assert.doesNotMatch(source, /localhost:8317|WONG_API_KEY|GW2_API_KEY/);
  assert.match(source, /codex\.status === 0 && !codex\.timedOut && !codex\.error/);
  assert.match(source, /if \(!modelCompleted\) process\.exitCode = 1/);
});

test('builds persistent first turns and targeted resume commands for multi-turn benchmarks', () => {
  const common = {
    configOverrides: ['model_reasoning_effort="low"'],
    workspace: '/tmp/workspace',
    finalPath: '/tmp/final.txt',
  };
  const singleTurn = buildCodexArgs({ ...common, prompt: 'single', persistent: false });
  const firstTurn = buildCodexArgs({ ...common, prompt: 'first', persistent: true });
  const resumedTurn = buildCodexArgs({
    ...common,
    prompt: 'second',
    persistent: true,
    threadId: '0199a213-81c0-7800-8aa1-bbab2a035a53',
  });

  assert.ok(singleTurn.includes('--ephemeral'));
  assert.ok(!firstTurn.includes('--ephemeral'));
  assert.deepEqual(resumedTurn.slice(0, 2), ['exec', 'resume']);
  assert.ok(resumedTurn.includes('0199a213-81c0-7800-8aa1-bbab2a035a53'));
  assert.ok(!resumedTurn.includes('--ephemeral'));
  assert.ok(!resumedTurn.includes('-C'));
  assert.ok(!resumedTurn.includes('-s'));
});

test('extracts the session id and validates configured follow-up prompts', () => {
  const events = [
    JSON.stringify({ type: 'thread.started', thread_id: 'thread-123' }),
    JSON.stringify({ type: 'turn.completed', usage: {} }),
  ].join('\n');

  assert.equal(extractThreadId(events), 'thread-123');
  assert.equal(extractThreadId('{not-json}\n'), null);
  assert.equal(extractTurnFailure([
    JSON.stringify({ type: 'error', message: 'retrying' }),
    JSON.stringify({ type: 'turn.failed', error: { message: 'provider unavailable' } }),
  ].join('\n')), 'provider unavailable');
  assert.equal(extractTurnFailure([
    JSON.stringify({ type: 'error', message: 'retrying' }),
    JSON.stringify({ type: 'turn.completed', usage: {} }),
  ].join('\n')), null);
  assert.equal(extractTurnFailure([
    JSON.stringify({ type: 'turn.completed', usage: {} }),
    JSON.stringify({ type: 'error', message: 'stream ended badly' }),
  ].join('\n')), 'stream ended badly');
  assert.deepEqual(
    promptsForBenchmark({ prompt: 'first', followUps: ['second', 'third'] }),
    ['first', 'second', 'third'],
  );
  assert.throws(
    () => promptsForBenchmark({ prompt: 'first', followUps: [''] }),
    /non-empty strings/,
  );
});

test('captures requirement document lifecycle states', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-requirements-'));
  const requirements = path.join(workspace, 'docs', 'requirements');
  fs.mkdirSync(requirements, { recursive: true });
  fs.writeFileSync(path.join(requirements, 'batch-export.md'), '# Batch export\n\nStatus: Accepted\n');
  fs.writeFileSync(path.join(requirements, 'draft.md'), '# Draft\n\n**Status:** Draft\n');
  fs.writeFileSync(path.join(requirements, 'done.md'), '# Done\n\nStatus: **Implemented**\n');
  fs.writeFileSync(path.join(workspace, 'docs', 'notes.md'), '# Notes\n');

  assert.deepEqual(readRequirementStates(workspace), [
    { path: 'docs/requirements/batch-export.md', status: 'Accepted' },
    { path: 'docs/requirements/done.md', status: 'Implemented' },
    { path: 'docs/requirements/draft.md', status: 'Draft' },
  ]);
});

test('loads local benchmark environment without overriding explicit variables', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-env-'));
  const filename = path.join(directory, '.env');
  fs.writeFileSync(filename, [
    '# local values',
    'BENCH_BASE_URL=https://example.test/v1',
    'BENCH_API_KEY="key#with-symbol"',
    'BENCH_MODEL=file-model',
    'export BENCH_REASONING_EFFORT=low',
    '',
  ].join('\n'));
  const environment = { BENCH_MODEL: 'cli-model' };

  loadEnvFile(filename, environment);

  assert.deepEqual(environment, {
    BENCH_BASE_URL: 'https://example.test/v1',
    BENCH_API_KEY: 'key#with-symbol',
    BENCH_MODEL: 'cli-model',
    BENCH_REASONING_EFFORT: 'low',
  });
});

test('keeps the local secret file ignored', () => {
  const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
  assert.match(gitignore, /(?:^|\n)\.env(?:\r?\n|$)/);
});

test('cohort filling accepts only completed uncontaminated model turns', () => {
  const usable = {
    modelRun: {
      status: 0,
      timedOut: false,
      error: null,
      contaminated: false,
    },
    metrics: { turns: 1 },
  };

  assert.equal(isUsable(usable), true);
  assert.equal(isUsable({ ...usable, modelRun: { ...usable.modelRun, timedOut: true } }), false);
  assert.equal(isUsable({ ...usable, modelRun: { ...usable.modelRun, status: 1 } }), false);
  assert.equal(isUsable({ ...usable, metrics: { turns: 0 } }), false);
});

test('removes configured plugin tables without removing later config', () => {
  const source = [
    'model = "example"',
    '[plugins.superpowers]',
    'enabled = true',
    '[plugins.superpowers.settings]',
    'mode = "full"',
    '[providers.local]',
    'url = "http://localhost"',
    '',
  ].join('\n');

  assert.equal(withoutConfiguredPlugins(source), [
    'model = "example"',
    '[providers.local]',
    'url = "http://localhost"',
    '',
  ].join('\n'));
});

test('parses invocation, tools, ceremony, and token usage from Codex JSONL', () => {
  const events = [
    { type: 'turn.started' },
    {
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: "sed -n '1,200p' /tmp/plugin/skills/diagnose/SKILL.md",
      },
    },
    { type: 'item.completed', item: { type: 'todo_list', items: [] } },
    { type: 'item.completed', item: { type: 'file_change', changes: [] } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Should this cascade?' } },
    {
      type: 'turn.completed',
      usage: {
        input_tokens: 100,
        cached_input_tokens: 20,
        output_tokens: 30,
        reasoning_output_tokens: 5,
      },
    },
  ].map((event) => JSON.stringify(event)).join('\n');

  const metrics = parseJsonl(events);

  assert.deepEqual(metrics.invokedSkills, ['diagnose']);
  assert.equal(metrics.commandExecutions, 1);
  assert.equal(metrics.fileChanges, 1);
  assert.equal(metrics.todoLists, 1);
  assert.equal(metrics.questionMessages, 1);
  assert.equal(metrics.toolCalls, 2);
  assert.deepEqual(metrics.usage, {
    inputTokens: 100,
    cachedInputTokens: 20,
    outputTokens: 30,
    reasoningOutputTokens: 5,
  });
});

test('assesses expected and unexpected skill invocation', () => {
  assert.deepEqual(
    assessInvocation(['diagnose', 'code-design'], {
      expected: ['diagnose'],
      allowed: ['diagnose'],
    }),
    {
      expected: ['diagnose'],
      allowed: ['diagnose'],
      invoked: ['code-design', 'diagnose'],
      truePositives: ['diagnose'],
      recalledExpected: ['diagnose'],
      falsePositives: ['code-design'],
      falseNegatives: [],
      collisions: [],
      precision: 0.5,
      recall: 1,
      passed: false,
    },
  );
});

test('recognizes direct and option-list clarification questions', () => {
  assert.equal(looksLikeQuestion('Should existing orders be deleted?'), true);
  assert.equal(looksLikeQuestion('When orders exist, should deletion:\n\n1. Reject\n2. Cascade'), true);
  assert.equal(looksLikeQuestion('Please confirm the deletion policy.'), true);
  assert.equal(looksLikeQuestion('请确认已有订单时是否拒绝删除。'), true);
  assert.equal(looksLikeQuestion('I am confirming the final diff and test output.'), false);
  assert.equal(looksLikeQuestion('Implemented the focused change and tests pass.'), false);
});

test('reports scenario-defined incompatible skill collisions', () => {
  const result = assessInvocation(['review', 'develop'], {
    expected: ['review'],
    allowed: ['review', 'develop'],
    forbiddenTogether: [['review', 'develop']],
  });

  assert.deepEqual(result.collisions, [['develop', 'review']]);
  assert.equal(result.passed, false);
});

test('detects global Superpowers access but accepts isolated candidate paths', () => {
  assert.equal(detectContamination('/home/user/.codex/superpowers/skills/debug/SKILL.md'), true);
  assert.equal(detectContamination('superpowers:systematic-debugging'), true);
  assert.equal(
    detectContamination('/tmp/engineering-home/.codex/plugins/cache/engineering-flow/0.1.0/skills/diagnose/SKILL.md'),
    false,
  );
});
