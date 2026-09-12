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
} = require('./lib/benchmark-utils');
const {
  buildCodexArgs,
  extractThreadId,
  extractTurnFailure,
  freshSessionTurnsForBenchmark,
  nativeCompactionTurnsForBenchmark,
  prepareCodexHome,
  promptsForBenchmark,
  readRequirementStates,
  resolveTurnPrompt,
} = require('./lib/benchmark-conversation');
const {
  fingerprintBenchmark,
  fingerprintCandidate,
} = require('./lib/benchmark-fingerprints');
const { runFixtureVerification } = require('./lib/benchmark-verification');
const { loadEnvFile } = require('./lib/env-file');
const { captureBenchmarkEnvironment, matchesEnvironment } = require('./lib/benchmark-environment');
const { compactCodexThread } = require('./lib/benchmark-compaction');

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
const baselinePluginRoot = process.env.BENCH_BASELINE_PLUGIN_ROOT
  ? path.resolve(process.env.BENCH_BASELINE_PLUGIN_ROOT)
  : null;

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
if (baselinePluginRoot && !fs.existsSync(path.join(baselinePluginRoot, '.codex-plugin', 'plugin.json'))) {
  throw new Error(`BENCH_BASELINE_PLUGIN_ROOT is not a Codex plugin: ${baselinePluginRoot}`);
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
    const { outputPath, label, ...spawnOptions } = options;
    const startedAt = Date.now();
    const child = childProcess.spawn(command, args, {
      ...spawnOptions,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const outputFd = fs.openSync(outputPath, 'w');
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
      process.stderr.write(
        `[benchmark] ${benchmarkName}/${arm}${label ? `/${label}` : ''} still running (${elapsedSeconds}s)\n`,
      );
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

function routePrompt(pluginRoot, prompt) {
  if (!pluginRoot) return [];
  const routerPath = path.join(pluginRoot, 'hooks', 'user-prompt-submit.js');
  try {
    delete require.cache[require.resolve(routerPath)];
    const routing = require(routerPath).buildAdditionalContext(prompt);
    return routing?.requestedSkills || [];
  } catch {
    return [];
  }
}

function createCodexEnvironment(pluginRoot) {
  const testHome = fs.mkdtempSync(path.join(os.tmpdir(), `engineering-flow-home-${arm}-`));
  const codexHome = path.join(testHome, '.codex');
  prepareCodexHome(codexHome, path.join(os.homedir(), '.codex'));
  const env = { ...process.env, HOME: testHome, USERPROFILE: testHome, CODEX_HOME: codexHome };
  if (pluginRoot) {
    run('codex', ['plugin', 'marketplace', 'add', pluginRoot, '--json'], { env });
    run('codex', ['plugin', 'add', 'engineering-flow@engineering-flow', '--json'], { env });
  }
  return env;
}

function captureEnvironment(env) {
  return captureBenchmarkEnvironment({
    env,
    codexHome: env.CODEX_HOME,
    timeoutMs,
    cliVersion: run('codex', ['--version'], { env }).stdout.trim(),
  });
}

function snapshotWorkspace(workspace) {
  return {
    status: run('git', ['status', '--short', '--untracked-files=all'], { cwd: workspace }).stdout,
    diff: run('git', ['diff', '--', '.'], { cwd: workspace }).stdout,
    head: run('git', ['rev-parse', 'HEAD'], { cwd: workspace }).stdout.trim(),
    requirementDocuments: readRequirementStates(workspace),
  };
}

async function main() {
  const benchmark = benchmarks[benchmarkName];
  const prompts = promptsForBenchmark(benchmark);
  const freshSessionTurns = freshSessionTurnsForBenchmark(benchmark);
  const nativeCompactionTurns = nativeCompactionTurnsForBenchmark(benchmark);
  const pluginRoot = arm === 'candidate' ? ROOT : baselinePluginRoot;
  const benchmarkFingerprint = fingerprintBenchmark(ROOT, benchmark);
  const candidateFingerprint = fingerprintCandidate(ROOT);
  const pluginFingerprint = pluginRoot ? fingerprintCandidate(pluginRoot) : null;
  const cohort = pluginFingerprint
    ? `${benchmarkFingerprint}-${pluginFingerprint}`
    : benchmarkFingerprint;
  const runId = `${Date.now()}-${process.pid}`;
  const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), `engineering-flow-${benchmarkName}-${arm}-`));
  const workspace = path.join(runRoot, 'workspace');
  const resultDir = path.join(ROOT, 'benchmark-results');
  const handoffDirectory = prompts.some((entry) => typeof entry !== 'string')
    ? fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-handoff-'))
    : null;

  fs.cpSync(path.join(ROOT, benchmark.fixture), workspace, { recursive: true });
  fs.mkdirSync(resultDir, { recursive: true });

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
  const initialStatus = run('git', ['status', '--short', '--untracked-files=all'], { cwd: workspace }).stdout;
  const initialDiff = run('git', ['diff', '--', '.'], { cwd: workspace }).stdout;
  const initialRequirementDocuments = readRequirementStates(workspace);
  let codexEnv = createCodexEnvironment(pluginRoot);
  const environment = captureEnvironment(codexEnv);

  const outputPath = path.join(resultDir, `${benchmarkName}-${arm}-${runId}.jsonl`);
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

  const turnResults = [];
  const nativeCompactions = [];
  const eventStreams = [];
  let threadId = null;
  let continuationError = null;

  for (let index = 0; index < prompts.length; index += 1) {
    const turnNumber = index + 1;
    const startsFreshSession = freshSessionTurns.has(turnNumber);
    let resolved;
    try {
      resolved = resolveTurnPrompt(prompts[index], {
        turnNumber,
        freshSession: startsFreshSession,
        turns: turnResults,
        handoffDirectory,
      });
    } catch (error) {
      continuationError = error.message;
      break;
    }
    const { prompt, handoff } = resolved;
    if (startsFreshSession) {
      codexEnv = createCodexEnvironment(pluginRoot);
      const freshEnvironment = captureEnvironment(codexEnv);
      if (environment.complete && !matchesEnvironment({ environment: freshEnvironment }, environment)) {
        continuationError = 'Execution environment changed before the fresh-session turn';
        break;
      }
    }
    if (nativeCompactionTurns.has(turnNumber)) {
      const workspaceBefore = snapshotWorkspace(workspace);
      const compactionPath = path.join(resultDir,
        benchmarkName + '-' + arm + '-' + runId + '-compact-before-' + turnNumber + '.jsonl');
      let compaction;
      try {
        compaction = await compactCodexThread({
          threadId,
          workspace,
          env: codexEnv,
          configOverrides,
          expectedModel: model,
          expectedProvider: modelProvider,
          expectedReasoning: reasoningEffort,
          outputPath: compactionPath,
          timeoutMs,
          heartbeatMs,
          onHeartbeat: (elapsed) => process.stderr.write(
            '[benchmark] ' + benchmarkName + '/' + arm + '/compact-before-' + turnNumber
              + ' still running (' + Math.round(elapsed / 1000) + 's)\n',
          ),
        });
      } catch (error) {
        compaction = { completed: false, error: redactSecrets(error.message), events: compactionPath };
      }
      const workspaceAfter = snapshotWorkspace(workspace);
      if (JSON.stringify(workspaceBefore) !== JSON.stringify(workspaceAfter)) {
        compaction.completed = false;
        compaction.error = 'Native compaction changed the fixture workspace';
      }
      nativeCompactions.push({ ...compaction, beforeTurn: turnNumber, workspaceBefore, workspaceAfter });
      if (!compaction.completed) {
        continuationError = compaction.error || 'Native compaction did not complete';
        break;
      }
    }
    const resumedFromThreadId = startsFreshSession ? null : threadId;
    const nextTurnNumber = turnNumber + 1;
    const nextTurnResumesCurrent = nextTurnNumber <= prompts.length
      && !freshSessionTurns.has(nextTurnNumber);
    const turnOutputPath = path.join(
      resultDir,
      `${benchmarkName}-${arm}-${runId}-turn-${turnNumber}.jsonl`,
    );
    const turnFinalPath = path.join(resultDir, `${benchmarkName}-${arm}-${runId}-turn-${turnNumber}.txt`);
    const turnStartedAt = Date.now();
    const args = buildCodexArgs({
      prompt,
      threadId: resumedFromThreadId,
      persistent: nextTurnResumesCurrent,
      configOverrides,
      workspace,
      finalPath: turnFinalPath,
    });
    const codex = await runStreaming('codex', args, {
      cwd: workspace,
      env: codexEnv,
      outputPath: turnOutputPath,
      label: `turn-${turnNumber}`,
    });
    const events = codex.stdout || '';
    const stderr = redactSecrets(codex.stderr);
    const turnFailure = extractTurnFailure(events);
    eventStreams.push(events);

    if (index === 0 || startsFreshSession) threadId = extractThreadId(events);

    const finalMessage = fs.existsSync(turnFinalPath)
      ? fs.readFileSync(turnFinalPath, 'utf8')
      : '';
    const diff = run('git', ['diff', '--', '.'], { cwd: workspace }).stdout;
    const status = run('git', ['status', '--short', '--untracked-files=all'], { cwd: workspace }).stdout;
    const head = run('git', ['rev-parse', 'HEAD'], { cwd: workspace }).stdout.trim();
    const turnMetrics = parseJsonl(events);
    const routedSkills = routePrompt(pluginRoot, prompt);
    turnMetrics.skillFileReads = turnMetrics.invokedSkills;
    turnMetrics.routedSkills = routedSkills;
    turnMetrics.invokedSkills = [
      ...new Set([...turnMetrics.skillFileReads, ...routedSkills]),
    ].sort();

    turnResults.push({
      index: turnNumber,
      prompt,
      session: {
        fresh: index === 0 || startsFreshSession,
        threadId,
        resumedFromThreadId,
        codexHome: codexEnv.CODEX_HOME,
      },
      handoff,
      durationMs: Date.now() - turnStartedAt,
      modelRun: {
        completed: codex.status === 0 && !codex.timedOut && !codex.error && !turnFailure,
        status: codex.status,
        signal: codex.signal,
        timedOut: codex.timedOut,
        error: codex.error ? String(codex.error.message || codex.error) : turnFailure,
        stderr,
      },
      finalMessage,
      metrics: turnMetrics,
      publicTests: runFixtureVerification(workspace, benchmark),
      requirementDocuments: readRequirementStates(workspace),
      workspaceState: {
        status,
        head,
        unauthorizedCommit: head !== initialHead,
      },
      diff,
      events: turnOutputPath,
    });

    if (!turnResults.at(-1).modelRun.completed) break;
    if (nextTurnResumesCurrent && !threadId) {
      continuationError = `Turn ${turnNumber} did not emit thread.started.thread_id`;
      break;
    }
  }

  const codexStdout = eventStreams.join('\n');
  fs.writeFileSync(outputPath, codexStdout);
  const codexStderr = turnResults.map((turn) => turn.modelRun.stderr).filter(Boolean).join('\n');
  const compactionEvents = nativeCompactions.map((entry) => entry.events && fs.existsSync(entry.events)
    ? fs.readFileSync(entry.events, 'utf8') + '\n' + (entry.stderr || '')
    : '').join('\n');
  const contaminated = detectContamination([codexStdout, codexStderr, compactionEvents].join('\n'));
  const metrics = parseJsonl(codexStdout);
  const routedSkills = [...new Set(turnResults.flatMap((turn) => turn.metrics.routedSkills))].sort();
  metrics.skillFileReads = metrics.invokedSkills;
  metrics.routedSkills = routedSkills;
  metrics.invokedSkills = [...new Set([...metrics.skillFileReads, ...routedSkills])].sort();
  const invocation = pluginRoot
    ? assessInvocation(metrics.invokedSkills, benchmark.invocation)
    : null;

  const finalMessage = turnResults.at(-1)?.finalMessage || '';
  const scorerPath = path.join(ROOT, benchmark.scorer);
  let score;
  try {
    delete require.cache[require.resolve(scorerPath)];
    score = require(scorerPath)(workspace, {
      finalMessage,
      events: codexStdout,
      turns: turnResults,
      nativeCompactions,
      initialWorkspaceState: {
        status: initialStatus,
        diff: initialDiff,
        head: initialHead,
        requirementDocuments: initialRequirementDocuments,
      },
    });
  } catch (error) {
    score = {
      passed: false,
      error: String(error.stack || error.message || error),
    };
  }
  const publicTests = turnResults.at(-1)?.publicTests
    || runFixtureVerification(workspace, benchmark);
  const diff = run('git', ['diff', '--', '.'], { cwd: workspace }).stdout;
  const finalStatus = run('git', ['status', '--short', '--untracked-files=all'], { cwd: workspace }).stdout;
  const finalHead = run('git', ['rev-parse', 'HEAD'], { cwd: workspace }).stdout.trim();
  const lastModelRun = turnResults.at(-1)?.modelRun || {};
  const modelCompleted = !continuationError
    && turnResults.length === prompts.length
    && turnResults.every((turn) => turn.modelRun.completed);

  const report = {
    benchmark: benchmarkName,
    arm,
    cohort,
    benchmarkFingerprint,
    candidateFingerprint: arm === 'candidate' ? candidateFingerprint : null,
    pluginFingerprint,
    pluginRoot,
    environment,
    durationMs: Date.now() - startedAt,
    workspace,
    threadId,
    modelRun: {
      completed: modelCompleted,
      status: lastModelRun.status ?? null,
      signal: lastModelRun.signal ?? null,
      timedOut: turnResults.some((turn) => turn.modelRun.timedOut)
        || nativeCompactions.some((entry) => entry.timedOut),
      error: continuationError || lastModelRun.error || null,
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
    publicTests,
    workspaceState: {
      initialStatus,
      initialDiff,
      initialHead,
      initialRequirementDocuments,
      finalStatus,
      unauthorizedCommit: initialHead !== finalHead,
    },
    finalMessage,
    diff,
    turns: turnResults,
    nativeCompactions,
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
