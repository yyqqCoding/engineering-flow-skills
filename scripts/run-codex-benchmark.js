#!/usr/bin/env node

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  assessInvocation,
  detectContamination,
  parseJsonl,
  redactSecrets,
  withoutConfiguredPlugins,
} = require('./lib/benchmark-utils');
const { buildAdditionalContext } = require('../hooks/user-prompt-submit');
const {
  fingerprintBenchmark,
  fingerprintCandidate,
} = require('./lib/benchmark-fingerprints');
const { loadEnvFile } = require('./lib/env-file');

const ROOT = path.resolve(__dirname, '..');
loadEnvFile(path.join(ROOT, '.env'));
const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'benchmarks.json'), 'utf8'));

const benchmarkName = process.argv[2];
const arm = process.argv[3] || 'candidate';
const timeoutMs = Number(process.env.BENCH_TIMEOUT_MS || 240000);
const reasoningEffort = process.env.BENCH_REASONING_EFFORT || 'medium';
const heartbeatMs = Number(process.env.BENCH_HEARTBEAT_MS || 15000);
const modelProvider = process.env.BENCH_MODEL_PROVIDER || '';
const model = process.env.BENCH_MODEL || '';
const baseUrl = process.env.BENCH_BASE_URL || '';
const apiKey = process.env.BENCH_API_KEY || '';

if (!benchmarks[benchmarkName] || !['baseline', 'candidate'].includes(arm)) {
  process.stderr.write('Usage: node scripts/run-codex-benchmark.js <benchmark> <baseline|candidate>\n');
  process.stderr.write(`Benchmarks: ${Object.keys(benchmarks).join(', ')}\n`);
  process.exit(2);
}

if (modelProvider && !/^[A-Za-z0-9_-]+$/.test(modelProvider)) {
  throw new Error('BENCH_MODEL_PROVIDER may contain only letters, digits, underscores, and hyphens');
}
if (baseUrl) {
  const parsedUrl = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('BENCH_BASE_URL must use http or https');
  }
  if (!modelProvider) throw new Error('BENCH_MODEL_PROVIDER is required with BENCH_BASE_URL');
  if (!model) throw new Error('BENCH_MODEL is required with BENCH_BASE_URL');
  if (!apiKey) throw new Error('BENCH_API_KEY is required with BENCH_BASE_URL');
}

function run(command, args, options = {}) {
  const result = childProcess.spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });

  if (result.status !== 0) {
    const rendered = [command, ...args].join(' ');
    const details = redactSecrets(`${result.stdout}\n${result.stderr}`);
    throw new Error(`${rendered} failed (${result.status})\n${details}`);
  }

  return result;
}

function runStreaming(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = childProcess.spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const outputFd = fs.openSync(options.outputPath, 'w');
    const stdout = [];
    const stderr = [];
    let spawnError = null;
    let timedOut = false;
    let forceKillTimer = null;

    child.stdout.on('data', (chunk) => {
      stdout.push(chunk);
      fs.writeSync(outputFd, chunk);
    });
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', (error) => {
      spawnError = error;
    });

    const heartbeat = heartbeatMs > 0 ? setInterval(() => {
      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
      process.stderr.write(`[benchmark] ${benchmarkName}/${arm} still running (${elapsedSeconds}s)\n`);
    }, heartbeatMs) : null;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      forceKillTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
    }, timeoutMs);

    child.on('close', (status, signal) => {
      clearTimeout(timeout);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      if (heartbeat) clearInterval(heartbeat);
      fs.closeSync(outputFd);
      resolve({
        status,
        signal,
        error: spawnError,
        timedOut,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
  });
}

async function main() {
  const benchmark = benchmarks[benchmarkName];
  const benchmarkFingerprint = fingerprintBenchmark(ROOT, benchmark);
  const candidateFingerprint = fingerprintCandidate(ROOT);
  const cohort = arm === 'candidate'
    ? `${benchmarkFingerprint}-${candidateFingerprint}`
    : benchmarkFingerprint;
  const runId = `${Date.now()}-${process.pid}`;
  const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), `engineering-flow-${benchmarkName}-${arm}-`));
  const workspace = path.join(runRoot, 'workspace');
  const testHome = fs.mkdtempSync(path.join(os.tmpdir(), `engineering-flow-home-${arm}-`));
  const codexHome = path.join(testHome, '.codex');
  const resultDir = path.join(ROOT, 'benchmark-results');

  fs.cpSync(path.join(ROOT, benchmark.fixture), workspace, { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(resultDir, { recursive: true });

  const authPath = path.join(os.homedir(), '.codex', 'auth.json');
  const realCodexHome = path.join(os.homedir(), '.codex');
  if (!fs.existsSync(authPath)) {
    throw new Error(`Codex authentication not found at ${authPath}`);
  }
  fs.symlinkSync(authPath, path.join(codexHome, 'auth.json'));

  for (const entry of fs.readdirSync(realCodexHome, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.toml')) {
      const source = fs.readFileSync(path.join(realCodexHome, entry.name), 'utf8');
      const isolated = entry.name === 'config.toml' ? withoutConfiguredPlugins(source) : source;
      fs.writeFileSync(path.join(codexHome, entry.name), isolated);
    }
  }

  run('git', ['init', '-b', 'main'], { cwd: workspace });
  run('git', ['config', 'user.email', 'benchmark@example.invalid'], { cwd: workspace });
  run('git', ['config', 'user.name', 'Benchmark'], { cwd: workspace });
  run('git', ['add', '.'], { cwd: workspace });
  run('git', ['commit', '-m', 'fixture baseline'], { cwd: workspace });
  const initialHead = run('git', ['rev-parse', 'HEAD'], { cwd: workspace }).stdout.trim();

  if (benchmark.setup) {
    const setupPath = path.join(ROOT, benchmark.setup);
    delete require.cache[require.resolve(setupPath)];
    require(setupPath)(workspace);
  }
  const initialStatus = run('git', ['status', '--short'], { cwd: workspace }).stdout;

  const codexEnv = {
    ...process.env,
    HOME: testHome,
    USERPROFILE: testHome,
    CODEX_HOME: codexHome,
  };

  if (arm === 'candidate') {
    run('codex', ['plugin', 'marketplace', 'add', ROOT, '--json'], { env: codexEnv });
    run('codex', ['plugin', 'add', 'engineering-flow@engineering-flow', '--json'], { env: codexEnv });
  }

  const outputPath = path.join(resultDir, `${benchmarkName}-${arm}-${runId}.jsonl`);
  const finalPath = path.join(runRoot, 'final.txt');
  const startedAt = Date.now();
  const configOverrides = [
    `model_reasoning_effort=${JSON.stringify(reasoningEffort)}`,
  ];
  if (baseUrl) {
    const providerKey = `model_providers.${modelProvider}`;
    configOverrides.push(
      `${providerKey}.name=${JSON.stringify('Benchmark environment provider')}`,
      `${providerKey}.base_url=${JSON.stringify(baseUrl)}`,
      `${providerKey}.wire_api=${JSON.stringify('responses')}`,
      `${providerKey}.env_key=${JSON.stringify('BENCH_API_KEY')}`,
    );
  }
  if (modelProvider) {
    configOverrides.push(`model_provider=${JSON.stringify(modelProvider)}`);
  }
  if (model) configOverrides.push(`model=${JSON.stringify(model)}`);

  const codex = await runStreaming('codex', [
    'exec',
    '--ephemeral',
    '--json',
    '--dangerously-bypass-hook-trust',
    ...configOverrides.flatMap((override) => ['-c', override]),
    '-s',
    'workspace-write',
    '-C',
    workspace,
    '-o',
    finalPath,
    benchmark.prompt,
  ], {
    cwd: workspace,
    env: codexEnv,
    outputPath,
  });
  const codexStdout = codex.stdout || '';
  const codexStderr = redactSecrets(codex.stderr);
  const contaminated = detectContamination(`${codexStdout}\n${codexStderr}`);
  const metrics = parseJsonl(codexStdout);
  const routedSkills = arm === 'candidate'
    ? (buildAdditionalContext(benchmark.prompt)?.requestedSkills || [])
    : [];
  metrics.skillFileReads = metrics.invokedSkills;
  metrics.routedSkills = routedSkills;
  metrics.invokedSkills = [...new Set([...metrics.skillFileReads, ...routedSkills])];
  const invocation = arm === 'candidate'
    ? assessInvocation(metrics.invokedSkills, benchmark.invocation)
    : null;

  const finalMessage = fs.existsSync(finalPath) ? fs.readFileSync(finalPath, 'utf8') : '';
  const scorerPath = path.join(ROOT, benchmark.scorer);
  let score;
  try {
    delete require.cache[require.resolve(scorerPath)];
    score = require(scorerPath)(workspace, { finalMessage, events: codexStdout });
  } catch (error) {
    score = {
      passed: false,
      error: String(error.stack || error.message || error),
    };
  }
  const publicTests = childProcess.spawnSync('npm', ['test'], {
    cwd: workspace,
    encoding: 'utf8',
    timeout: 60 * 1000,
  });
  const diff = run('git', ['diff', '--', '.'], { cwd: workspace }).stdout;
  const finalStatus = run('git', ['status', '--short'], { cwd: workspace }).stdout;
  const finalHead = run('git', ['rev-parse', 'HEAD'], { cwd: workspace }).stdout.trim();
  const modelCompleted = codex.status === 0 && !codex.timedOut && !codex.error;

  const report = {
    benchmark: benchmarkName,
    arm,
    cohort,
    benchmarkFingerprint,
    candidateFingerprint: arm === 'candidate' ? candidateFingerprint : null,
    durationMs: Date.now() - startedAt,
    workspace,
    modelRun: {
      completed: modelCompleted,
      status: codex.status,
      signal: codex.signal,
      timedOut: codex.timedOut,
      error: codex.error ? String(codex.error.message || codex.error) : null,
      stderr: codexStderr,
      reasoningEffort,
      modelProvider: modelProvider || null,
      model: model || null,
      timeoutMs,
      contaminated,
    },
    metrics,
    invocation,
    score,
    publicTests: {
      passed: publicTests.status === 0,
      stdout: publicTests.stdout,
      stderr: publicTests.stderr,
    },
    workspaceState: {
      initialStatus,
      finalStatus,
      unauthorizedCommit: initialHead !== finalHead,
    },
    finalMessage,
    diff,
    events: outputPath,
  };

  const reportPath = path.join(resultDir, `${benchmarkName}-${arm}-${runId}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!modelCompleted) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${redactSecrets(error.stack || error.message || error)}\n`);
  process.exitCode = 1;
});
