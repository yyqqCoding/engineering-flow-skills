const assert = require('node:assert/strict');
const test = require('node:test');

const { summarizeGroup } = require('../scripts/summarize-benchmarks');

function report(overrides = {}) {
  return {
    durationMs: 100,
    modelRun: { completed: true, contaminated: false },
    score: { passed: true },
    publicTests: { passed: true },
    workspaceState: { unauthorizedCommit: false },
    metrics: {
      questionMessages: 0,
      todoLists: 0,
      toolCalls: 2,
      commandExecutions: 1,
      fileChanges: 1,
      usage: {
        inputTokens: 100,
        cachedInputTokens: 20,
        outputTokens: 10,
        reasoningOutputTokens: 5,
      },
    },
    invocation: {
      passed: true,
      truePositives: ['diagnose'],
      recalledExpected: ['diagnose'],
      falsePositives: [],
      falseNegatives: [],
      collisions: [],
    },
    ...overrides,
  };
}

test('summarizes clean runs and excludes contaminated evidence', () => {
  const summary = summarizeGroup([
    report(),
    report({
      durationMs: 300,
      score: { passed: false },
      metrics: {
        questionMessages: 2,
        todoLists: 1,
        toolCalls: 4,
        commandExecutions: 3,
        fileChanges: 1,
        usage: {
          inputTokens: 300,
          cachedInputTokens: 40,
          outputTokens: 30,
          reasoningOutputTokens: 15,
        },
      },
      invocation: {
        passed: false,
        truePositives: [],
        recalledExpected: [],
        falsePositives: ['code-design'],
        falseNegatives: ['diagnose'],
        collisions: [],
      },
    }),
    report({ modelRun: { completed: true, contaminated: true } }),
  ]);

  assert.equal(summary.discoveredRuns, 3);
  assert.equal(summary.excludedContaminatedRuns, 1);
  assert.equal(summary.excludedIncompleteRuns, 0);
  assert.equal(summary.passRate, 0.5);
  assert.equal(summary.durationMs.average, 200);
  assert.equal(summary.invocation.precision, 0.5);
  assert.equal(summary.invocation.recall, 0.5);
  assert.equal(summary.ceremony.averageQuestionMessages, 1);
});

test('excludes incomplete infrastructure runs from behavioral rates and costs', () => {
  const summary = summarizeGroup([
    report(),
    report({
      durationMs: 900,
      modelRun: { completed: false, contaminated: false, timedOut: true },
      score: { passed: false },
      metrics: {
        questionMessages: 9,
        todoLists: 9,
        toolCalls: 99,
        commandExecutions: 99,
        fileChanges: 0,
        usage: {
          inputTokens: 999,
          cachedInputTokens: 0,
          outputTokens: 999,
          reasoningOutputTokens: 0,
        },
      },
    }),
  ]);

  assert.equal(summary.cleanRuns, 2);
  assert.equal(summary.excludedIncompleteRuns, 1);
  assert.equal(summary.completedRuns, 1);
  assert.equal(summary.successfulRuns, 1);
  assert.equal(summary.passRate, 1);
  assert.equal(summary.durationMs.average, 100);
  assert.equal(summary.tools.averageToolCalls, 2);
});

test('keeps different benchmark cohorts separate', () => {
  const { summarize } = require('../scripts/summarize-benchmarks');
  const result = summarize([
    { benchmark: 'example', arm: 'candidate', cohort: 'old', ...report() },
    { benchmark: 'example', arm: 'candidate', cohort: 'new', ...report() },
  ]);

  assert.deepEqual(Object.keys(result), [
    'example:candidate:new',
    'example:candidate:old',
  ]);
});
