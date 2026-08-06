const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { ROOT, readJson } = require('./helpers/repository');

const benchmarks = readJson('config/benchmarks.json');

function run(command, args, cwd) {
  return childProcess.spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    // npm resolves to npm.cmd on Windows, which spawnSync only runs through a shell.
    shell: command === 'npm' && process.platform === 'win32',
  });
}

test('benchmark fixtures and scorers exist', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    assert.ok(fs.existsSync(path.join(ROOT, benchmark.fixture)), `${name} fixture is missing`);
    assert.ok(fs.existsSync(path.join(ROOT, benchmark.scorer)), `${name} scorer is missing`);
    if (benchmark.setup) {
      assert.ok(fs.existsSync(path.join(ROOT, benchmark.setup)), `${name} setup is missing`);
    }
    assert.ok(benchmark.prompt.length >= 80, `${name} prompt is too weak to define the task`);
    if (benchmark.followUps) {
      assert.ok(Array.isArray(benchmark.followUps), `${name} followUps must be an array`);
      assert.ok(
        benchmark.followUps.every((prompt) => typeof prompt === 'string' && prompt.length > 0),
        `${name} followUps must contain non-empty prompts`,
      );
    }
    assert.ok(Array.isArray(benchmark.invocation?.expected), `${name} expected invocation list is missing`);
    assert.ok(Array.isArray(benchmark.invocation?.allowed), `${name} allowed invocation list is missing`);
  }
});

test('Codex explicit-skill benchmarks use the plugin namespace', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    for (const skill of benchmark.invocation.expected) {
      assert.match(
        benchmark.prompt,
        new RegExp(`\\$engineering-flow:${skill}(?:\\s|$)`),
        `${name} must explicitly invoke ${skill} with the plugin namespace`,
      );
    }
  }
});

test('fixture public tests pass before model changes', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    const result = run('npm', ['test'], path.join(ROOT, benchmark.fixture));
    assert.equal(result.status, 0, `${name} fixture baseline tests failed\n${result.stdout}\n${result.stderr}`);
  }
});

test('hidden scorers reject the unmodified fixtures', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    const scorerPath = path.join(ROOT, benchmark.scorer);
    delete require.cache[require.resolve(scorerPath)];
    const score = require(scorerPath)(path.join(ROOT, benchmark.fixture));
    assert.equal(score.passed, false, `${name} scorer must be red on the initial fixture`);
  }
});

test('readability scorer does not mistake nullish assignment for a nested conditional', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'engineering-flow-readability-'));
  const workspace = path.join(temporaryRoot, 'workspace');
  fs.cpSync(path.join(ROOT, benchmarks['readability-trap'].fixture), workspace, { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'order-summary.js'), [
    'function summarizeOrders(orders) {',
    '  const summary = { high: [], normal: [], invalid: [] };',
    '  for (const order of orders) {',
    '    if (order.cancelled) continue;',
    '    if (order.total < 0) summary.invalid.push(order.id);',
    '    else if (order.total === 0) (summary.zero ??= []).push(order.id);',
    '    else if (order.total > 1000) summary.high.push(order.id);',
    '    else summary.normal.push(order.id);',
    '  }',
    '  return summary;',
    '}',
    'module.exports = { summarizeOrders };',
    '',
  ].join('\n'));

  const scorerPath = path.join(ROOT, benchmarks['readability-trap'].scorer);
  delete require.cache[require.resolve(scorerPath)];
  const score = require(scorerPath)(workspace);

  assert.equal(score.passed, true);
  assert.equal(score.checks.avoidsNestedConditional, true);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('benchmark setup hooks create valid pre-existing worktree state', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    if (!benchmark.setup) continue;

    const temporaryRoot = fs.mkdtempSync(path.join(require('node:os').tmpdir(), `engineering-flow-setup-${name}-`));
    const workspace = path.join(temporaryRoot, 'workspace');
    fs.cpSync(path.join(ROOT, benchmark.fixture), workspace, { recursive: true });

    assert.equal(run('git', ['init', '-b', 'main'], workspace).status, 0);
    assert.equal(run('git', ['config', 'user.email', 'test@example.invalid'], workspace).status, 0);
    assert.equal(run('git', ['config', 'user.name', 'Test'], workspace).status, 0);
    assert.equal(run('git', ['add', '.'], workspace).status, 0);
    assert.equal(run('git', ['commit', '-m', 'baseline'], workspace).status, 0);

    const setupPath = path.join(ROOT, benchmark.setup);
    delete require.cache[require.resolve(setupPath)];
    require(setupPath)(workspace);

    const status = run('git', ['status', '--short'], workspace);
    assert.equal(status.status, 0, `${name} setup status failed`);
    assert.notEqual(status.stdout, '', `${name} setup must create pre-existing work`);

    const publicTests = run('npm', ['test'], workspace);
    assert.equal(
      publicTests.status,
      0,
      `${name} setup broke public tests\n${publicTests.stdout}\n${publicTests.stderr}`,
    );

    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('question batching scorer rejects inferred write behavior from a read API', () => {
  const score = require('./scorers/develop-question-batching')(ROOT, {
    turns: [
      {
        finalMessage: [
          'Unknown customer: return false, inferred from findCustomer.',
          'Orders: what should happen?',
          'Audit: should this emit an event?',
        ].join('\n'),
        diff: '',
      },
      { finalMessage: 'Ready for approval.', diff: '' },
    ],
  });

  assert.equal(score.passed, false);
  assert.equal(score.checks.asksIndependentQuestionsTogether, false);
});

test('question batching scorer accepts a topic heading followed by its question', () => {
  const score = require('./scorers/develop-question-batching')(ROOT, {
    turns: [
      {
        finalMessage: [
          '**1. Customers with existing orders**',
          'When a customer has orders, what should deleteCustomer do?',
          '**2. Unknown customer**',
          'What should deleteCustomer do when the customer does not exist?',
          '**3. Audit event**',
          'Should deleteCustomer emit an audit event?',
        ].join('\n'),
        diff: '',
      },
      { finalMessage: 'Ready for approval.', diff: '' },
    ],
  });

  assert.equal(score.passed, true);
  assert.equal(score.checks.asksIndependentQuestionsTogether, true);
});

test('question batching scorer accepts one choice request with numbered option groups', () => {
  const score = require('./scorers/develop-question-batching')(ROOT, {
    turns: [
      {
        finalMessage: [
          'Please choose the behavior for each:',
          '1. Existing orders:',
          '   - Reject deletion',
          '   - Cascade-delete orders',
          '2. Unknown customer:',
          '   - Return false',
          '   - Throw',
          '3. Audit event:',
          '   - Emit one',
          '   - Do not emit one',
        ].join('\n'),
        diff: '',
      },
      { finalMessage: 'Checkpoint ready for approval.', diff: '' },
    ],
  });

  assert.equal(score.passed, true);
  assert.equal(score.checks.asksIndependentQuestionsTogether, true);
});

test('question batching scorer accepts an explicit authorization request', () => {
  const { awaitsApproval } = require('./scorers/develop-question-batching');

  assert.equal(awaitsApproval('Say “implement this” to authorize code and test changes.'), true);
  assert.equal(awaitsApproval('The checkpoint is recorded.'), false);
});

test('develop lifecycle scorer accepts equivalent incremental approval wording', () => {
  const { awaitsApproval } = require('./scorers/develop-lifecycle');

  assert.equal(awaitsApproval('请回复“按增量实施”后我再修改并验证。'), true);
  assert.equal(awaitsApproval('请回复“继续实施”或“按此执行”后我再修改。'), true);
  assert.equal(awaitsApproval('请回复“实施该增量”或“继续”，我再开始修改。'), true);
  assert.equal(awaitsApproval('Reply with “implement this” to authorize the code and test changes.'), true);
  assert.equal(awaitsApproval('Reply with “implement this” or equivalent to authorize implementation.'), true);
  assert.equal(awaitsApproval('增量验收对齐如下，暂不实施。'), false);
  assert.equal(awaitsApproval('The checkpoint is ready.'), false);
});

test('diagnose continuation requires probe evidence rather than causal keywords alone', () => {
  const { hasDistinguishingEvidence } = require('./scorers/diagnose-continuation');
  const temporaryRoot = fs.mkdtempSync(path.join(
    require('node:os').tmpdir(),
    'engineering-flow-diagnose-evidence-',
  ));
  const events = path.join(temporaryRoot, 'turn.jsonl');
  fs.writeFileSync(events, [
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: "node -e \"const d = new Date('2024-01-31T00:00:00Z'); d.setUTCMonth(1); console.log(d.toISOString())\"",
        aggregated_output: '2024-03-02T00:00:00.000Z\n',
      },
    }),
  ].join('\n'));

  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'The month and date overflow are related.',
    events,
  }), false);
  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'setUTCMonth runs while day 31 is still retained, so February normalizes the overflow into March.',
    events,
  }), true);
  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'setUTCMonth applies the target month first, with day 31 retained, then February overflows into March.',
    events,
  }), true);
  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'setUTCMonth retains day 31, constructs 2024-02-31, and immediately normalizes the overflow to March.',
    events,
  }), true);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('requirement lifecycle scorer accepts one optional CSV record terminator', () => {
  const { csvMatches } = require('./scorers/develop-requirement-lifecycle');
  const expected = 'id,name,status\ncustomer-1,Ada,active';

  assert.equal(csvMatches(expected, expected), true);
  assert.equal(csvMatches(`${expected}\n`, expected), true);
  assert.equal(csvMatches(expected.replaceAll('\n', '\r\n') + '\r\n', expected), true);
  assert.equal(csvMatches(`${expected}\n\n`, expected), false);
});
