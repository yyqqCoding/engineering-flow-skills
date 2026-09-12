const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {
  buildCodexArgs,
  prepareCodexHome,
  promptsForBenchmark,
  resolveTurnPrompt,
} = require('../scripts/lib/benchmark-conversation');
const { fingerprint, fingerprintBenchmark } = require('../scripts/lib/benchmark-fingerprints');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-transfer-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('handoff follow-ups only reference earlier turns in a fresh session', () => {
  const benchmark = {
    prompt: 'Start task',
    followUps: ['Prepare handoff', { prompt: 'Continue', handoffFromTurn: 2 }],
    freshSessionTurns: [3],
  };
  assert.equal(promptsForBenchmark(benchmark)[2].handoffFromTurn, 2);
  assert.throws(() => promptsForBenchmark({ ...benchmark, freshSessionTurns: [] }), /fresh session/);
  for (const source of [0, 3, 4, 1.5]) {
    assert.throws(() => promptsForBenchmark({
      ...benchmark,
      followUps: ['Prepare handoff', { prompt: 'Continue', handoffFromTurn: source }],
    }), /earlier turn/);
  }
  assert.throws(() => promptsForBenchmark({ ...benchmark, followUps: 'Continue' }), /array/);
  assert.throws(() => promptsForBenchmark({
    ...benchmark,
    followUps: ['Prepare handoff', { prompt: 'Continue', handoffFromTurn: 2, extraContext: 'old transcript' }],
  }), /only prompt/);
});

test('the consumer receives exactly the completed handoff through a separate file', (t) => {
  const directory = temporaryDirectory(t);
  const source = {
    index: 2,
    prompt: 'OLD_TRANSCRIPT_SENTINEL',
    finalMessage: 'Workflow: $engineering-flow:develop\nApproval pending.\n',
    modelRun: { completed: true },
    session: { threadId: 'source-thread' },
  };
  const entry = { prompt: 'Continue the task.', handoffFromTurn: 2 };
  const options = { turnNumber: 3, freshSession: true, turns: [source], handoffDirectory: directory };
  const resolved = resolveTurnPrompt(entry, options);
  assert.equal(fs.readFileSync(resolved.handoff.path, 'utf8'), source.finalMessage);
  assert.equal(resolved.handoff.sourceTurn, 2);
  assert.equal(resolved.handoff.sourceThreadId, 'source-thread');
  assert.match(resolved.handoff.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(fs.readdirSync(directory), ['handoff-for-turn-3.md']);
  assert.ok(resolved.prompt.includes(resolved.handoff.path));
  assert.doesNotMatch(resolved.prompt, /OLD_TRANSCRIPT|\$engineering-flow/);
  assert.throws(() => resolveTurnPrompt(entry, { ...options, freshSession: false }), /fresh session/);
  assert.throws(() => resolveTurnPrompt(entry, { ...options, turns: [{ ...source, modelRun: { completed: false } }] }), /completed/);
  assert.throws(() => resolveTurnPrompt(entry, { ...options, turns: [{ ...source, finalMessage: null }] }), /must be a string/);
  const args = buildCodexArgs({ prompt: resolved.prompt, threadId: null, persistent: false,
    configOverrides: [], workspace: '/fixture', finalPath: '/separate-results/final.txt' });
  assert.equal(args[0], 'exec');
  assert.ok(args.includes('--ephemeral'));
  assert.ok(!args.includes('resume'));
  assert.ok(!args.includes('source-thread'));
});

test('a completed empty handoff reaches the consumer as the actual empty record', (t) => {
  for (const finalMessage of ['', ' \r\n\t ']) {
    const source = { index: 2, finalMessage, modelRun: { completed: true }, session: { threadId: 'source-thread' } };
    const resolved = resolveTurnPrompt({ prompt: 'Continue the task.', handoffFromTurn: 2 }, {
      turnNumber: 3, freshSession: true, turns: [source], handoffDirectory: temporaryDirectory(t),
    });
    assert.equal(fs.readFileSync(resolved.handoff.path, 'utf8'), finalMessage);
    assert.equal(resolved.handoff.sourceTurn, 2);
    assert.ok(resolved.prompt.includes(resolved.handoff.path));
    assert.doesNotMatch(resolved.prompt, /approved|pending|isEven|\$engineering-flow/);
  }
});

test('fresh Codex homes copy only authentication and provider settings, never session history', (t) => {
  const directory = temporaryDirectory(t);
  const source = path.join(directory, 'source');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'auth.json'), '{"fixtureCredential":true}\n');
  fs.writeFileSync(path.join(source, 'config.toml'), 'model="fixture"\n[plugins.global]\nenabled=true\n');
  fs.writeFileSync(path.join(source, 'provider.toml'), '[model_providers.fixture]\nname="fixture"\n');
  fs.writeFileSync(path.join(source, 'history.jsonl'), 'OLD_TRANSCRIPT_SENTINEL');
  fs.mkdirSync(path.join(source, 'sessions'));
  fs.writeFileSync(path.join(source, 'sessions', 'old.jsonl'), 'OLD_TRANSCRIPT_SENTINEL');
  fs.mkdirSync(path.join(source, 'plugins'));
  for (const name of ['first', 'fresh']) {
    const target = path.join(directory, name);
    prepareCodexHome(target, source);
    assert.deepEqual(fs.readdirSync(target).sort(), ['auth.json', 'config.toml', 'provider.toml']);
    assert.doesNotMatch(fs.readFileSync(path.join(target, 'config.toml'), 'utf8'), /plugins/);
    assert.equal(fs.readFileSync(path.join(target, 'auth.json'), 'utf8'), '{"fixtureCredential":true}\n');
  }
  assert.throws(() => prepareCodexHome(path.join(directory, 'fresh'), source), /EEXIST/);
});

test('the runner retains initial requirement contents and untracked artifact paths', async (t) => {
  const inheritedTestContext = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  t.after(() => {
    if (inheritedTestContext === undefined) delete process.env.NODE_TEST_CONTEXT;
    else process.env.NODE_TEST_CONTEXT = inheritedTestContext;
  });
  const root = path.resolve(__dirname, '..');
  const runnerPath = path.join(root, 'scripts/run-codex-benchmark.js');
  const runnerSource = fs.readFileSync(runnerPath, 'utf8');
  const runnerRequire = createRequire(runnerPath);
  const original = 'Status: Accepted\n\nKeep the established acceptance rule.\n';
  const replacement = 'Status: Accepted\n\nA replacement acceptance rule was not authorized.\n';
  const recordPath = 'docs/requirements/existing-feature.md';

  for (const mutation of ['none', 'content', 'new artifact']) {
    const directory = temporaryDirectory(t);
    fs.cpSync(path.join(root, 'fixtures/clear-simple-task'), path.join(directory, 'fixture'), { recursive: true });
    fs.mkdirSync(path.join(directory, 'config'));
    fs.writeFileSync(path.join(directory, 'config/benchmarks.json'), JSON.stringify({
      checkpoint: { fixture: 'fixture', setup: 'setup.js', scorer: 'scorer.js', prompt: 'Present the checkpoint.' },
    }));
    fs.writeFileSync(path.join(directory, 'setup.js'), `const fs = require('node:fs');
const path = require('node:path');
module.exports = workspace => {
  fs.mkdirSync(path.join(workspace, 'docs/requirements'), { recursive: true });
  fs.writeFileSync(path.join(workspace, ${JSON.stringify(recordPath)}), ${JSON.stringify(original)});
};
`);
    fs.writeFileSync(path.join(directory, 'scorer.js'), `const { unchangedSinceStart } = require(${JSON.stringify(path.join(root, 'tests/scorers/workflow-transition-evidence.js'))});
module.exports = (workspace, context) => ({ passed: unchangedSinceStart(context.turns[0], context.initialWorkspaceState) });
`);
    const userDirectory = path.join(directory, 'user');
    fs.mkdirSync(path.join(userDirectory, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(userDirectory, '.codex/auth.json'), '{}\n');
    let modelCalls = 0;
    const localChildProcess = {
      ...childProcess,
      spawnSync(command, args, options) {
        if (command === 'codex' && args[0] === '--version') {
          return { status: 0, stdout: 'codex-cli fixture\n', stderr: '' };
        }
        return childProcess.spawnSync(command, args, options);
      },
      spawn(command, args, options) {
        assert.equal(command, 'codex');
        modelCalls += 1;
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        queueMicrotask(() => {
          if (mutation === 'content') fs.writeFileSync(path.join(options.cwd, recordPath), replacement);
          if (mutation === 'new artifact') fs.writeFileSync(path.join(options.cwd, 'docs/checkpoint-notes.md'), 'Unnecessary new artifact.\n');
          fs.writeFileSync(args[args.indexOf('-o') + 1], 'Implementation approval is pending.\n');
          child.stdout.emit('data', Buffer.from([
            JSON.stringify({ type: 'thread.started', thread_id: 'fixture-thread' }),
            JSON.stringify({ type: 'turn.completed', usage: {} }),
          ].join('\n')));
          child.emit('close', 0, null);
        });
        return child;
      },
    };
    function isolatedRequire(name) {
      if (name === 'node:child_process') return localChildProcess;
      if (name === 'node:os') return { ...os, homedir: () => userDirectory, tmpdir: () => directory };
      if (name === './lib/benchmark-fingerprints') {
        return { fingerprintBenchmark: () => 'fixture-benchmark', fingerprintCandidate: () => 'fixture-plugin' };
      }
      return runnerRequire(name);
    }
    isolatedRequire.cache = runnerRequire.cache;
    isolatedRequire.resolve = runnerRequire.resolve;
    const output = [];
    const errors = [];
    const runnerProcess = {
      argv: [process.execPath, runnerPath, 'checkpoint', 'baseline'],
      env: { BENCH_TIMEOUT_MS: '10000', BENCH_HEARTBEAT_MS: '0' },
      pid: process.pid,
      exitCode: 0,
      stdout: { write: value => output.push(value) },
      stderr: { write: value => errors.push(value) },
    };
    await vm.runInNewContext(runnerSource, {
      require: isolatedRequire,
      __dirname: path.join(directory, 'scripts'),
      process: runnerProcess,
      Buffer, setTimeout, clearTimeout, setInterval, clearInterval,
    }, { filename: runnerPath });
    assert.equal(runnerProcess.exitCode, 0, errors.join(''));
    assert.equal(modelCalls, 1);
    const report = JSON.parse(output.join(''));
    assert.equal(report.modelRun.completed, true);
    assert.equal(report.score.passed, mutation === 'none', `${mutation}: ${JSON.stringify(report.score)}`);
    if (mutation === 'new artifact') {
      assert.notEqual(report.workspaceState.initialStatus, report.workspaceState.finalStatus);
    } else {
      assert.equal(report.workspaceState.initialStatus, report.workspaceState.finalStatus);
    }
    assert.equal(report.workspaceState.initialDiff, report.diff);
    assert.deepEqual(report.workspaceState.initialRequirementDocuments, [{ path: recordPath, status: 'Accepted', content: original }]);
    assert.equal(report.turns[0].requirementDocuments[0].content, mutation === 'content' ? replacement : original);
    const reportName = fs.readdirSync(path.join(directory, 'benchmark-results')).find(name => name.endsWith('.json'));
    const saved = JSON.parse(fs.readFileSync(path.join(directory, 'benchmark-results', reportName), 'utf8'));
    assert.deepEqual(saved.workspaceState.initialRequirementDocuments, report.workspaceState.initialRequirementDocuments);
    assert.equal(saved.score.passed, mutation === 'none');
  }
});

test('explicit shared dependencies change new fingerprints without changing legacy inputs', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, 'fixture'));
  fs.writeFileSync(path.join(directory, 'fixture', 'source.js'), 'fixture\n');
  fs.writeFileSync(path.join(directory, 'scorer.js'), 'scorer\n');
  fs.writeFileSync(path.join(directory, 'shared.js'), 'shared\n');
  const benchmark = { fixture: 'fixture', scorer: 'scorer.js', prompt: 'Task' };
  const legacy = fingerprint(directory, [path.join(directory, 'fixture'), path.join(directory, 'scorer.js')],
    JSON.stringify({ prompt: 'Task', followUps: [], freshSessionTurns: [], verification: null }));
  assert.equal(fingerprintBenchmark(directory, benchmark), legacy);
  const withDependency = { ...benchmark, fingerprintInputs: ['shared.js'] };
  const before = fingerprintBenchmark(directory, withDependency);
  fs.writeFileSync(path.join(directory, 'shared.js'), 'changed scorer dependency\n');
  assert.notEqual(fingerprintBenchmark(directory, withDependency), before);
  assert.equal(fingerprintBenchmark(directory, benchmark), legacy);
  assert.throws(() => fingerprintBenchmark(directory, { ...benchmark, fingerprintInputs: ['../secret'] }), /repository-relative/);
});

test('fresh-session benchmarks fingerprint their runtime and shared scorer dependencies', () => {
  const benchmarks = require('../config/benchmarks.json');
  const runtimeInputs = [
    'scripts/run-codex-benchmark.js',
    'scripts/lib/benchmark-conversation.js',
    'scripts/lib/benchmark-fingerprints.js',
    'scripts/lib/benchmark-utils.js',
    'scripts/lib/benchmark-verification.js',
    'scripts/lib/env-file.js',
  ];
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    if (!benchmark.freshSessionTurns?.length) continue;
    for (const dependency of runtimeInputs) {
      assert.ok(benchmark.fingerprintInputs?.includes(dependency), `${name}: ${dependency}`);
    }
    if (name.startsWith('develop-durable-')) {
      assert.ok(benchmark.fingerprintInputs.includes('tests/scorers/durable-record.js'), name);
      assert.ok(benchmark.fingerprintInputs.includes('skills/develop/scripts/validate-requirement-record.js'), name);
    }
  }
});
