const assert = require('node:assert/strict');
const test = require('node:test');

const {
  fingerprintBenchmark,
  fingerprintCandidate,
} = require('../scripts/lib/benchmark-fingerprints');
const {
  generateEvidenceManifest,
  isReleaseEvidence,
  parseArguments,
} = require('../scripts/generate-evidence-manifest');
const { ROOT, readJson } = require('./helpers/repository');
const { createBenchmarkEnvironment } = require('../scripts/lib/benchmark-environment');

const ENVIRONMENT = createBenchmarkEnvironment({
  cliName: 'codex', cliVersion: 'fixture-cli', nodeVersion: 'v22.21.1', platform: 'linux', arch: 'x64',
  modelProvider: 'provider', model: 'model', reasoningEffort: 'low', timeoutMs: 240000,
  configurationFingerprint: 'a'.repeat(64),
});

function passingReport(overrides = {}) {
  return {
    benchmark: 'post-implementation-testing',
    arm: 'candidate',
    benchmarkFingerprint: 'benchmark-fingerprint',
    pluginFingerprint: 'plugin-fingerprint',
    environment: ENVIRONMENT,
    modelRun: {
      completed: true,
      status: 0,
      timedOut: false,
      error: null,
      contaminated: false,
      modelProvider: 'provider',
      model: 'model',
      reasoningEffort: 'low',
    },
    score: { passed: true },
    publicTests: { passed: true },
    workspaceState: { unauthorizedCommit: false },
    metrics: { turns: 1 },
    reportFile: 'passing.json',
    ...overrides,
  };
}

test('release evidence eligibility keeps behavioral failures but excludes contamination', () => {
  assert.equal(isReleaseEvidence(passingReport()), true);
  assert.equal(isReleaseEvidence(passingReport({ score: { passed: false } })), true);
  assert.equal(isReleaseEvidence(passingReport({ publicTests: { passed: false } })), true);
  assert.equal(isReleaseEvidence(passingReport({
    workspaceState: { unauthorizedCommit: true },
  })), true);
  assert.equal(isReleaseEvidence(passingReport({
    modelRun: { ...passingReport().modelRun, contaminated: true },
  })), false);
  assert.equal(isReleaseEvidence(passingReport({ metrics: { turns: 0 } })), false);
});

test('generator refreshes current fingerprints and selects deterministic clean reports', () => {
  const benchmarks = readJson('config/benchmarks.json');
  const packageJson = readJson('package.json');
  const benchmark = benchmarks['post-implementation-testing'];
  const benchmarkFingerprint = fingerprintBenchmark(ROOT, benchmark);
  const pluginFingerprint = fingerprintCandidate(ROOT);
  const template = {
    schemaVersion: 2,
    release: '0.0.1',
    cohorts: [{
      benchmark: 'post-implementation-testing',
      arm: 'candidate',
      benchmarkFingerprint: 'old-benchmark',
      pluginFingerprint: 'old-plugin',
      modelProvider: 'provider',
      model: 'model',
      reasoningEffort: 'low',
      environmentFingerprint: ENVIRONMENT.fingerprint,
      targetCompleted: 1,
      reports: ['old.json'],
    }],
  };
  const reports = ['later.json', 'earlier.json'].map((reportFile) => passingReport({
    benchmarkFingerprint,
    pluginFingerprint,
    reportFile,
  }));
  reports.push(
    passingReport({ benchmarkFingerprint, pluginFingerprint, reportFile: 'aaa-legacy.json', environment: undefined }),
    passingReport({ benchmarkFingerprint, pluginFingerprint, reportFile: 'aaa-other-cli.json',
      environment: createBenchmarkEnvironment({ ...ENVIRONMENT, cliVersion: 'different-cli' }) }),
  );

  const generated = generateEvidenceManifest(
    ROOT,
    template,
    benchmarks,
    packageJson,
    reports,
  );

  assert.equal(generated.release, packageJson.version);
  assert.equal(generated.cohorts[0].benchmarkFingerprint, benchmarkFingerprint);
  assert.equal(generated.cohorts[0].pluginFingerprint, pluginFingerprint);
  assert.deepEqual(generated.cohorts[0].reports, ['earlier.json']);
});

test('generator fails instead of publishing an incomplete cohort', () => {
  const benchmarks = readJson('config/benchmarks.json');
  const template = {
    schemaVersion: 2,
    release: '1.0.2',
    cohorts: [{
      benchmark: 'post-implementation-testing',
      arm: 'candidate',
      benchmarkFingerprint: 'old-benchmark',
      pluginFingerprint: 'old-plugin',
      modelProvider: 'provider',
      model: 'model',
      reasoningEffort: 'low',
      environmentFingerprint: ENVIRONMENT.fingerprint,
      targetCompleted: 1,
      reports: ['old.json'],
    }],
  };
  assert.throws(
    () => generateEvidenceManifest(ROOT, template, benchmarks, { version: '1.0.2' }, []),
    /has 0\/1 matching clean reports/,
  );
});

test('historical templates remain readable but cannot generate new environment-certified evidence', () => {
  const template = readJson('config/evidence-manifest.json');
  assert.throws(() => generateEvidenceManifest(
    ROOT, template, readJson('config/benchmarks.json'), readJson('package.json'), [],
  ), /schemaVersion 2 template with an explicit environmentFingerprint/);
});

test('generator arguments require a template and keep output opt-in', () => {
  assert.deepEqual(parseArguments(['--template', 'config/evidence-manifest.json']), {
    template: 'config/evidence-manifest.json',
    output: null,
    results: 'benchmark-results',
  });
  assert.throws(() => parseArguments([]), /--template requires a path/);
  assert.throws(() => parseArguments(['--output', 'result.json']), /--template requires a path/);
});
