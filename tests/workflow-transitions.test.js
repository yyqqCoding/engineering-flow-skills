const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { readRequirementStates, resolveTurnPrompt } = require('../scripts/lib/benchmark-conversation');
const { runFixtureVerification } = require('../scripts/lib/benchmark-verification');
const scoreDesign = require('./scorers/design-develop');
const scoreReview = require('./scorers/review-repair');
const scorePending = require('./scorers/handoff-pending');
const scoreApproved = require('./scorers/handoff-approved');
const { consumesHandoffInFreshSession, recordsApprovedImplementation } = require('./scorers/handoff-resume');
const { observesRegressionBeforeRepair, requestsApproval } = require('./scorers/workflow-transition-evidence');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLES = 'Test Contract: debitBalance(10, 4) -> 6; debitBalance(4, 4) -> 0; debitBalance(5, 6) -> RangeError. Verify the public function.';
// Consumer response from handoff-pending-resume-baseline-1789107752060-8547.
const RESTORED_PENDING = 'Restored the task state: it is paused at the Develop checkpoint, before implementation. No implementation approval was supplied, so I did not modify files or run tests. The repository remains clean.';

function git(workspace, args) {
  const result = childProcess.spawnSync('git', args, { cwd: workspace, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function fixture(t, name, setup) {
  // Node's outer test-runner marker suppresses a nested `node --test` invocation.
  // Fixture verification must execute real independent test processes, including mutants.
  const inheritedTestContext = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  t.after(() => {
    if (inheritedTestContext === undefined) delete process.env.NODE_TEST_CONTEXT;
    else process.env.NODE_TEST_CONTEXT = inheritedTestContext;
  });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-transition-test-'));
  const workspace = path.join(directory, 'workspace');
  fs.cpSync(path.join(ROOT, 'fixtures', name), workspace, { recursive: true });
  git(workspace, ['init', '-b', 'main']);
  git(workspace, ['config', 'user.email', 'test@example.invalid']);
  git(workspace, ['config', 'user.name', 'Test']);
  git(workspace, ['add', '.']);
  git(workspace, ['commit', '-m', 'fixture baseline']);
  if (setup) setup(workspace);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return { directory, workspace, initial: {
    status: git(workspace, ['status', '--short', '--untracked-files=all']),
    diff: git(workspace, ['diff', '--', '.']),
    head: git(workspace, ['rev-parse', 'HEAD']).trim(),
    requirementDocuments: readRequirementStates(workspace),
  } };
}

function snapshot(workspace, index, fields = {}) {
  return {
    index,
    prompt: '',
    finalMessage: '',
    modelRun: { completed: true },
    requirementDocuments: readRequirementStates(workspace),
    metrics: { fileChanges: 0, invokedSkills: [], routedSkills: [] },
    session: { fresh: index === 1, threadId: 'source-thread', resumedFromThreadId: index === 1 ? null : 'source-thread', codexHome: '/producer/.codex' },
    workspaceState: { status: git(workspace, ['status', '--short', '--untracked-files=all']), head: git(workspace, ['rev-parse', 'HEAD']).trim(), unauthorizedCommit: false },
    diff: git(workspace, ['diff', '--', '.']),
    ...fields,
  };
}

function trace(directory, label, items) {
  const filename = path.join(directory, `${label}.jsonl`);
  fs.writeFileSync(filename, items.map((item) => JSON.stringify({ type: 'item.completed', item })).join('\n'));
  return filename;
}

function change(filename) {
  return { type: 'file_change', changes: [{ path: filename, kind: 'update' }] };
}

function testCommand(result) {
  return { type: 'command_execution', command: 'npm test', exit_code: result.status, aggregated_output: result.stdout };
}

function installWallet(workspace) {
  fs.writeFileSync(path.join(workspace, 'wallet.test.js'), `const assert = require('node:assert/strict');
const test = require('node:test');
const { debitBalance, formatAccountId } = require('./src/wallet');
test('protects accepted wallet examples', () => {
  assert.equal(formatAccountId(7), 'acct-7');
  assert.equal(debitBalance(10, 4), 6);
  assert.equal(debitBalance(4, 4), 0);
  assert.throws(() => debitBalance(5, 6), { name: 'RangeError', message: 'insufficient balance' });
  assert.throws(() => debitBalance(2.5, 1), TypeError);
});
`);
  fs.writeFileSync(path.join(workspace, 'src/wallet.js'), `function formatAccountId(id) { return 'acct-' + id; }
function debitBalance(balance, amount) {
  if (!Number.isInteger(balance) || balance < 0 || !Number.isInteger(amount) || amount < 0) {
    throw new TypeError('balance and amount must be non-negative integers');
  }
  if (amount > balance) throw new RangeError('insufficient balance');
  return balance - amount;
}
module.exports = { formatAccountId, debitBalance };
`);
}

test('design-to-Develop requires early examples and sensitive evidence, with order only diagnostic', (t) => {
  const { directory, workspace, initial } = fixture(t, 'post-implementation-testing');
  const design = snapshot(workspace, 1, { finalMessage: EXAMPLES });
  const checkpoint = snapshot(workspace, 2, { prompt: '$engineering-flow:develop Use the design.', finalMessage: 'Reuse the proposed boundary and verification examples. Approval pending; please approve implementation.' });
  installWallet(workspace);
  const verification = runFixtureVerification(workspace, {});
  assert.equal(verification.passed, true, verification.stdout);
  const events = trace(directory, 'wallet', [change('wallet.test.js'), change('src/wallet.js'), testCommand(verification)]);
  const implementation = snapshot(workspace, 3, { publicTests: verification, events, finalMessage: 'wallet.test.js protects the accepted examples; npm test passed.' });
  const context = { turns: [design, checkpoint, implementation], initialWorkspaceState: initial, events: fs.readFileSync(events, 'utf8') };
  const score = scoreDesign(workspace, context);
  assert.equal(score.passed, true, JSON.stringify(score));
  assert.equal(score.observations.writesProductionBeforeTests, false);
  assert.equal(require('./scorers/post-implementation-testing')(workspace, context).passed, false);

  const lateExamples = scoreDesign(workspace, { ...context, turns: [
    { ...design, finalMessage: 'Test subtraction and boundaries after implementation.' }, checkpoint,
    { ...implementation, finalMessage: EXAMPLES + '\nnpm test passed.' },
  ] });
  assert.equal(lateExamples.checks.recordsIndependentAcceptanceExamplesBeforeImplementation, false);
  assert.equal(lateExamples.passed, false);

  fs.writeFileSync(path.join(workspace, 'wallet.test.js'), `const assert = require('node:assert/strict');
const test = require('node:test');
const { debitBalance } = require('./src/wallet');
test('mirrors the implementation', () => assert.equal(debitBalance(10, 4), debitBalance(10, 4)));
`);
  const mirrored = scoreDesign(workspace, context);
  assert.equal(mirrored.checks.fulfillsBoundaryExamplesWithSensitiveCoverage, false);
  assert.equal(mirrored.passed, false);
});

test('acceptance examples accept compact tables but reject generic or incorrect expectations', () => {
  assert.equal(scoreDesign.hasAcceptanceExamples('Verification:\n| 10 | 4 | 6 |\n| 4 | 4 | 0 |\n| 5 | 6 | RangeError |'), true);
  assert.equal(scoreDesign.hasAcceptanceExamples(EXAMPLES.replace('-> 0', '-> 1')), false);
  assert.equal(scoreDesign.hasAcceptanceExamples('Test the implementation and its boundaries.'), false);
  assert.equal(scoreDesign.hasEarlyAcceptanceEvidence('Reuse the user-provided acceptance examples as the Test Contract; verify them through the public debitBalance API.'), true);
  assert.equal(scoreDesign.hasEarlyAcceptanceEvidence('Test subtraction and boundaries after implementation.'), false);
  assert.equal(scoreDesign.hasEarlyAcceptanceEvidence('Reuse the user-provided examples.'), false);
});

test('review repair keeps the first turn read-only and requires red before the production repair', (t) => {
  const { directory, workspace, initial } = fixture(t, 'read-only-review', require('./setups/read-only-review'));
  const review = snapshot(workspace, 1, { finalMessage: 'P1 src/access.js:2 lets a manager bypass the orgId check.' });
  fs.appendFileSync(path.join(workspace, 'access.test.js'), `\ntest('rejects cross-organization and inactive managers', () => {
  assert.equal(canViewReport({ active: true, orgId: 'other', role: 'manager' }, { orgId: 'org-1' }), false);
  assert.equal(canViewReport({ active: false, orgId: 'org-1', role: 'manager' }, { orgId: 'org-1' }), false);
});
`);
  const red = runFixtureVerification(workspace, {});
  assert.equal(red.status, 1, red.stdout);
  fs.copyFileSync(path.join(ROOT, 'fixtures/read-only-review/src/access.js'), path.join(workspace, 'src/access.js'));
  const green = runFixtureVerification(workspace, {});
  assert.equal(green.passed, true, green.stdout);
  const items = [change('access.test.js'), testCommand(red), change('src/access.js'), testCommand(green)];
  const repair = snapshot(workspace, 2, { publicTests: green, events: trace(directory, 'repair', items), finalMessage: 'Repaired the finding and verified the access policy.' });
  const context = { turns: [review, repair], initialWorkspaceState: initial };
  const score = scoreReview(workspace, context);
  assert.equal(score.passed, true, JSON.stringify(score));
  const lateRed = { ...repair, events: trace(directory, 'late-red', [items[0], items[2], items[1], items[3]]) };
  assert.equal(scoreReview(workspace, { ...context, turns: [review, lateRed] }).checks.observesRegressionBeforeProductionRepair, false);
  assert.equal(scoreReview(workspace, { ...context, turns: [{ ...review, metrics: { fileChanges: 1 } }, repair] }).checks.reviewRemainsReadOnly, false);
  const spawnFailure = { ...repair, events: trace(directory, 'spawn-failure', [items[0], { ...items[1], exit_code: 127, aggregated_output: 'npm: command not found' }, items[2], items[3]]) };
  assert.equal(observesRegressionBeforeRepair(spawnFailure, 'src/access.js', 'access.test.js'), false);
});

function handoffTurns(workspace, directory, approved, record) {
  const checkpoint = snapshot(workspace, 1, { finalMessage: 'Add isEven with zero and negative boundaries; approval pending.' });
  const handoff = snapshot(workspace, 2, { finalMessage: record ?? (approved
    ? 'Workflow: Develop.\nPhase: accepted, ready to implement isEven.\nImplementation approved; no new approval required.'
    : 'Workflow: Develop.\nPhase: awaiting approval for isEven.\nNo implementation is authorized.') });
  const handoffDirectory = path.join(directory, 'transfer');
  fs.mkdirSync(handoffDirectory);
  const resolved = resolveTurnPrompt({ prompt: 'Restore the current phase; this grants no new approval.', handoffFromTurn: 2 }, {
    turnNumber: 3, freshSession: true, turns: [checkpoint, handoff], handoffDirectory,
  });
  const read = { type: 'command_execution', command: `cat ${resolved.handoff.path}`, exit_code: 0, aggregated_output: handoff.finalMessage };
  return { checkpoint, handoff, resolved, read, session: { fresh: true, threadId: 'fresh-thread', resumedFromThreadId: null, codexHome: '/consumer/.codex' } };
}

test('pending approval distinguishes missing authority from settled or unchanged authority', () => {
  for (const statement of [
    'No further approval is required.',
    'Approval is not required.',
    'Implementation is already approved. Do not wait for approval.',
    '无需再次批准，可以执行。',
    'This message grants no new implementation approval.',
    'Implementation approved. No further approval was supplied.',
    'Implementation approved. Additional approval has not been supplied.',
    'Implementation approved. No implementation approval was supplied in this message.',
  ]) assert.equal(requestsApproval(statement), false, statement);
  for (const statement of [
    'Approval pending; please approve implementation.',
    'Phase: awaiting implementation approval.',
    'Implementation is not yet approved.',
    'The old scope is already approved, but the increment needs approval.',
    'No further approval is required for the old scope. Please approve the added scope.',
    'isEven 尚未批准，请确认后开始实施。',
    RESTORED_PENDING,
    'No implementation approval has been supplied.',
    'Implementation approval was not given before switching to handoff.',
    'Approval has not yet been provided.',
    'Implementation has not been authorized.',
    'Approval for the added scope has not been given.',
    'This message grants no new approval; implementation approval is pending.',
  ]) assert.equal(requestsApproval(statement), true, statement);
});

test('accepted behavior alone is not implementation approval', () => {
  for (const record of [
    'Develop. Accepted behavior: isEven returns true for even integers. Phase: awaiting implementation approval.',
    'Develop. Accepted behavior: isEven returns true for even integers.',
    'Develop. Implementation not yet approved.',
    'Develop. No implementation is authorized.',
    'Develop. Implementation approved, but the new increment still needs approval.',
  ]) assert.equal(recordsApprovedImplementation(record), false, record);
  for (const record of [
    'Develop. Phase: Accepted. Next: implement isEven.',
    'Develop. Status: Accepted. Next: implement isEven.',
    'Develop. Implementation approved; no new approval required.',
    'Develop. Implementation is already authorized. Do not wait for approval.',
    'Develop. Implementation approved. This message grants no new approval.',
    'Develop. Implementation approved. No implementation approval was supplied in this message.',
  ]) assert.equal(recordsApprovedImplementation(record), true, record);
});

test('handoff consumption requires record contents rather than a successful path probe', (t) => {
  const { directory, workspace } = fixture(t, 'clear-simple-task');
  const data = handoffTurns(workspace, directory, false);
  const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session });
  for (const [label, command, output] of [
    ['ls', `ls ${data.resolved.handoff.path}`, data.resolved.handoff.path],
    ['exists', `test -f ${data.resolved.handoff.path}`, ''],
  ]) {
    const events = trace(directory, label, [{ type: 'command_execution', command, exit_code: 0, aggregated_output: output }]);
    assert.equal(consumesHandoffInFreshSession(data.handoff, { ...consumer, events }), false, label);
  }
  for (const [label, command, output] of [
    ['node-read', `node -e "process.stdout.write(require('fs').readFileSync('${data.resolved.handoff.path}', 'utf8'))"`, data.handoff.finalMessage.replaceAll('\n', '\r\n')],
    ['numbered-read', `nl -ba ${data.resolved.handoff.path}`, data.handoff.finalMessage.split('\n').map((line, index) => `${index + 1}\t${line}`).join('\n')],
  ]) {
    const events = trace(directory, label, [{ type: 'command_execution', command, exit_code: 0, aggregated_output: output }]);
    assert.equal(consumesHandoffInFreshSession(data.handoff, { ...consumer, events }), true, label);
  }
});

test('a completed empty handoff is a behavioral failure for either authority state', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task');
  const checkpoint = snapshot(workspace, 1);
  for (const [index, finalMessage] of ['', ' \n\t '].entries()) {
    const handoff = snapshot(workspace, 2, { finalMessage });
    const handoffDirectory = path.join(directory, `empty-${index}`);
    fs.mkdirSync(handoffDirectory);
    const resolved = resolveTurnPrompt({ prompt: 'Restore the task from the record.', handoffFromTurn: 2 }, {
      turnNumber: 3, freshSession: true, turns: [checkpoint, handoff], handoffDirectory,
    });
    const consumer = snapshot(workspace, 3, { ...resolved,
      session: { fresh: true, threadId: 'fresh-thread', resumedFromThreadId: null, codexHome: '/consumer/.codex' },
      finalMessage: 'There is no task or authority in the continuation record.',
      events: trace(directory, `empty-read-${index}`, [{ type: 'command_execution', command: `cat ${resolved.handoff.path}`, exit_code: 0, aggregated_output: finalMessage }]),
    });
    const context = { turns: [checkpoint, handoff, consumer], initialWorkspaceState: initial };
    for (const scorer of [scorePending, scoreApproved]) {
      const score = scorer(workspace, context);
      assert.equal(score.passed, false);
      assert.equal(score.checks.transfersOnlyGeneratedHandoffToFreshSession, false);
      assert.equal(score.checks.recordsSourceWorkflowAndAuthority, false);
    }
    assert.ok(context.turns.every((turn) => turn.modelRun.completed));
  }
});

test('a pending handoff is consumed without the old thread and cannot authorize implementation', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task');
  const data = handoffTurns(workspace, directory, false);
  const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session,
    finalMessage: 'The isEven task is awaiting approval; please approve implementation.', events: trace(directory, 'pending', [data.read]) });
  const context = { turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial };
  assert.equal(scorePending(workspace, context).passed, true);
  assert.equal(scorePending(workspace, { ...context, turns: [data.checkpoint, data.handoff,
    { ...consumer, finalMessage: 'Approval pending; please approve implementation.' },
  ] }).passed, true);
  assert.equal(scorePending(workspace, { ...context, turns: [data.checkpoint, data.handoff,
    { ...consumer, finalMessage: 'The repository remains clean.' },
  ] }).passed, false);
  assert.equal(consumesHandoffInFreshSession(data.handoff, { ...consumer, session: { ...data.session, threadId: 'source-thread' } }), false);
  assert.equal(consumesHandoffInFreshSession(data.handoff, { ...consumer, session: { ...data.session, codexHome: '/producer/.codex' } }), false);
  assert.equal(consumesHandoffInFreshSession(data.handoff, { ...consumer, session: { ...data.session, resumedFromThreadId: 'source-thread' } }), false);
  fs.appendFileSync(path.join(workspace, 'src/math.js'), '\nexports.isEven = value => value % 2 === 0;\n');
  const premature = snapshot(workspace, 3, { ...data.resolved, session: data.session, finalMessage: consumer.finalMessage, events: consumer.events });
  assert.equal(scorePending(workspace, { ...context, turns: [data.checkpoint, data.handoff, premature] }).passed, false);
});

test('pending recovery uses the consumed source task without requiring a repeated name or approval request', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task');
  const record = 'Objective and accepted behavior: Add and export `isEven(value)`.\nThe Develop workflow checkpoint was presented, but implementation approval was not given before switching to handoff.';
  assert.doesNotMatch(RESTORED_PENDING, /isEven|please approve/i);
  for (const [label, sourceRecord, identifiesTask] of [
    ['named-task', record, true],
    ['missing-task', record.replace('`isEven(value)`', 'the requested operation'), false],
  ]) {
    const transferDirectory = path.join(directory, label);
    fs.mkdirSync(transferDirectory);
    const data = handoffTurns(workspace, transferDirectory, false, sourceRecord);
    const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session,
      finalMessage: RESTORED_PENDING, events: trace(directory, label, [data.read]) });
    const score = scorePending(workspace, { turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial });
    assert.equal(score.checks.transfersOnlyGeneratedHandoffToFreshSession, true);
    assert.equal(score.checks.recordsSourceWorkflowAndAuthority, true);
    assert.equal(score.checks.preservesPendingApprovalInFreshSession, true);
    assert.equal(score.checks.recoversPendingTask, identifiesTask);
    assert.equal(score.passed, identifiesTask, JSON.stringify(score));
  }
});

test('a local checkpoint artifact does not count as a later handoff or consumer mutation', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task');
  const recordPath = path.join(workspace, 'docs/requirements/is-even.md');
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, 'Status: Draft\n\nAdd isEven after implementation approval.\n');
  const data = handoffTurns(workspace, directory, false);
  data.checkpoint.metrics.fileChanges = 1;
  const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session,
    finalMessage: 'Implementation approval is still pending. No production or test files changed.',
    events: trace(directory, 'pending-with-record', [data.read]) });
  const score = scorePending(workspace, {
    turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial,
  });
  // The observed candidate failure created this Draft only in turn 1. Later phases preserved it.
  assert.equal(score.checks.preservesPendingApprovalInFreshSession, true, JSON.stringify(score));
  assert.equal(score.checks.handoffPreservesSourceWorkspace, true);
  assert.equal(score.checks.localCheckpointLeavesWorkspaceUnchanged, false);
  assert.equal(score.passed, false);
});

test('pre-existing requirement records do not count as unnecessary local artifacts', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task', (target) => {
    fs.mkdirSync(path.join(target, 'docs/requirements'), { recursive: true });
    fs.writeFileSync(path.join(target, 'docs/requirements/existing-feature.md'),
      'Status: Accepted\n\nPreserve the existing feature requirement.\n');
  });
  const data = handoffTurns(workspace, directory, false);
  const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session,
    finalMessage: 'Develop is awaiting implementation approval; the existing requirement record is unchanged.',
    events: trace(directory, 'preserved-record', [data.read]) });
  const score = scorePending(workspace, {
    turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial,
  });
  assert.equal(score.checks.localCheckpointLeavesWorkspaceUnchanged, true);
  assert.equal(score.checks.handoffPreservesSourceWorkspace, true);
  assert.equal(score.checks.preservesPendingApprovalInFreshSession, true);
  assert.equal(score.passed, true, JSON.stringify(score));
});

test('a local checkpoint cannot silently change an existing untracked requirement', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task', (target) => {
    fs.mkdirSync(path.join(target, 'docs/requirements'), { recursive: true });
    fs.writeFileSync(path.join(target, 'docs/requirements/existing-feature.md'),
      'Status: Accepted\n\nKeep the established acceptance rule.\n');
  });
  fs.writeFileSync(path.join(workspace, 'docs/requirements/existing-feature.md'),
    'Status: Accepted\n\nA replacement acceptance rule was not authorized.\n');
  const data = handoffTurns(workspace, directory, false);
  const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session,
    finalMessage: 'Implementation approval is pending.',
    events: trace(directory, 'checkpoint-changed-record', [data.read]) });
  const score = scorePending(workspace, {
    turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial,
  });
  assert.equal(score.checks.localCheckpointLeavesWorkspaceUnchanged, false);
  assert.equal(score.checks.handoffPreservesSourceWorkspace, true);
  assert.equal(score.checks.preservesPendingApprovalInFreshSession, true);
  assert.equal(score.passed, false);
});

for (const phase of ['handoff', 'consumer']) {
  test(`${phase} preservation detects changes inside the same untracked requirement record`, (t) => {
    const { directory, workspace, initial } = fixture(t, 'clear-simple-task', (target) => {
      fs.mkdirSync(path.join(target, 'docs/requirements'), { recursive: true });
      fs.writeFileSync(path.join(target, 'docs/requirements/is-even.md'),
        'Status: Draft\n\nisEven acceptance is unchanged and implementation approval is pending.\n');
    });
    const data = handoffTurns(workspace, directory, false);
    fs.writeFileSync(path.join(workspace, 'docs/requirements/is-even.md'),
      'Status: Draft\n\nA different acceptance rule has silently replaced the original.\n');
    const handoff = phase === 'handoff'
      ? snapshot(workspace, 2, { finalMessage: data.handoff.finalMessage })
      : data.handoff;
    const consumer = snapshot(workspace, 3, { ...data.resolved, session: data.session,
      finalMessage: RESTORED_PENDING, events: trace(directory, `changed-record-${phase}`, [data.read]) });
    // git status/diff and file-change event counts alone cannot see this shell-style untracked edit.
    assert.equal(consumer.workspaceState.status, data.checkpoint.workspaceState.status);
    assert.equal(consumer.diff, data.checkpoint.diff);
    assert.equal(consumer.metrics.fileChanges, 0);
    const score = scorePending(workspace, {
      turns: [data.checkpoint, handoff, consumer], initialWorkspaceState: initial,
    });
    assert.equal(score.checks.localCheckpointLeavesWorkspaceUnchanged, true);
    assert.equal(score.checks.handoffPreservesSourceWorkspace, phase !== 'handoff');
    assert.equal(score.checks.preservesPendingApprovalInFreshSession, phase !== 'consumer');
    assert.equal(score.passed, false);
  });
}

function completeApprovedConsumer(workspace, directory, data) {
  fs.appendFileSync(path.join(workspace, 'src/math.js'), `\nfunction isEven(value) {
  if (!Number.isInteger(value)) throw new TypeError('value must be an integer');
  return value % 2 === 0;
}
module.exports.isEven = isEven;
`);
  fs.appendFileSync(path.join(workspace, 'math.test.js'), `\nconst { isEven } = require('./src/math');
test('protects zero, negative, and invalid boundaries', () => {
  assert.equal(isEven(0), true);
  assert.equal(isEven(-3), false);
  assert.throws(() => isEven('2'), TypeError);
});
`);
  const verification = runFixtureVerification(workspace, {});
  assert.equal(verification.passed, true, verification.stdout);
  return snapshot(workspace, 3, { ...data.resolved, session: data.session, publicTests: verification,
    finalMessage: 'Completed isEven; npm test passed.', events: trace(directory, 'approved', [data.read, change('src/math.js'), change('math.test.js'), testCommand(verification)]) });
}

test('an approved handoff resumes implementation and rejects renewed approval ceremony', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task');
  const data = handoffTurns(workspace, directory, true);
  const idle = snapshot(workspace, 3, { ...data.resolved, session: data.session,
    finalMessage: 'Please approve implementation.', events: trace(directory, 'idle', [data.read]) });
  assert.equal(scoreApproved(workspace, { turns: [data.checkpoint, data.handoff, idle], initialWorkspaceState: initial }).passed, false);
  const consumer = completeApprovedConsumer(workspace, directory, data);
  const score = scoreApproved(workspace, { turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial });
  assert.equal(score.passed, true, JSON.stringify(score));
  fs.writeFileSync(data.resolved.handoff.path, 'Rewritten authority: still waiting.');
  assert.equal(consumesHandoffInFreshSession(data.handoff, consumer), false);
});

for (const [name, update, expected] of [
  ['preserves an existing untracked requirement and local artifact', null, true],
  ['rejects a same-path change to an existing requirement', {
    path: 'docs/requirements/existing-feature.md',
    content: 'Status: Accepted\n\nThe existing acceptance rule was silently replaced.\n',
  }, false],
  ['rejects a new requirement beside the existing record', {
    path: 'docs/requirements/new-feature.md',
    content: 'Status: Draft\n\nAn unnecessary new requirement record.\n',
  }, false],
  ['rejects a new ordinary document beside the existing record', {
    path: 'docs/requirements/notes.md',
    content: 'Unrequested implementation notes.\n',
  }, false],
]) {
  test(`an approved consumer ${name}`, (t) => {
    const { directory, workspace, initial } = fixture(t, 'clear-simple-task', (target) => {
      fs.mkdirSync(path.join(target, 'docs/requirements'), { recursive: true });
      fs.writeFileSync(path.join(target, 'docs/requirements/existing-feature.md'),
        'Status: Accepted\n\nPreserve the existing feature requirement.\n');
      fs.writeFileSync(path.join(target, 'scratch.txt'), 'Keep this pre-existing local artifact.\n');
    });
    const data = handoffTurns(workspace, directory, true);
    if (update) fs.writeFileSync(path.join(workspace, update.path), update.content);
    const consumer = completeApprovedConsumer(workspace, directory, data);
    // A same-path content change still has the same per-file Git entry.
    const untrackedEntries = (turn) => turn.workspaceState.status.split(/\r?\n/)
      .filter((line) => line.startsWith('?? '));
    if (!update || update.path === 'docs/requirements/existing-feature.md') {
      assert.deepEqual(untrackedEntries(consumer), untrackedEntries(data.handoff));
    } else {
      assert.notDeepEqual(untrackedEntries(consumer), untrackedEntries(data.handoff));
    }
    const score = scoreApproved(workspace, {
      turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial,
    });
    assert.equal(score.checks.localCheckpointLeavesWorkspaceUnchanged, true);
    assert.equal(score.checks.handoffPreservesSourceWorkspace, true);
    assert.equal(score.checks.resumesAuthorizedImplementation, true);
    assert.equal(score.checks.preservesScopeAndLeavesSensitiveCoverage, expected);
    assert.equal(score.passed, expected, JSON.stringify(score));
  });
}

test('an approved consumer does not inherit the checkpoint artifact failure', (t) => {
  const { directory, workspace, initial } = fixture(t, 'clear-simple-task');
  const recordPath = path.join(workspace, 'docs/requirements/is-even.md');
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, 'Status: Draft\n\nAdd isEven after implementation approval.\n');
  const data = handoffTurns(workspace, directory, true);
  data.checkpoint.metrics.fileChanges = 1;
  const consumer = completeApprovedConsumer(workspace, directory, data);
  const score = scoreApproved(workspace, {
    turns: [data.checkpoint, data.handoff, consumer], initialWorkspaceState: initial,
  });
  assert.equal(score.checks.localCheckpointLeavesWorkspaceUnchanged, false);
  assert.equal(score.checks.handoffPreservesSourceWorkspace, true);
  assert.equal(score.checks.resumesAuthorizedImplementation, true);
  assert.equal(score.checks.preservesScopeAndLeavesSensitiveCoverage, true);
  assert.equal(score.passed, false);
});
