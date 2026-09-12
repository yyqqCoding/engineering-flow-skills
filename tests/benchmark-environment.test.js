const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {
  captureBenchmarkEnvironment,
  createBenchmarkEnvironment,
  environmentFingerprint,
  matchesEnvironment,
} = require('../scripts/lib/benchmark-environment');

function identity(overrides = {}) {
  return createBenchmarkEnvironment({
    cliName: 'codex', cliVersion: 'codex-cli fixture', nodeVersion: 'v22.21.1',
    platform: 'linux', arch: 'x64', modelProvider: 'fixture', model: 'fixture-model',
    reasoningEffort: 'low', timeoutMs: 240000, configurationFingerprint: 'a'.repeat(64),
    ...overrides,
  });
}

function report(environment, overrides = {}) {
  return {
    benchmark: 'example', arm: 'candidate', benchmarkFingerprint: 'benchmark', pluginFingerprint: 'plugin',
    environment,
    modelRun: { completed: true, status: 0, timedOut: false, error: null, contaminated: false,
      modelProvider: 'fixture', model: 'fixture-model', reasoningEffort: 'low' },
    metrics: { turns: 1 },
    score: { passed: true }, publicTests: { passed: true }, workspaceState: { unauthorizedCommit: false },
    ...overrides,
  };
}

function configHome(t, source) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-environment-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'config.toml'), source);
  return directory;
}

function configuration(endpoint = 'https://fixture.example/v1', secret = 'SECRET_ONE') {
  return `model = "inherited-default"
approval_policy = "never"
[features]
shell_snapshot = true
[model_providers.fixture]
base_url = "${endpoint}"
wire_api = "responses"
env_key = "${secret}"
experimental_bearer_token = "${secret}"
http_headers = { Authorization = "${secret}" }
[plugins.local]
path = "/tmp/unrelated-plugin"
`;
}

function capture(codexHome, values = {}) {
  return captureBenchmarkEnvironment({
    cliVersion: 'codex-cli fixture', codexHome,
    env: { HOME: path.dirname(codexHome), CODEX_HOME: codexHome, BENCH_MODEL_PROVIDER: 'fixture',
      BENCH_MODEL: 'fixture-model', BENCH_REASONING_EFFORT: 'low' },
    ...values,
  });
}

test('environment matching requires a verified complete identity for each execution dimension', () => {
  const original = identity();
  assert.equal(environmentFingerprint(report(original)), original.fingerprint);
  assert.equal(matchesEnvironment(report(original), identity()), true);
  for (const changed of [
    { cliName: 'another-client' }, { cliVersion: 'another-version' }, { nodeVersion: 'v24.0.0' },
    { platform: 'win32' }, { arch: 'arm64' }, { modelProvider: 'another-provider' },
    { model: 'another-model' }, { reasoningEffort: 'high' }, { timeoutMs: 480000 },
    { configurationFingerprint: 'b'.repeat(64) },
  ]) assert.equal(matchesEnvironment(report(original), identity(changed)), false, JSON.stringify(changed));

  for (const invalid of [
    undefined, { ...original, complete: false }, { ...original, fingerprint: 'b'.repeat(64) },
    { ...original, cliVersion: 'tampered' }, identity({ model: null }), identity({ modelProvider: null }),
  ]) assert.equal(matchesEnvironment(report(invalid), original), false);
  assert.equal(matchesEnvironment(report(original), identity({ model: null })), false);
  assert.equal(environmentFingerprint(report(original, { modelRun: { model: 'contradictory' } })), null);
});

test('capture records the actual runtime and timeout without guessing inherited model selections', (t) => {
  const directory = configHome(t, configuration());
  const captured = capture(directory, { timeoutMs: 12000 });
  assert.equal(captured.complete, true);
  assert.equal(captured.cliName, 'codex');
  assert.equal(captured.cliVersion, 'codex-cli fixture');
  assert.equal(captured.nodeVersion, process.version);
  assert.equal(captured.platform, process.platform);
  assert.equal(captured.arch, process.arch);
  assert.equal(captured.timeoutMs, 12000);
  assert.equal(captured.model, 'fixture-model');

  for (const missing of ['BENCH_MODEL', 'BENCH_MODEL_PROVIDER']) {
    const env = { BENCH_MODEL: 'fixture-model', BENCH_MODEL_PROVIDER: 'fixture' };
    delete env[missing];
    const incomplete = capture(directory, { env });
    assert.equal(incomplete.complete, false, missing);
    assert.equal(incomplete.fingerprint, null, missing);
  }
});

test('provider endpoints and execution flags change identity while credentials and temporary homes do not', (t) => {
  const first = configHome(t, configuration('https://user:SECRET_ONE@fixture.example/v1?key=SECRET_ONE'));
  const second = configHome(t, configuration('https://user:SECRET_TWO@fixture.example/v1?key=SECRET_TWO', 'SECRET_TWO'));
  fs.writeFileSync(path.join(first, 'auth.json'), '{"token":"AUTH_ONE"}');
  fs.writeFileSync(path.join(second, 'auth.json'), '{"token":"AUTH_TWO"}');
  const initial = capture(first);
  const rotatedCredentials = capture(second);
  assert.equal(initial.fingerprint, rotatedCredentials.fingerprint);
  assert.doesNotMatch(JSON.stringify(initial), /SECRET|AUTH|fixture\.example|\/tmp\//);

  for (const changed of [
    configuration('https://other.example/v1'),
    configuration().replace('shell_snapshot = true', 'shell_snapshot = false'),
    configuration().replace('approval_policy = "never"', 'approval_policy = "on-request"'),
  ]) {
    fs.writeFileSync(path.join(second, 'config.toml'), changed);
    assert.notEqual(capture(second).fingerprint, initial.fingerprint);
  }
});

test('explicit endpoint overrides replace inherited connection settings without retaining API keys', (t) => {
  const first = configHome(t, configuration('https://one.example/v1'));
  const second = configHome(t, configuration('https://two.example/v1'));
  const env = { BENCH_MODEL_PROVIDER: 'fixture', BENCH_MODEL: 'fixture-model',
    BENCH_BASE_URL: 'https://override.example/v1', BENCH_API_KEY: 'PRIVATE_API_KEY' };
  const captured = capture(first, { env });
  assert.equal(captured.fingerprint, capture(second, { env }).fingerprint);
  assert.notEqual(captured.fingerprint, capture(second, {
    env: { ...env, BENCH_BASE_URL: 'https://changed.example/v1' },
  }).fingerprint);
  assert.doesNotMatch(JSON.stringify(captured), /PRIVATE_API_KEY|override\.example/);
});

test('unsupported provider configuration remains incomplete instead of certifying an alias', (t) => {
  const directory = configHome(t, 'model = "inherited"\n');
  assert.equal(capture(directory).complete, false);
  fs.writeFileSync(path.join(directory, 'config.toml'), configuration().replace(
    '"https://fixture.example/v1"', '"not a URL"',
  ));
  assert.equal(capture(directory).complete, false);
  fs.writeFileSync(path.join(directory, 'config.toml'), configuration('https://fixture.example/v1?route=unknown'));
  assert.equal(capture(directory).complete, false);
});

test('the built-in provider environment endpoint participates without credential values', (t) => {
  const directory = configHome(t, '');
  const env = { BENCH_MODEL_PROVIDER: 'openai', BENCH_MODEL: 'fixture-model',
    OPENAI_BASE_URL: 'https://one.example/v1?api_key=FIRST_KEY' };
  const original = capture(directory, { env });
  assert.equal(original.complete, true);
  assert.equal(original.fingerprint, capture(directory, {
    env: { ...env, OPENAI_BASE_URL: 'https://one.example/v1?api_key=SECOND_KEY' },
  }).fingerprint);
  assert.notEqual(original.fingerprint, capture(directory, {
    env: { ...env, OPENAI_BASE_URL: 'https://two.example/v1' },
  }).fingerprint);
});

test('cohort filling counts only the selected complete environment and retains behavioral failures', () => {
  const filename = path.resolve(__dirname, '../scripts/fill-codex-cohort.js');
  const loaded = { exports: {} };
  const logs = [];
  const expected = identity();
  const helper = require('../scripts/lib/benchmark-environment');
  function isolatedRequire(name) {
    if (name === 'node:fs') return { readFileSync: () => JSON.stringify({ example: {} }) };
    if (name === 'node:path') return path;
    if (name === 'node:child_process') return { spawn() { throw new Error('Model execution is forbidden'); } };
    if (name === './lib/env-file') return { loadEnvFile() {} };
    if (name === './lib/benchmark-fingerprints') return {
      fingerprintBenchmark: () => 'benchmark', fingerprintCandidate: () => 'plugin',
    };
    if (name === './lib/benchmark-environment') return { ...helper, captureBenchmarkEnvironment: () => expected };
    throw new Error(`Unexpected module ${name}`);
  }
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require: isolatedRequire, module: loaded, exports: loaded.exports, __dirname: path.dirname(filename),
    process: { argv: ['node', filename, 'example'], env: { BENCH_ARMS: 'candidate', BENCH_TARGET_COMPLETED: '2' },
      stderr: { write: text => logs.push(text) } },
  }, { filename });
  const { buildMissingJobs } = loaded.exports;
  assert.equal(buildMissingJobs([report(expected), report(expected, { score: { passed: false } })]).length, 0);
  for (const other of [undefined, identity({ cliVersion: 'old' }), identity({ model: 'other-model' }),
    identity({ modelProvider: 'other-provider' }), identity({ timeoutMs: 480000 })]) {
    assert.equal(buildMissingJobs([report(expected), report(other)]).length, 1);
  }
  assert.throws(() => buildMissingJobs([report(expected)], identity({ model: null })), /complete execution environment/);
});
