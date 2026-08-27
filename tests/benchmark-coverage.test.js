const assert = require('node:assert/strict');
const test = require('node:test');

const {
  extractBehaviorIds,
  summarizeBenchmarkCoverage,
  validateBenchmarkCoverage,
} = require('../scripts/lib/benchmark-coverage');
const { read, readJson } = require('./helpers/repository');

const benchmarks = readJson('config/benchmarks.json');
const behaviorIds = extractBehaviorIds(read('docs/behavior-spec.md'));

test('every benchmark declares valid behavioral coverage metadata', () => {
  assert.deepEqual(validateBenchmarkCoverage(benchmarks, behaviorIds), []);
});

test('coverage reporting retains every behavior id and configured scenario', () => {
  const summary = summarizeBenchmarkCoverage(benchmarks, behaviorIds);

  assert.equal(summary.scenarios, Object.keys(benchmarks).length);
  assert.deepEqual(Object.keys(summary.behaviors.scenarios), behaviorIds);
  assert.equal(
    summary.behaviors.covered + summary.behaviors.uncovered.length,
    behaviorIds.length,
  );
  assert.ok(summary.profiles.positive > 0);
  assert.ok(summary.profiles.negative > 0);
  assert.ok(summary.profiles.continuity > 0);
  assert.ok(summary.profiles.overlap > 0);
  assert.ok(summary.profiles.metamorphic > 0);
  assert.ok(summary.stacks.javascript > 0);
  assert.ok(summary.stacks.python > 0);
});

test('high-risk lifecycle boundaries have executable scenario coverage', () => {
  const summary = summarizeBenchmarkCoverage(benchmarks, behaviorIds);

  for (const behaviorId of [
    'REQ-07',
    'READ-05',
    'DEBUG-02',
    'FLOW-03',
    'FLOW-04',
    'DEBUG-01',
    'REVIEW-01',
    'SAFE-01',
    'TEST-01',
    'TEST-06',
  ]) {
    assert.ok(
      summary.behaviors.scenarios[behaviorId].length > 0,
      `${behaviorId} needs at least one configured benchmark`,
    );
  }
  assert.ok(summary.transitions['checkpoint->implementation'] > 0);
  assert.ok(summary.transitions['active-workflow->cancelled'] > 0);
  assert.ok(summary.transitions['diagnosis->evidence-limited'] > 0);
  assert.deepEqual(summary.behaviors.uncovered, []);
});
