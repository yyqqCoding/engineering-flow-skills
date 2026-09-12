const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  hasPassingPythonTestCommand,
  pythonTestCommandResult,
  unittestResult,
} = require('./scorers/python-test-evidence');
const { mutationDetected } = require('./scorers/develop-python-clear-task');

const COMMAND = 'python3 -B -m unittest discover -s tests';
let directory;
let results;
let sequence = 0;

test.before(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-python-evidence-'));
  fs.mkdirSync(path.join(directory, 'tests'));
  const run = (source, args = []) => {
    fs.writeFileSync(path.join(directory, 'tests/test_evidence.py'), source);
    return childProcess.spawnSync('python3', ['-B', '-m', 'unittest', 'discover', '-s', 'tests', ...args], {
      cwd: directory, encoding: 'utf8', timeout: 10000,
    });
  };
  const source = 'import unittest\nclass EvidenceTest(unittest.TestCase):\n    def test_value(self):\n        self.assertEqual(2 + 2, 4)\n';
  const partialSkipSource = source + '    def test_partial_skips(self):\n'
    + '        for value in [1, 2]:\n'
    + '            with self.subTest(value=value):\n'
    + '                self.skipTest("example subtest")\n';
  results = {
    passing: run(source),
    verbose: run(source, ['-v']),
    quiet: run(source, ['-q']),
    failing: run(source.replace('2 + 2, 4', '2 + 2, 5')),
    error: run(source.replace('self.assertEqual(2 + 2, 4)', 'raise TypeError("value must be an integer")')),
    skipped: run(source.replace('    def test_value', '    @unittest.skip("not exercised")\n    def test_value')),
    expected: run(source.replace('    def test_value', '    @unittest.expectedFailure\n    def test_value').replace('2 + 2, 4', '2 + 2, 5')),
    partialSkipped: run(partialSkipSource),
    quietPartialSkipped: run(partialSkipSource, ['-q']),
    invalid: run('this is invalid Python syntax\n'),
    empty: run('import unittest\n'),
  };
  for (const name of ['passing', 'verbose', 'quiet', 'skipped', 'expected', 'partialSkipped', 'quietPartialSkipped']) {
    assert.equal(results[name].status, 0, results[name].stderr);
  }
  // Python versions differ on the exit code for a successful discovery with no tests.
  assert.ok([0, 5].includes(results.empty.status), results.empty.stderr);
  for (const name of ['failing', 'error', 'invalid']) assert.equal(results[name].status, 1, results[name].stderr);
});

test.after(() => fs.rmSync(directory, { recursive: true, force: true }));

function item(result, fields = {}) {
  return {
    type: 'command_execution', command: COMMAND, exit_code: result.status,
    aggregated_output: result.stdout + result.stderr, ...fields,
  };
}

function turn(command) {
  const events = path.join(directory, `events-${sequence++}.jsonl`);
  fs.writeFileSync(events, JSON.stringify({ type: 'item.completed', item: command }) + '\n');
  return { events };
}

test('real unittest evidence accepts stderr and ordinary reporter and shell options', () => {
  assert.equal(results.passing.stdout, '');
  for (const [name, command] of [
    ['passing', COMMAND],
    ['passing', "python3 -B -m unittest discover --start-directory=./tests/ --pattern='test*.py' --verbose"],
    ['verbose', '/usr/bin/python3 -m unittest discover -s "tests" -v'],
    ['quiet', '/bin/bash -lc "cd fixture && python3 -B -m unittest discover -s tests -q"'],
  ]) {
    assert.equal(unittestResult(results[name].stderr), 'passed', name);
    assert.equal(hasPassingPythonTestCommand(turn(item(results[name], { command }))), true, name);
  }
  assert.equal(pythonTestCommandResult(item(results.passing, {
    aggregated_output: '\u001b[32m' + results.passing.stderr.replaceAll('\n', '\r\n') + '\u001b[0m',
  })), 'passed');
});

test('unittest results survive later command failure and cannot be masked with shell success', () => {
  assert.equal(pythonTestCommandResult(item(results.passing, {
    command: `/bin/bash -lc '${COMMAND} && git diff --check'`, exit_code: 1,
    aggregated_output: results.passing.stderr + 'another check failed\n',
  })), 'passed');
  assert.equal(pythonTestCommandResult(item(results.failing, {
    command: COMMAND + ' || true', exit_code: 0,
  })), 'failed');
});

test('merging stderr into captured stdout preserves fresh unittest evidence', () => {
  for (const command of [
    COMMAND + ' 2>&1',
    `/bin/bash -lc '${COMMAND} 2>&1'`,
    `/bin/bash -lc '${COMMAND} 2>&1 && git diff --check'`,
  ]) assert.equal(pythonTestCommandResult(item(results.passing, { command })), 'passed', command);
  for (const command of [
    COMMAND + " '2>&1'",
    COMMAND + ' 2>saved.out',
    COMMAND + ' >saved.out 2>&1',
  ]) assert.equal(pythonTestCommandResult(item(results.passing, { command })), null, command);
});

test('a lone unittest command cannot attribute a nonzero exit to a later command', () => {
  for (const command of [COMMAND, COMMAND + ' 2>&1', COMMAND + ' || true']) {
    assert.equal(pythonTestCommandResult(item(results.passing, { command, exit_code: 1 })), null, command);
  }
  assert.equal(pythonTestCommandResult(item(results.passing, {
    command: COMMAND + ' 2>&1 && git diff --check', exit_code: 1,
  })), 'passed');
});

test('outer shell escaping preserves quoted unittest arguments', () => {
  const command = String.raw`/bin/bash -lc "python3 -B -m unittest discover -s \"tests\""`;
  assert.equal(pythonTestCommandResult(item(results.passing, { command })), 'passed');
});

test('wrapped replay commands cannot supply fresh unittest evidence', () => {
  for (const suffix of ["sh -c 'cat saved.out'", 'env cat saved.out', 'head saved.out']) {
    assert.equal(pythonTestCommandResult(item(results.passing, {
      command: COMMAND + ' && ' + suffix,
    })), null, suffix);
  }
});

test('source diff inspection after unittest preserves the observed test result', () => {
  const command = `/bin/bash -lc '${COMMAND} && git diff --check && git diff -- src/math_utils.py tests/test_math_utils.py && git status --short'`;
  assert.equal(pythonTestCommandResult(item(results.passing, { command })), 'passed');
});

test('quoted mentions and saved unittest output are not test execution', () => {
  for (const command of [
    `printf '%s\\n' '${COMMAND}'`,
    `/bin/bash -lc "echo '${COMMAND}'"`,
    `python3 -c "print('${COMMAND}')"`,
    `'${COMMAND}'`,
    'python3 -m unittest_fake discover -s tests',
    `cat saved.out && ${COMMAND}`,
    `${COMMAND} || cat saved.out`,
    `${COMMAND}; cat saved.out`,
    `${COMMAND} && cat saved.out`,
    `${COMMAND} | tee saved.out`,
  ]) assert.equal(pythonTestCommandResult(item(results.passing, { command })), null, command);
});

test('running only old tests cannot substitute for the agreed complete discovery', () => {
  for (const command of [
    COMMAND + ' -p test_math_utils.py',
    COMMAND + ' -k test_adds_two_numbers',
    COMMAND + ' -p',
    'python3 -B -m unittest tests.test_math_utils',
    'python3 -B -m unittest discover -s other_tests',
  ]) assert.equal(pythonTestCommandResult(item(results.passing, { command })), null, command);
});

test('zero tests, skipped-only tests, and expected-failure-only tests supply no passing evidence', () => {
  for (const name of ['empty', 'skipped', 'expected']) {
    assert.equal(unittestResult(results[name].stderr), null, name);
    assert.equal(hasPassingPythonTestCommand(turn(item(results[name]))), false, name);
  }
});

test('unittest evidence requires one complete and consistent summary', () => {
  for (const output of [
    '',
    'Ran 1 test in 0.001s\n\nOK\n',
    results.passing.stderr.replace('OK', ''),
    results.passing.stderr + results.passing.stderr,
    results.passing.stderr.replace('OK', 'OK (failures=1)'),
    results.passing.stderr.replace('OK', 'OK (errors=1)'),
    results.passing.stderr.replace('OK', 'FAILED (skipped=1)'),
    results.passing.stderr.replace(/^\.\n/, 'F\n'),
  ]) assert.equal(unittestResult(output), null, output);
});

test('contradictory terminal summaries do not establish a passing unittest run', () => {
  for (const output of [
    results.passing.stderr + 'FAILED (failures=1)\n',
    'FAILED (errors=1)\n' + results.passing.stderr,
    results.failing.stderr + 'OK\n',
  ]) assert.equal(unittestResult(output), null, output);
});

test('successful tests alongside skipped subtests retain observable passing evidence', () => {
  assert.match(results.partialSkipped.stderr, /Ran 2 tests/);
  assert.match(results.partialSkipped.stderr, /OK \(skipped=2\)/);
  assert.equal(unittestResult(results.partialSkipped.stderr), 'passed');
  // Quiet output loses the successful method's progress marker and is ambiguous.
  assert.equal(unittestResult(results.quietPartialSkipped.stderr), null);
});

test('startup failures and Node TAP never count as passing unittest evidence', () => {
  for (const command of [
    item(results.passing, { exit_code: null, aggregated_output: 'spawn python3 ENOENT' }),
    item(results.passing, { exit_code: 127, aggregated_output: 'python3: command not found' }),
    item(results.passing, { aggregated_output: 'TAP version 13\nok 1 - example\n1..1\n# tests 1\n# pass 1\n# fail 0\n' }),
  ]) assert.equal(pythonTestCommandResult(command), null);
});

test('mutation evidence accepts real test failures and contract errors but rejects import or process failures', () => {
  assert.equal(mutationDetected(results.failing), true);
  assert.equal(mutationDetected(results.error), true);
  assert.equal(mutationDetected(results.invalid), false);
  assert.equal(mutationDetected(results.empty), false);
  assert.equal(mutationDetected({ ...results.failing, status: null, signal: 'SIGTERM' }), false);
  assert.equal(mutationDetected({ ...results.failing, error: new Error('spawn failed') }), false);
});
