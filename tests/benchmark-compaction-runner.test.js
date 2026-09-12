const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('the runner keeps compaction separate and stops before continuation on failure or workspace mutation', async (t) => {
  const root = path.resolve(__dirname, '..');
  const runnerPath = path.join(root, 'scripts/run-codex-benchmark.js');
  const source = fs.readFileSync(runnerPath, 'utf8');
  const runnerRequire = createRequire(runnerPath);
  const inherited = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  t.after(() => {
    if (inherited === undefined) delete process.env.NODE_TEST_CONTEXT;
    else process.env.NODE_TEST_CONTEXT = inherited;
  });

  for (const mode of ['complete', 'failed', 'workspace mutation']) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-compact-runner-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.mkdirSync(path.join(directory, 'config'));
    fs.cpSync(path.join(root, 'fixtures/clear-simple-task'), path.join(directory, 'fixture'), { recursive: true });
    fs.writeFileSync(path.join(directory, 'config/benchmarks.json'), JSON.stringify({
      native: {
        fixture: 'fixture', scorer: 'scorer.js',
        prompt: 'Checkpoint', followUps: ['Continue within existing authority.'],
        nativeCompactionTurns: [2],
      },
    }));
    fs.writeFileSync(path.join(directory, 'scorer.js'),
      'module.exports = (workspace, context) => ({ passed: context.turns.length === 2'
      + ' && context.nativeCompactions.length === 1 && context.nativeCompactions[0].completed });\n');
    const userDirectory = path.join(directory, 'user');
    fs.mkdirSync(path.join(userDirectory, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(userDirectory, '.codex/auth.json'), '{}\n');
    let firstEnvironment;
    let modelCalls = 0;
    let compactCalls = 0;
    const fakeProcesses = {
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
        firstEnvironment ||= options.env;
        assert.equal(options.env, firstEnvironment);
        if (modelCalls === 1) assert.ok(!args.includes('--ephemeral'));
        else assert.equal(args[1], 'resume');
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        queueMicrotask(() => {
          fs.writeFileSync(args[args.indexOf('-o') + 1], 'Approval remains pending.\n');
          child.stdout.emit('data', Buffer.from([
            JSON.stringify({ type: 'thread.started', thread_id: 'source-thread' }),
            JSON.stringify({ type: 'turn.completed', usage: {} }),
          ].join('\n')));
          child.emit('close', 0, null);
        });
        return child;
      },
    };
    function isolatedRequire(name) {
      if (name === 'node:child_process') return fakeProcesses;
      if (name === 'node:os') return { ...os, homedir: () => userDirectory, tmpdir: () => directory };
      if (name === './lib/benchmark-fingerprints') {
        return { fingerprintBenchmark: () => 'fixture-benchmark', fingerprintCandidate: () => 'fixture-plugin' };
      }
      if (name === './lib/benchmark-compaction') return {
        async compactCodexThread(options) {
          compactCalls += 1;
          assert.equal(options.env, firstEnvironment);
          assert.equal(options.threadId, 'source-thread');
          assert.equal(modelCalls, 1, 'compaction must precede the resumed business turn');
          fs.writeFileSync(options.outputPath, JSON.stringify({ fixture: 'compaction' }) + '\n');
          if (mode === 'workspace mutation') {
            fs.writeFileSync(path.join(options.workspace, 'unexpected.md'), 'unexpected compaction edit\n');
          }
          return {
            completed: mode !== 'failed', threadId: options.threadId, turnId: 'compact-turn', itemId: 'compact-item',
            error: mode === 'failed' ? 'fixture timeout' : null,
            timedOut: mode === 'failed', events: options.outputPath,
          };
        },
      };
      return runnerRequire(name);
    }
    isolatedRequire.cache = runnerRequire.cache;
    isolatedRequire.resolve = runnerRequire.resolve;
    const stdout = [];
    const stderr = [];
    const runnerProcess = {
      argv: [process.execPath, runnerPath, 'native', 'baseline'],
      env: {
        BENCH_TIMEOUT_MS: '10000', BENCH_HEARTBEAT_MS: '0',
        BENCH_MODEL_PROVIDER: 'openai', BENCH_MODEL: 'fixture-model',
      },
      pid: process.pid, exitCode: 0,
      stdout: { write: value => stdout.push(value) },
      stderr: { write: value => stderr.push(value) },
    };
    await vm.runInNewContext(source, {
      require: isolatedRequire, __dirname: path.join(directory, 'scripts'), process: runnerProcess,
      Buffer, setTimeout, clearTimeout, setInterval, clearInterval,
    }, { filename: runnerPath });
    const report = JSON.parse(stdout.join(''));
    assert.equal(compactCalls, 1);
    assert.equal(modelCalls, mode === 'complete' ? 2 : 1);
    assert.equal(report.modelRun.completed, mode === 'complete', stderr.join(''));
    assert.equal(report.modelRun.timedOut, mode === 'failed');
    assert.equal(report.nativeCompactions.length, 1);
    assert.equal(report.nativeCompactions[0].beforeTurn, 2);
    assert.equal(report.nativeCompactions[0].completed, mode === 'complete');
    assert.equal(report.turns.length, modelCalls, 'compaction is not a business turn');
    assert.equal(report.environment.complete, true);
    const savedName = fs.readdirSync(path.join(directory, 'benchmark-results')).find(name => name.endsWith('.json'));
    const saved = JSON.parse(fs.readFileSync(path.join(directory, 'benchmark-results', savedName), 'utf8'));
    assert.deepEqual(saved.nativeCompactions, report.nativeCompactions);
    assert.deepEqual(saved.environment, report.environment);
  }
});
