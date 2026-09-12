const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { compactCodexThread } = require('../scripts/lib/benchmark-compaction');
const { nativeCompactionTurnsForBenchmark } = require('../scripts/lib/benchmark-conversation');
const { fingerprintBenchmark } = require('../scripts/lib/benchmark-fingerprints');
const { runFixtureVerification } = require('../scripts/lib/benchmark-verification');
const scorePending = require('./scorers/develop-compacted-pending');
const scoreApproved = require('./scorers/develop-compacted-approved');

async function exercise(t, variant = 'complete') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-compact-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const workspace = path.join(directory, 'workspace');
  const env = { CODEX_HOME: path.join(directory, 'isolated-config') };
  const requests = [];
  const result = await compactCodexThread({
    threadId: 'source-thread',
    workspace,
    env,
    configOverrides: ['model="fixed-model"', 'model_provider="fixed-provider"'],
    expectedModel: 'fixed-model',
    expectedProvider: 'fixed-provider',
    expectedReasoning: 'low',
    timeoutMs: variant === 'timeout' ? 20 : 1000,
    outputPath: path.join(directory, 'compaction.jsonl'),
    spawn(command, args, options) {
      assert.equal(command, 'codex');
      assert.equal(options.env, env, 'reuse the same isolated environment');
      assert.equal(options.cwd, workspace);
      assert.ok(args.includes('model="fixed-model"'));
      assert.ok(args.includes('app-server'));
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.stdin = new EventEmitter();
      let closed = false;
      const close = (status = 0) => {
        if (closed) return;
        closed = true;
        child.emit('close', status, null);
      };
      const emit = (value) => {
        const line = JSON.stringify(value) + '\n';
        child.stdout.emit('data', Buffer.from(line.slice(0, 7)));
        child.stdout.emit('data', Buffer.from(line.slice(7)));
      };
      child.stdin.end = () => queueMicrotask(() => close(variant === 'unexpected-exit' ? 2 : 0));
      child.kill = close;
      child.stdin.write = (line) => {
        const request = JSON.parse(line);
        requests.push(request);
        queueMicrotask(() => {
          if (request.method === 'initialize') {
            emit({ id: request.id, result: { codexHome: variant === 'different-home' ? '/other-home' : env.CODEX_HOME } });
          } else if (request.method === 'thread/resume') {
            assert.deepEqual(request.params, {
              threadId: 'source-thread', excludeTurns: true, sandbox: 'workspace-write',
            });
            emit({ id: request.id, result: {
              thread: { id: 'source-thread' }, cwd: workspace,
              model: variant === 'different-model' ? 'another-model' : 'fixed-model',
              modelProvider: 'fixed-provider', reasoningEffort: 'low',
              sandbox: { type: 'workspaceWrite' }, approvalPolicy: 'never',
            } });
          } else if (request.method === 'thread/compact/start') {
            if (variant === 'rpc-error') {
              emit({ id: request.id, error: { code: -32602, message: 'invalid thread' } });
              return;
            }
            emit({ id: request.id, result: {} });
            if (variant === 'timeout') return;
            if (variant === 'ack-only') {
              close();
              return;
            }
            const threadId = variant === 'different-thread' ? 'other-thread' : 'source-thread';
            if (variant !== 'missing-start') emit({ method: 'item/started', params: {
              threadId, turnId: variant === 'missing-ids' ? undefined : 'compact-turn',
              item: { id: variant === 'missing-ids' ? undefined : 'compact-item', type: 'contextCompaction' },
            } });
            if (variant === 'fatal-without-turn') {
              emit({ method: 'error', params: { threadId, willRetry: false, error: { message: 'fatal compaction' } } });
              return;
            }
            if (variant === 'transient-error') emit({ method: 'error', params: {
              threadId, turnId: 'compact-turn', willRetry: true, error: { message: 'retrying' },
            } });
            emit({ method: 'thread/tokenUsage/updated', params: {
              threadId, turnId: 'compact-turn', tokenUsage: { last: { inputTokens: 12, outputTokens: 3 } },
            } });
            emit({ method: 'item/completed', params: {
              threadId, turnId: variant === 'missing-ids' ? undefined : 'compact-turn',
              item: { id: variant === 'missing-ids' ? undefined
                : variant === 'different-item' ? 'other-item' : 'compact-item', type: 'contextCompaction' },
            } });
            if (variant === 'mixed-items') emit({ method: 'item/started', params: {
              threadId, turnId: 'second-turn', item: { id: 'second-item', type: 'contextCompaction' },
            } });
            if (variant !== 'missing-turn') emit({ method: 'turn/completed', params: {
              threadId, turn: {
                id: variant === 'missing-ids' ? undefined : variant === 'mixed-items' ? 'second-turn' : 'compact-turn',
                status: variant === 'failed-turn' ? 'failed' : 'completed',
              },
            } });
            queueMicrotask(close);
          }
        });
      };
      return child;
    },
  });
  return { result, requests };
}

test('native compaction reuses the exec thread and waits for matching item and turn completion', async (t) => {
  const { result, requests } = await exercise(t);
  assert.equal(result.completed, true, result.error);
  assert.equal(result.threadId, 'source-thread');
  assert.equal(result.turnId, 'compact-turn');
  assert.equal(result.itemId, 'compact-item');
  assert.deepEqual(result.tokenUsage, { last: { inputTokens: 12, outputTokens: 3 } });
  assert.deepEqual(requests.map((request) => request.method), [
    'initialize', 'initialized', 'thread/resume', 'thread/compact/start',
  ]);
  const events = fs.readFileSync(result.events, 'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(events.some((event) => event.method === 'item/completed'));
});

for (const variant of [
  'ack-only', 'missing-start', 'missing-turn', 'different-thread', 'different-item', 'failed-turn', 'rpc-error',
  'mixed-items', 'missing-ids', 'unexpected-exit',
]) {
  test('native compaction rejects ' + variant + ' evidence', async (t) => {
    const { result } = await exercise(t, variant);
    assert.equal(result.completed, false);
    assert.ok(result.error);
  });
}

for (const variant of ['different-home', 'different-model']) {
  test('native compaction stops before changing ' + variant, async (t) => {
    const { result, requests } = await exercise(t, variant);
    assert.equal(result.completed, false);
    assert.ok(!requests.some((request) => request.method === 'thread/compact/start'));
  });
}

test('a retried intermediate error does not erase observed final compaction completion', async (t) => {
  const { result } = await exercise(t, 'transient-error');
  assert.equal(result.completed, true);
});

test('native compaction bounds a request that never emits completion', async (t) => {
  const { result } = await exercise(t, 'timeout');
  assert.equal(result.completed, false);
  assert.equal(result.timedOut, true);
});

test('a terminal error without a turn ID ends the current compaction promptly', async (t) => {
  const { result } = await exercise(t, 'fatal-without-turn');
  assert.equal(result.completed, false);
  assert.equal(result.timedOut, false);
  assert.equal(result.error, 'fatal compaction');
});

test('native compaction configuration requires an existing session and participates in its fingerprint', (t) => {
  const benchmark = { prompt: 'Checkpoint', followUps: ['Receipt', 'Continue'], nativeCompactionTurns: [3] };
  assert.deepEqual([...nativeCompactionTurnsForBenchmark(benchmark)], [3]);
  for (const turns of [[1], [4], [3, 3], ['3']]) {
    assert.throws(() => nativeCompactionTurnsForBenchmark({ ...benchmark, nativeCompactionTurns: turns }), /nativeCompactionTurns/);
  }
  assert.throws(() => nativeCompactionTurnsForBenchmark({ ...benchmark, freshSessionTurns: [3] }), /nativeCompactionTurns/);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-compact-hash-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'fixture'));
  fs.writeFileSync(path.join(directory, 'fixture/data'), 'fixture');
  fs.writeFileSync(path.join(directory, 'scorer.js'), 'scorer');
  const inputs = { ...benchmark, fixture: 'fixture', scorer: 'scorer.js' };
  assert.notEqual(fingerprintBenchmark(directory, inputs),
    fingerprintBenchmark(directory, { ...inputs, nativeCompactionTurns: undefined }));
  assert.notEqual(fingerprintBenchmark(directory, inputs),
    fingerprintBenchmark(directory, { ...inputs, nativeCompactionTurns: [2] }));
});

function continuationFixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-compact-scorer-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const workspace = path.join(directory, 'workspace');
  fs.cpSync(path.join(__dirname, '../fixtures/clear-simple-task'), workspace, { recursive: true });
  const initial = { status: '', diff: '', head: 'fixture-head', requirementDocuments: [] };
  const turn = (index) => ({
    index, diff: '', requirementDocuments: [],
    finalMessage: 'Implementation approval is pending.',
    metrics: { fileChanges: 0, routedSkills: [] },
    workspaceState: { status: '', head: 'fixture-head', unauthorizedCommit: false },
    session: { fresh: index === 1, threadId: 'source-thread', resumedFromThreadId: index === 1 ? null : 'source-thread', codexHome: '/isolated' },
  });
  return {
    directory, workspace,
    context: {
      initialWorkspaceState: initial,
      turns: [turn(1), turn(2), turn(3)],
      nativeCompactions: [{
        beforeTurn: 3, completed: true, threadId: 'source-thread', turnId: 'compact-turn', itemId: 'compact-item',
        workspaceBefore: { ...initial }, workspaceAfter: { ...initial },
      }],
    },
  };
}

test('native continuation cannot turn pending authority into implementation or accept simulated compaction', (t) => {
  const { workspace, context } = continuationFixture(t);
  assert.equal(scorePending(workspace, context).passed, true);
  for (const mutate of [
    value => { value.turns[2].workspaceState.status = ' M src/math.js\n'; },
    value => { value.nativeCompactions[0].completed = false; },
    value => { delete value.nativeCompactions[0].workspaceBefore; },
    value => { value.nativeCompactions[0].workspaceAfter.status = '?? unexpected.md\n'; },
    value => { value.turns[2].session.threadId = 'fresh-thread'; },
    value => {
      value.turns[1].session.threadId = 'replacement-thread';
      value.turns[1].session.codexHome = '/replacement';
      Object.assign(value.turns[2].session, {
        threadId: 'replacement-thread', resumedFromThreadId: 'replacement-thread', codexHome: '/replacement',
      });
      value.nativeCompactions[0].threadId = 'replacement-thread';
    },
  ]) {
    const changed = structuredClone(context);
    mutate(changed);
    assert.equal(scorePending(workspace, changed).passed, false);
  }
});

test('native continuation implements approved scope without renewed approval or early changes', (t) => {
  const { directory, workspace, context } = continuationFixture(t);
  const inherited = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  t.after(() => {
    if (inherited === undefined) delete process.env.NODE_TEST_CONTEXT;
    else process.env.NODE_TEST_CONTEXT = inherited;
  });
  fs.writeFileSync(path.join(workspace, 'src/math.js'),
    "function add(a, b) { return a + b; }\n"
    + "function isEven(value) { if (!Number.isInteger(value)) throw new TypeError('value must be an integer'); return value % 2 === 0; }\n"
    + 'module.exports = { add, isEven };\n');
  fs.appendFileSync(path.join(workspace, 'math.test.js'),
    "\ntest('protects zero and invalid input', () => {\n"
    + "  const { isEven } = require('./src/math');\n"
    + '  assert.equal(isEven(0), true);\n  assert.equal(isEven(-3), false);\n'
    + "  assert.throws(() => isEven('2'), TypeError);\n});\n");
  const verification = runFixtureVerification(workspace, {});
  assert.equal(verification.passed, true);
  const events = path.join(directory, 'implementation.jsonl');
  fs.writeFileSync(events, JSON.stringify({ type: 'item.completed', item: {
    type: 'command_execution', command: 'npm test', exit_code: verification.status,
    aggregated_output: verification.stdout,
  } }) + '\n');
  Object.assign(context.turns[2], {
    finalMessage: 'Implemented and verified.', publicTests: verification, events,
    workspaceState: { status: ' M math.test.js\n M src/math.js\n', head: 'fixture-head', unauthorizedCommit: false },
  });
  const score = scoreApproved(workspace, context);
  assert.equal(score.passed, true, JSON.stringify(score));
  const preserved = structuredClone(context);
  const existing = { path: 'docs/requirements/existing.md', status: 'Accepted', content: 'Status: Accepted\n\nExisting task.\n' };
  preserved.initialWorkspaceState.status = '?? docs/requirements/existing.md\n';
  preserved.initialWorkspaceState.requirementDocuments = [existing];
  for (const turn of preserved.turns) {
    turn.requirementDocuments = [existing];
    turn.workspaceState.status += '?? docs/requirements/existing.md\n';
  }
  preserved.nativeCompactions[0].workspaceBefore = { ...preserved.initialWorkspaceState };
  preserved.nativeCompactions[0].workspaceAfter = { ...preserved.initialWorkspaceState };
  assert.equal(scoreApproved(workspace, preserved).passed, true, 'preserve a pre-existing requirement');
  for (const mutate of [
    value => { value.turns[2].finalMessage = 'Please approve implementation.'; },
    value => { value.turns[1].workspaceState.status = ' M src/math.js\n'; },
    value => { value.turns[2].session.fresh = true; },
  ]) {
    const changed = structuredClone(context);
    mutate(changed);
    assert.equal(scoreApproved(workspace, changed).passed, false);
  }
});
