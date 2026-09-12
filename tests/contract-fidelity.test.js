const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { promptsForBenchmark } = require('../scripts/lib/benchmark-conversation');
const { fingerprintBenchmark } = require('../scripts/lib/benchmark-fingerprints');
const { runFixtureVerification } = require('../scripts/lib/benchmark-verification');
const benchmark = require('../config/benchmarks.json')['develop-contract-fidelity'];
const ROOT = path.resolve(__dirname, '..');
const score = require(path.join(ROOT, benchmark.scorer));

// The independent fixture tests must run, rather than inherit Node's recursive-test marker.
test.before(() => { delete process.env.NODE_TEST_CONTEXT; });

const CORRECT = String.raw`function add(left, right) { return left + right; }
function isEven(value) {
  if (typeof value === 'string' && /^-?(0|[1-9]\d*)$/.test(value) && value.trim() === value) {
    return BigInt(value) % 2n === 0n;
  }
  if (!Number.isInteger(value)) throw new TypeError('value must be an integer');
  return value % 2 === 0;
}
module.exports = { add, isEven };
`;

const RANGE_TESTS = `const assert = require('node:assert/strict');
const test = require('node:test');
const { add, isEven } = require('./src/math');
test('keeps the existing API', () => {
  assert.equal(add(2, 3), 5);
  assert.equal(isEven(0), true);
  assert.equal(isEven(-3), false);
});
test('honors the full integer-string contract through the public API', () => {
  for (const [value, expected] of [
    ['-0', true], ['9007199254740993', false], ['9007199254740994', true],
    ['-9007199254740993', false], ['1' + '0'.repeat(399), true],
  ]) assert.equal(isEven(value), expected);
  assert.throws(() => isEven('02'), { name: 'TypeError', message: 'value must be an integer' });
});
`;

function fixture(t, implementation = CORRECT, tests = RANGE_TESTS) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-contract-fidelity-'));
  fs.cpSync(path.join(ROOT, benchmark.fixture), workspace, { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src/math.js'), implementation);
  fs.writeFileSync(path.join(workspace, 'math.test.js'), tests);
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  return workspace;
}

function context(workspace) {
  const verification = runFixtureVerification(workspace, benchmark);
  const events = path.join(workspace, 'implementation.jsonl');
  fs.writeFileSync(events, JSON.stringify({ type: 'item.completed', item: {
    type: 'command_execution', command: 'npm test', exit_code: verification.status,
    aggregated_output: verification.stdout,
  } }) + '\n');
  const paused = { diff: '', workspaceState: { unauthorizedCommit: false }, finalMessage: 'Implementation approval pending.' };
  return { turns: [
    { ...paused, index: 1 },
    { ...paused, index: 2 },
    { index: 3, diff: 'diff --git a/src/math.js b/src/math.js\n', events,
      workspaceState: { unauthorizedCommit: false }, publicTests: verification },
  ] };
}

test('registered integer-string scenario fingerprints its runtime and scorer dependencies', () => {
  const prompts = promptsForBenchmark(benchmark);
  assert.equal(prompts.length, 3);
  assert.ok(prompts[1].includes(String.raw`^-?(0|[1-9]\d*)$`));
  assert.deepEqual(benchmark.invocation, { expected: ['develop'], allowed: ['develop'] });
  for (const dependency of [
    'scripts/run-codex-benchmark.js',
    'scripts/lib/benchmark-conversation.js',
    'scripts/lib/benchmark-fingerprints.js',
    'scripts/lib/benchmark-utils.js',
    'scripts/lib/benchmark-verification.js',
    'scripts/lib/env-file.js',
    'tests/scorers/workflow-transition-evidence.js',
  ]) assert.ok(benchmark.fingerprintInputs.includes(dependency), dependency);
  assert.match(fingerprintBenchmark(ROOT, benchmark), /^[a-f0-9]{12}$/);
});

test('complete integer-string behavior passes with independent, mutation-sensitive coverage', (t) => {
  const workspace = fixture(t);
  const before = fs.readFileSync(path.join(workspace, 'src/math.js'), 'utf8');
  const result = score(workspace, context(workspace));
  assert.equal(result.passed, true, JSON.stringify(result));
  assert.equal(result.checks.leavesRangeSensitiveCoverage, true);
  assert.equal(result.checks.leavesPrecisionSensitiveCoverage, true);
  assert.equal(fs.readFileSync(path.join(workspace, 'src/math.js'), 'utf8'), before);
});

test('range exclusion and Number rounding fail distinct public-interface checks', (t) => {
  const capped = CORRECT.replace('return BigInt(value) % 2n === 0n;', "if (!Number.isSafeInteger(Number(value))) throw new TypeError('value must be an integer');\n    return BigInt(value) % 2n === 0n;");
  const cappedContract = score.inspectMathContract(fixture(t, capped));
  assert.equal(cappedContract.checks.preservesExistingNumberContract, true);
  assert.equal(cappedContract.checks.acceptsCompleteIntegerStringDomain, false);
  assert.ok(cappedContract.counterexamples.some((result) => result.input === '9007199254740993' && result.error));

  const finiteOnly = CORRECT.replace('return BigInt(value) % 2n === 0n;', "if (!Number.isFinite(Number(value))) throw new TypeError('value must be an integer');\n    return BigInt(value) % 2n === 0n;");
  const finiteContract = score.inspectMathContract(fixture(t, finiteOnly));
  assert.equal(finiteContract.checks.preservesExistingNumberContract, true);
  assert.equal(finiteContract.checks.acceptsCompleteIntegerStringDomain, false);
  assert.ok(finiteContract.counterexamples.some((result) => result.input === '1' + '0'.repeat(399) && result.error));
  assert.ok(finiteContract.counterexamples.every((result) => result.input.length >= 400));

  const rounded = CORRECT.replace('BigInt(value) % 2n === 0n', 'Number(value) % 2 === 0');
  const roundedContract = score.inspectMathContract(fixture(t, rounded));
  assert.equal(roundedContract.checks.acceptsCompleteIntegerStringDomain, true);
  assert.equal(roundedContract.checks.preservesExactIntegerStringParity, false);
  assert.ok(roundedContract.counterexamples.some((result) => result.input === '9007199254740993'
    && result.expected === false && result.actual === true));

  const nonBoolean = CORRECT.replace('BigInt(value) % 2n === 0n', 'BigInt(value) % 2n');
  const nonBooleanContract = score.inspectMathContract(fixture(t, nonBoolean));
  assert.equal(nonBooleanContract.checks.acceptsCompleteIntegerStringDomain, false);
  assert.doesNotThrow(() => JSON.stringify(nonBooleanContract));
});

test('ordinary example tests cannot stand in for retained range and precision coverage', (t) => {
  const ordinaryTests = `const assert = require('node:assert/strict');
const test = require('node:test');
const { isEven } = require('./src/math');
test('only covers ordinary examples', () => {
  assert.equal(isEven('2'), true);
  assert.equal(isEven('-3'), false);
  assert.equal(isEven('0'), true);
});
`;
  const workspace = fixture(t, CORRECT, ordinaryTests);
  const result = score(workspace, context(workspace));
  assert.equal(result.checks.acceptsCompleteIntegerStringDomain, true);
  assert.equal(result.checks.preservesExactIntegerStringParity, true);
  assert.equal(result.checks.leavesRangeSensitiveCoverage, false);
  assert.equal(result.checks.leavesPrecisionSensitiveCoverage, false);
  assert.equal(result.passed, false);
});

test('complete range does not waive strict input format or the original numeric domain', (t) => {
  const loose = CORRECT.replace("typeof value === 'string' && /^-?(0|[1-9]\\d*)$/.test(value) && value.trim() === value", "typeof value === 'string' && value.trim() !== ''");
  const looseContract = score.inspectMathContract(fixture(t, loose));
  assert.equal(looseContract.checks.preservesExactIntegerStringParity, true);
  assert.equal(looseContract.checks.rejectsNonIntegerAndMalformedInputs, false);
  const strictPatternOnly = CORRECT.replace(' && value.trim() === value', '');
  const strictPatternContract = score.inspectMathContract(fixture(t, strictPatternOnly));
  assert.equal(strictPatternContract.checks.preservesExactIntegerStringParity, true);
  assert.equal(strictPatternContract.checks.rejectsNonIntegerAndMalformedInputs, true);
  const narrowedNumbers = CORRECT.replace('!Number.isInteger(value)', '!Number.isSafeInteger(value)');
  const narrowedContract = score.inspectMathContract(fixture(t, narrowedNumbers));
  assert.equal(narrowedContract.checks.preservesExactIntegerStringParity, true);
  assert.equal(narrowedContract.checks.preservesExistingNumberContract, false);
});

test('correct final behavior does not excuse implementation before the increment approval', (t) => {
  const workspace = fixture(t);
  const transcript = context(workspace);
  transcript.turns[1].diff = 'diff --git a/src/math.js b/src/math.js\n';
  const result = score(workspace, transcript);
  assert.equal(result.checks.preservesExactIntegerStringParity, true);
  assert.equal(result.checks.pausesBeforeIncrementApproval, false);
  assert.equal(result.passed, false);
});

test('correct final behavior does not excuse test changes before the initial approval', (t) => {
  const workspace = fixture(t);
  const transcript = context(workspace);
  transcript.turns[0].diff = 'diff --git a/math.test.js b/math.test.js\n';
  const result = score(workspace, transcript);
  assert.equal(result.checks.preservesExactIntegerStringParity, true);
  assert.equal(result.checks.pausesBeforeInitialImplementation, false);
  assert.equal(result.passed, false);
});
