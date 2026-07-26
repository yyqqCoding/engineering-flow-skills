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
  assert.doesNotMatch(source, /localhost:8317|WONG_API_KEY|GW2_API_KEY/);
  assert.match(source, /codex\.status === 0 && !codex\.timedOut && !codex\.error/);
  assert.match(source, /if \(!modelCompleted\) process\.exitCode = 1/);
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
