const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { summarizeGroup } = require('../scripts/summarize-benchmarks');
const {
  filterReportsByManifest,
  validateEvidenceManifest,
} = require('../scripts/lib/evidence-manifest');

function report(overrides = {}) {
  return {
    durationMs: 100,
    modelRun: {
      completed: true,
      contaminated: false,
      modelProvider: 'provider-a',
      model: 'model-a',
      reasoningEffort: 'low',
    },
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

function recordedEnvironment(overrides = {}) {
  const identity = {
    schemaVersion: 1,
    cliName: 'codex',
    cliVersion: '0.153.4',
    nodeVersion: 'v22.21.1',
    platform: 'linux',
    arch: 'x64',
    modelProvider: 'provider-a',
    model: 'model-a',
    reasoningEffort: 'low',
    timeoutMs: 240000,
    configurationFingerprint: 'a'.repeat(64),
    ...overrides,
  };
  return {
    ...identity,
    complete: true,
    fingerprint: crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex'),
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

test('assesses recorded control-plugin invocation but skips a no-plugin baseline', () => {
  const control = summarizeGroup([
    report({ arm: 'baseline', pluginFingerprint: 'control-plugin' }),
  ]);
  const noPlugin = summarizeGroup([
    report({ arm: 'baseline', invocation: null }),
  ]);

  assert.equal(control.invocation.assessedRuns, 1);
  assert.equal(control.invocation.passingRuns, 1);
  assert.equal(noPlugin.invocation.assessedRuns, 0);
});

test('keeps different benchmark cohorts separate', () => {
  const { summarize } = require('../scripts/summarize-benchmarks');
  const result = summarize([
    { benchmark: 'example', arm: 'candidate', cohort: 'old', ...report() },
    { benchmark: 'example', arm: 'candidate', cohort: 'new', ...report() },
  ]);

  assert.equal(Object.keys(result).length, 2);
  assert.ok(Object.keys(result).some((key) => key.includes(':new:')));
  assert.ok(Object.keys(result).some((key) => key.includes(':old:')));
});

test('keeps providers, models, and reasoning levels in separate summary groups', () => {
  const { summarize } = require('../scripts/summarize-benchmarks');
  const result = summarize([
    { benchmark: 'example', arm: 'candidate', cohort: 'same', ...report() },
    {
      benchmark: 'example',
      arm: 'candidate',
      cohort: 'same',
      ...report({
        modelRun: {
          completed: true,
          contaminated: false,
          modelProvider: 'provider-a',
          model: 'model-a',
          reasoningEffort: 'high',
        },
      }),
    },
  ]);

  assert.equal(Object.keys(result).length, 2);
});

test('keeps CLI versions and execution settings in separate environment cohorts', () => {
  const { summarize } = require('../scripts/summarize-benchmarks');
  const original = recordedEnvironment();
  for (const changed of [
    recordedEnvironment({ cliVersion: '0.154.0' }),
    recordedEnvironment({ timeoutMs: 480000 }),
    recordedEnvironment({ configurationFingerprint: 'b'.repeat(64) }),
  ]) {
    const result = summarize([
      { benchmark: 'example', arm: 'candidate', cohort: 'same', reportFile: 'old.json', environment: original, ...report() },
      { benchmark: 'example', arm: 'candidate', cohort: 'same', reportFile: 'new.json', environment: changed, ...report({ score: { passed: false } }) },
    ]);
    assert.equal(Object.keys(result).length, 2);
    assert.ok(Object.keys(result).some(key => key.includes(original.fingerprint)));
    assert.ok(Object.keys(result).some(key => key.includes(changed.fingerprint)));
  }
});

test('reports without environment identity retain separate legacy provenance', () => {
  const { summarize } = require('../scripts/summarize-benchmarks');
  const result = summarize(['old-one.json', 'old-two.json'].map(reportFile => ({
    benchmark: 'example', arm: 'candidate', cohort: 'same', reportFile, ...report(),
  })));
  assert.equal(Object.keys(result).length, 2);
  for (const filename of ['old-one.json', 'old-two.json']) {
    assert.ok(Object.keys(result).some(key => key.includes(filename)));
  }
  assert.ok(Object.values(result).every(group => group.environmentIdentityVerified === false));
});

test('matching complete environments aggregate without selecting only successful behavior', () => {
  const { summarize } = require('../scripts/summarize-benchmarks');
  const result = summarize([true, false].map(passed => ({
    benchmark: 'example', arm: 'candidate', cohort: 'same', environment: recordedEnvironment(),
    ...report({ score: { passed } }),
  })));
  assert.equal(Object.keys(result).length, 1);
  const group = Object.values(result)[0];
  assert.equal(group.environmentIdentityVerified, true);
  assert.equal(group.completedRuns, 2);
  assert.equal(group.passRate, 0.5);
});

test('evidence manifest filters exact benchmark, plugin, and environment cohorts', () => {
  const manifest = {
    schemaVersion: 1,
    release: '1.0.2',
    cohorts: [
      {
        benchmark: 'example',
        arm: 'candidate',
        benchmarkFingerprint: 'bench-a',
        pluginFingerprint: 'plugin-a',
        modelProvider: 'provider-a',
        model: 'model-a',
        reasoningEffort: 'low',
        targetCompleted: 3,
        reports: ['run-a.json', 'run-b.json', 'run-c.json'],
      },
    ],
  };
  const matching = {
    reportFile: 'run-a.json',
    benchmark: 'example',
    arm: 'candidate',
    benchmarkFingerprint: 'bench-a',
    pluginFingerprint: 'plugin-a',
    modelRun: {
      modelProvider: 'provider-a',
      model: 'model-a',
      reasoningEffort: 'low',
    },
  };

  assert.deepEqual(validateEvidenceManifest(manifest), []);
  assert.deepEqual(filterReportsByManifest([
    matching,
    { ...matching, reportFile: 'run-d.json' },
    { ...matching, pluginFingerprint: 'plugin-b' },
    { ...matching, modelRun: { ...matching.modelRun, reasoningEffort: 'high' } },
  ], manifest), [matching]);
});

test('version 2 evidence selectors require matching complete execution identities', () => {
  const environment = recordedEnvironment();
  const original = { benchmark: 'example', arm: 'candidate', benchmarkFingerprint: 'bench',
    pluginFingerprint: 'plugin', reportFile: 'first.json', environment, ...report() };
  const changed = { ...original, reportFile: 'second.json',
    environment: recordedEnvironment({ cliVersion: 'new-cli' }) };
  const legacy = { ...original, environment: undefined };
  const cohort = { benchmark: 'example', arm: 'candidate', benchmarkFingerprint: 'bench',
    pluginFingerprint: 'plugin', modelProvider: 'provider-a', model: 'model-a', reasoningEffort: 'low',
    environmentFingerprint: environment.fingerprint, targetCompleted: 1,
    reports: ['first.json', 'second.json'] };
  const manifest = { schemaVersion: 2, release: '1.0.3', cohorts: [cohort] };
  assert.deepEqual(validateEvidenceManifest(manifest), []);
  assert.deepEqual(filterReportsByManifest([original, changed, legacy], manifest), [original]);
  assert.notDeepEqual(validateEvidenceManifest({ ...manifest, schemaVersion: 1 }), []);
  const unknownSelector = { ...manifest, cohorts: [{ ...cohort, cliVersion: 'ignored-before' }] };
  assert.match(validateEvidenceManifest(unknownSelector).join('\n'), /cliVersion is not a selector/);
});
