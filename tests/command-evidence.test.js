const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  hasPassingTestCommand,
  observesRegressionBeforeRepair,
} = require('./scorers/workflow-transition-evidence');

let directory;
let passing;
let failing;
let sequence = 0;

test.before(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-command-evidence-'));
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  const run = (filename, expected) => {
    const target = path.join(directory, filename);
    fs.writeFileSync(target, `const assert = require('node:assert/strict');
require('node:test')('accepted result', () => assert.equal(2 + 2, ${expected}));
`);
    return childProcess.spawnSync(process.execPath, ['--test', '--test-reporter=tap', target], {
      encoding: 'utf8', env: environment,
    });
  };
  passing = run('passing.test.js', 4);
  failing = run('failing.test.js', 5);
  assert.equal(passing.status, 0, passing.stderr);
  assert.equal(failing.status, 1, failing.stderr);
});

test.after(() => fs.rmSync(directory, { recursive: true, force: true }));

function command(result, fields = {}) {
  return {
    type: 'command_execution', command: 'npm test', exit_code: result.status,
    aggregated_output: result.stdout + result.stderr, ...fields,
  };
}

function turn(items) {
  const events = path.join(directory, `events-${sequence++}.jsonl`);
  fs.writeFileSync(events, items.map((item) => JSON.stringify({ type: 'item.completed', item })).join('\n'));
  return { events };
}

function repair(before, after) {
  return turn([
    { type: 'file_change', changes: [{ path: 'access.test.js' }] },
    before,
    { type: 'file_change', changes: [{ path: 'src/access.js' }] },
    after,
  ]);
}

function validatorFailure(output) {
  return command(passing, {
    command: "/bin/bash -lc 'npm test && node validate-record.js --mode ready --finalize'",
    exit_code: 1,
    aggregated_output: passing.stdout + output,
  });
}

test('complete passing TAP survives a later requirement-validator failure', () => {
  const item = validatorFailure('Requirement record validation failed:\n- record still contains Pending\n');
  assert.equal(hasPassingTestCommand(turn([item])), true);
  assert.equal(hasPassingTestCommand(turn([command(passing)])), true);
});

test('regression evidence uses the test result when a later command fails', () => {
  const green = validatorFailure('Requirement record validation failed:\n');
  assert.equal(observesRegressionBeforeRepair(
    repair(command(failing), green), 'src/access.js', 'access.test.js',
  ), true);
});

test('a validator assertion after passing tests is not a failing regression', () => {
  const notRed = validatorFailure('AssertionError [ERR_ASSERTION]: validator failed\nfail 1\n');
  assert.equal(observesRegressionBeforeRepair(
    repair(notRed, command(passing)), 'src/access.js', 'access.test.js',
  ), false);
});

test('a masked failing TAP result is still red and cannot count as passing', () => {
  const masked = command(failing, { command: 'npm test || true', exit_code: 0 });
  assert.equal(hasPassingTestCommand(turn([masked])), false);
  assert.equal(observesRegressionBeforeRepair(
    repair(masked, command(passing)), 'src/access.js', 'access.test.js',
  ), true);
});

test('mentioning a test command while printing saved TAP is not test execution', () => {
  for (const text of [
    "printf '%s\\n' 'npm test'",
    '/bin/bash -lc "echo \'npm test\'"',
    'node -e "console.log(\'npm test\')"',
    'cat saved.tap # npm test',
    'npm test-not-running',
    'node --test-reporter=tap script.js',
  ]) assert.equal(hasPassingTestCommand(turn([command(passing, { command: text })])), false, text);
});

test('empty or incomplete TAP does not establish passing test evidence', () => {
  for (const output of [
    '',
    '# tests 1\n# pass 1\n# fail 0\n',
    passing.stdout.replace(/^1\.\.\d+\r?\n/m, ''),
    passing.stdout.replace(/^# duration_ms[^\n]*\n?/m, ''),
  ]) assert.equal(hasPassingTestCommand(turn([command(passing, { aggregated_output: output })])), false);
});

test('replayed TAP around an unexecuted or unstarted test is not passing evidence', () => {
  for (const text of [
    'cat saved.tap; false && npm test; true',
    'npm test || cat saved.tap',
    'npm test; cat saved.tap',
  ]) assert.equal(hasPassingTestCommand(turn([command(passing, {
    command: text, aggregated_output: 'npm: command not found\n' + passing.stdout,
  })])), false, text);
});

test('test startup failures cannot count as green or as a failing regression', () => {
  for (const item of [
    command(failing, { exit_code: null, aggregated_output: 'spawn npm ENOENT' }),
    command(failing, { exit_code: 127, aggregated_output: 'npm: command not found' }),
    command(failing, { aggregated_output: 'AssertionError: test launcher failed before starting tests' }),
  ]) {
    assert.equal(hasPassingTestCommand(turn([item])), false);
    assert.equal(observesRegressionBeforeRepair(
      repair(item, command(passing)), 'src/access.js', 'access.test.js',
    ), false);
  }
});

test('TAP totals and numbered results must agree with a completed test run', () => {
  for (const output of [
    passing.stdout.replace('# pass 1', '# pass 2'),
    passing.stdout.replace('# fail 0', '# fail 1'),
    passing.stdout.replace(/^ok 1[^\n]*\n/m, ''),
    passing.stdout.replace('1..1', '1..2'),
    passing.stdout.replace('# pass 1', '# pass 0').replace('# skipped 0', '# skipped 1'),
    passing.stdout.replace('# pass 1', '# pass 0').replace('# cancelled 0', '# cancelled 1'),
  ]) assert.equal(hasPassingTestCommand(turn([command(passing, { aggregated_output: output })])), false);
});

test('ordinary shell prefixes, CRLF, and terminal colors preserve TAP evidence', () => {
  const item = command(passing, {
    command: '/bin/bash -lc "cd fixture && npm test"',
    aggregated_output: '\u001b[32m' + passing.stdout.replaceAll('\n', '\r\n') + '\u001b[0m',
  });
  assert.equal(hasPassingTestCommand(turn([item])), true);
});
