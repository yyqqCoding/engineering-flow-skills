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
    const result = childProcess.spawnSync('npm', ['test'], {
      cwd: path.join(ROOT, benchmark.fixture),
      encoding: 'utf8',
    });
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
