const assert = require('node:assert/strict');
const test = require('node:test');

const {
  runFixtureVerification,
  verificationForBenchmark,
} = require('../scripts/lib/benchmark-verification');

test('benchmark verification defaults to npm test', () => {
  assert.deepEqual(verificationForBenchmark({}), {
    command: 'npm',
    args: ['test'],
  });
});

test('benchmark verification accepts a fixture-specific command', () => {
  assert.deepEqual(verificationForBenchmark({
    verification: {
      command: 'python3',
      args: ['-m', 'unittest', 'discover', '-s', 'tests'],
    },
  }), {
    command: 'python3',
    args: ['-m', 'unittest', 'discover', '-s', 'tests'],
  });
});

test('benchmark verification rejects malformed commands', () => {
  assert.throws(
    () => verificationForBenchmark({ verification: { command: '', args: [] } }),
    /command must be a non-empty string/,
  );
  assert.throws(
    () => verificationForBenchmark({ verification: { command: 'node', args: 'test.js' } }),
    /args must be an array of strings/,
  );
});

test('benchmark verification never treats a spawn error as a pass', () => {
  const result = runFixtureVerification(process.cwd(), {
    verification: {
      command: 'engineering-flow-command-that-does-not-exist',
      args: [],
    },
  });

  assert.equal(result.passed, false);
  assert.ok(result.error);
});
