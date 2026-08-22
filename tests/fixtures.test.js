const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { ROOT, readJson } = require('./helpers/repository');
const {
  runFixtureVerification,
  verificationForBenchmark,
} = require('../scripts/lib/benchmark-verification');

const benchmarks = readJson('config/benchmarks.json');

function run(command, args, cwd) {
  return childProcess.spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    // npm resolves to npm.cmd on Windows, which spawnSync only runs through a shell.
    shell: command === 'npm' && process.platform === 'win32',
  });
}

test('benchmark fixtures and scorers exist', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    assert.ok(fs.existsSync(path.join(ROOT, benchmark.fixture)), `${name} fixture is missing`);
    assert.ok(fs.existsSync(path.join(ROOT, benchmark.scorer)), `${name} scorer is missing`);
    if (benchmark.setup) {
      assert.ok(fs.existsSync(path.join(ROOT, benchmark.setup)), `${name} setup is missing`);
    }
    assert.ok(benchmark.prompt.length >= 80, `${name} prompt is too weak to define the task`);
    if (benchmark.followUps) {
      assert.ok(Array.isArray(benchmark.followUps), `${name} followUps must be an array`);
      assert.ok(
        benchmark.followUps.every((prompt) => typeof prompt === 'string' && prompt.length > 0),
        `${name} followUps must contain non-empty prompts`,
      );
    }
    assert.ok(Array.isArray(benchmark.invocation?.expected), `${name} expected invocation list is missing`);
    assert.ok(Array.isArray(benchmark.invocation?.allowed), `${name} allowed invocation list is missing`);
    assert.doesNotThrow(
      () => verificationForBenchmark(benchmark),
      `${name} verification command is invalid`,
    );
  }
});

test('Codex explicit-skill benchmarks use the plugin namespace', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    for (const skill of benchmark.invocation.expected) {
      assert.match(
        benchmark.prompt,
        new RegExp(`\\$engineering-flow:${skill}(?:\\s|$)`),
        `${name} must explicitly invoke ${skill} with the plugin namespace`,
      );
    }
  }
});

test('fixture public tests pass before model changes', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    const result = runFixtureVerification(path.join(ROOT, benchmark.fixture), benchmark);
    assert.equal(result.passed, true, `${name} fixture baseline tests failed\n${result.stdout}\n${result.stderr}`);
  }
});

test('hidden scorers reject the unmodified fixtures', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    const scorerPath = path.join(ROOT, benchmark.scorer);
    delete require.cache[require.resolve(scorerPath)];
    const score = require(scorerPath)(path.join(ROOT, benchmark.fixture));
    assert.equal(score.passed, false, `${name} scorer must be red on the initial fixture`);
  }
});

test('readability scorer does not mistake nullish assignment for a nested conditional', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'engineering-flow-readability-'));
  const workspace = path.join(temporaryRoot, 'workspace');
  fs.cpSync(path.join(ROOT, benchmarks['readability-trap'].fixture), workspace, { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'order-summary.js'), [
    'function summarizeOrders(orders) {',
    '  const summary = { high: [], normal: [], invalid: [] };',
    '  for (const order of orders) {',
    '    if (order.cancelled) continue;',
    '    if (order.total < 0) summary.invalid.push(order.id);',
    '    else if (order.total === 0) (summary.zero ??= []).push(order.id);',
    '    else if (order.total > 1000) summary.high.push(order.id);',
    '    else summary.normal.push(order.id);',
    '  }',
    '  return summary;',
    '}',
    'module.exports = { summarizeOrders };',
    '',
  ].join('\n'));

  const scorerPath = path.join(ROOT, benchmarks['readability-trap'].scorer);
  delete require.cache[require.resolve(scorerPath)];
  const score = require(scorerPath)(workspace);

  assert.equal(score.passed, true);
  assert.equal(score.checks.avoidsNestedConditional, true);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('benchmark setup hooks create valid pre-existing worktree state', () => {
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    if (!benchmark.setup) continue;

    const temporaryRoot = fs.mkdtempSync(path.join(require('node:os').tmpdir(), `engineering-flow-setup-${name}-`));
    const workspace = path.join(temporaryRoot, 'workspace');
    fs.cpSync(path.join(ROOT, benchmark.fixture), workspace, { recursive: true });

    assert.equal(run('git', ['init', '-b', 'main'], workspace).status, 0);
    assert.equal(run('git', ['config', 'user.email', 'test@example.invalid'], workspace).status, 0);
    assert.equal(run('git', ['config', 'user.name', 'Test'], workspace).status, 0);
    assert.equal(run('git', ['add', '.'], workspace).status, 0);
    assert.equal(run('git', ['commit', '-m', 'baseline'], workspace).status, 0);

    const setupPath = path.join(ROOT, benchmark.setup);
    delete require.cache[require.resolve(setupPath)];
    require(setupPath)(workspace);

    const status = run('git', ['status', '--short'], workspace);
    assert.equal(status.status, 0, `${name} setup status failed`);
    assert.notEqual(status.stdout, '', `${name} setup must create pre-existing work`);

    const publicTests = runFixtureVerification(workspace, benchmark);
    assert.equal(
      publicTests.passed,
      true,
      `${name} setup broke public tests\n${publicTests.stdout}\n${publicTests.stderr}`,
    );

    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('question batching scorer rejects inferred write behavior from a read API', () => {
  const score = require('./scorers/develop-question-batching')(ROOT, {
    turns: [
      {
        finalMessage: [
          'Unknown customer: return false, inferred from findCustomer.',
          'Orders: what should happen?',
          'Audit: should this emit an event?',
        ].join('\n'),
        diff: '',
      },
      { finalMessage: 'Ready for approval.', diff: '' },
    ],
  });

  assert.equal(score.passed, false);
  assert.equal(score.checks.asksIndependentQuestionsTogether, false);
});

test('question batching scorer accepts a topic heading followed by its question', () => {
  const score = require('./scorers/develop-question-batching')(ROOT, {
    turns: [
      {
        finalMessage: [
          '**1. Customers with existing orders**',
          'When a customer has orders, what should deleteCustomer do?',
          '**2. Unknown customer**',
          'What should deleteCustomer do when the customer does not exist?',
          '**3. Audit event**',
          'Should deleteCustomer emit an audit event?',
        ].join('\n'),
        diff: '',
      },
      { finalMessage: 'Ready for approval.', diff: '' },
    ],
  });

  assert.equal(score.passed, true);
  assert.equal(score.checks.asksIndependentQuestionsTogether, true);
});

test('question batching scorer accepts one choice request with numbered option groups', () => {
  const score = require('./scorers/develop-question-batching')(ROOT, {
    turns: [
      {
        finalMessage: [
          'Please choose the behavior for each:',
          '1. Existing orders:',
          '   - Reject deletion',
          '   - Cascade-delete orders',
          '2. Unknown customer:',
          '   - Return false',
          '   - Throw',
          '3. Audit event:',
          '   - Emit one',
          '   - Do not emit one',
        ].join('\n'),
        diff: '',
      },
      { finalMessage: 'Checkpoint ready for approval.', diff: '' },
    ],
  });

  assert.equal(score.passed, true);
  assert.equal(score.checks.asksIndependentQuestionsTogether, true);
});

test('question batching scorer accepts an explicit authorization request', () => {
  const { awaitsApproval } = require('./scorers/develop-question-batching');

  assert.equal(awaitsApproval('Say “implement this” to authorize code and test changes.'), true);
  assert.equal(awaitsApproval('The checkpoint is recorded.'), false);
});

test('develop lifecycle scorer accepts equivalent incremental approval wording', () => {
  const { awaitsApproval } = require('./scorers/develop-lifecycle');

  assert.equal(awaitsApproval('请回复“按增量实施”后我再修改并验证。'), true);
  assert.equal(awaitsApproval('请回复“继续实施”或“按此执行”后我再修改。'), true);
  assert.equal(awaitsApproval('请回复“实施该增量”或“继续”，我再开始修改。'), true);
  assert.equal(awaitsApproval('Reply with “implement this” to authorize the code and test changes.'), true);
  assert.equal(awaitsApproval('Reply with “implement this” or equivalent to authorize implementation.'), true);
  assert.equal(awaitsApproval('增量验收对齐如下，暂不实施。'), false);
  assert.equal(awaitsApproval('The checkpoint is ready.'), false);
});

test('mixed approval and scope scorer requires the entire turn to stay read-only', () => {
  const scorer = require('./scorers/develop-scope-in-approval');
  const checkpoint = 'Goal and acceptance are aligned. Reply “implement this” to approve.';
  const increment = [
    'Incremental checkpoint: decimal integer strings are now accepted.',
    'Whitespace, a plus sign, and leading zeros remain invalid.',
    'Reply “implement this” to approve the revised checkpoint.',
  ].join('\n');
  const readOnly = scorer(path.join(ROOT, benchmarks['clear-simple-task'].fixture), {
    turns: [
      { finalMessage: checkpoint, diff: '' },
      { finalMessage: increment, diff: '' },
    ],
  });
  const changed = scorer(path.join(ROOT, benchmarks['clear-simple-task'].fixture), {
    turns: [
      { finalMessage: checkpoint, diff: '' },
      { finalMessage: increment, diff: 'diff --git a/src/math.js b/src/math.js\n' },
    ],
  });

  assert.equal(readOnly.checks.pausesEntireMixedApprovalTurn, true);
  assert.equal(changed.checks.pausesEntireMixedApprovalTurn, false);
});

test('fact alignment scorer distinguishes approval from reversible implementation choices', () => {
  const {
    asksForReversibleChoice,
    hasFocusedCoverage,
  } = require('./scorers/fact-solution-alignment');

  assert.equal(asksForReversibleChoice('Should I put this in the service or formatter?'), true);
  assert.equal(asksForReversibleChoice('Which helper should own this behavior?'), true);
  assert.equal(asksForReversibleChoice('Reply “implement this” to approve the formatter boundary.'), false);
  assert.equal(hasFocusedCoverage("formatOrderLabel({ name: '   ' })"), true);
  assert.equal(hasFocusedCoverage('    formatOrderLabel({ name: validName })'), false);
});

test('justified novelty scorer requires an explicit concrete benefit', () => {
  const { explainsBenefit } = require('./scorers/justified-novelty');

  assert.equal(
    explainsBenefit('A generator keeps the iterable lazy without materializing an array.'),
    true,
  );
  assert.equal(explainsBenefit('Implemented the iterator and tests.'), false);
});

test('diagnose cleanup scorer detects retained debug-only artifacts', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(
    require('node:os').tmpdir(),
    'engineering-flow-debug-cleanup-',
  ));
  const workspace = path.join(temporaryRoot, 'workspace');
  fs.cpSync(path.join(ROOT, benchmarks['regression-sensitivity'].fixture), workspace, {
    recursive: true,
  });
  assert.equal(run('git', ['init', '-b', 'main'], workspace).status, 0);
  assert.equal(run('git', ['config', 'user.email', 'test@example.invalid'], workspace).status, 0);
  assert.equal(run('git', ['config', 'user.name', 'Test'], workspace).status, 0);
  assert.equal(run('git', ['add', '.'], workspace).status, 0);
  assert.equal(run('git', ['commit', '-m', 'baseline'], workspace).status, 0);

  const {
    hasDebugArtifacts,
    stayedReadOnly,
  } = require('./scorers/diagnose-cleanup');
  assert.equal(hasDebugArtifacts(workspace), false);
  assert.equal(stayedReadOnly({ diff: '' }), true);
  assert.equal(stayedReadOnly({ diff: 'diff --git a/README.md b/README.md\n' }), false);
  fs.appendFileSync(
    path.join(workspace, 'src', 'renewal-date.js'),
    '\nconsole.log("TEMP_DEBUG");\n',
  );
  assert.equal(hasDebugArtifacts(workspace), true);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('diagnose continuation requires probe evidence rather than causal keywords alone', () => {
  const { hasDistinguishingEvidence } = require('./scorers/diagnose-continuation');
  const temporaryRoot = fs.mkdtempSync(path.join(
    require('node:os').tmpdir(),
    'engineering-flow-diagnose-evidence-',
  ));
  const events = path.join(temporaryRoot, 'turn.jsonl');
  fs.writeFileSync(events, [
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: "node -e \"const d = new Date('2024-01-31T00:00:00Z'); d.setUTCMonth(1); console.log(d.toISOString())\"",
        aggregated_output: '2024-03-02T00:00:00.000Z\n',
      },
    }),
  ].join('\n'));

  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'The month and date overflow are related.',
    events,
  }), false);
  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'setUTCMonth runs while day 31 is still retained, so February normalizes the overflow into March.',
    events,
  }), true);
  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'setUTCMonth applies the target month first, with day 31 retained, then February overflows into March.',
    events,
  }), true);
  assert.equal(hasDistinguishingEvidence({
    finalMessage: 'setUTCMonth retains day 31, constructs 2024-02-31, and immediately normalizes the overflow to March.',
    events,
  }), true);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('no-reproduction scorer requires both failed reproduction and bounded certainty', () => {
  const { reportsEvidenceLimit } = require('./scorers/diagnose-no-reproduction');

  assert.equal(reportsEvidenceLimit(
    'I could not reproduce the duplicate IDs, so there is no supported root cause yet.',
  ), true);
  assert.equal(reportsEvidenceLimit(
    'I could not reproduce it, but the cache refresh is definitely racing with the reader.',
  ), false);
  assert.equal(reportsEvidenceLimit(
    'The available code looks correct and the tests pass.',
  ), false);
  assert.equal(reportsEvidenceLimit(
    'The reported duplicate IDs cannot be reproduced. No repository-supported root cause can be established.',
  ), true);
  assert.equal(reportsEvidenceLimit(
    'The reported duplicate-ID behavior cannot be established from this repository. No repository-supported root cause was found.',
  ), true);
  assert.equal(reportsEvidenceLimit(
    'The issue cannot be reproduced, therefore the cache refresh is definitely racing.',
  ), false);
});

test('requirement lifecycle scorer accepts one optional CSV record terminator', () => {
  const { csvMatches } = require('./scorers/develop-requirement-lifecycle');
  const {
    hasStaleProspectiveLanguage,
    observedDraftValidatorPass,
    observedReadyValidatorPass,
    persistsReadyValidator,
    reconcilesCompletionEvidence,
  } = require('./scorers/durable-record');
  const expected = 'id,name,status\ncustomer-1,Ada,active';

  assert.equal(csvMatches(expected, expected), true);
  assert.equal(csvMatches(`${expected}\n`, expected), true);
  assert.equal(csvMatches(expected.replaceAll('\n', '\r\n') + '\r\n', expected), true);
  assert.equal(csvMatches(`${expected}\n\n`, expected), false);

  const completedRecord = [
    '# Customer Export',
    'Status: Implemented',
    '## Completion evidence',
    '- Implementation files: `src/customer-export.js`',
    '- Test files: `customer-export.test.js`',
    '- Verification: `npm test` — passed, 5 tests',
    '- Deviations: None',
    '- Ready validator: `validate-requirement-record.js --mode ready` — passed',
  ].join('\n\n');
  const finalTurn = {
    diff: [
      'diff --git a/src/customer-export.js b/src/customer-export.js',
      'diff --git a/customer-export.test.js b/customer-export.test.js',
    ].join('\n'),
    publicTests: { command: 'npm', args: ['test'], passed: true },
  };

  assert.equal(reconcilesCompletionEvidence(completedRecord, finalTurn), true);
  assert.equal(reconcilesCompletionEvidence(
    completedRecord.replace('`npm test`', '`node --test customer-export.test.js`'),
    finalTurn,
  ), false);
  assert.equal(hasStaleProspectiveLanguage(
    completedRecord.replace('None', 'None\n\nFocused tests will be added after approval.'),
  ), true);
  assert.equal(reconcilesCompletionEvidence(
    completedRecord.replace('customer-export.test.js', 'an adjacent test file'),
    finalTurn,
  ), false);

  const validatorEvent = JSON.stringify({
    type: 'item.completed',
    item: {
      type: 'command_execution',
      command: 'node /plugin/skills/develop/scripts/validate-requirement-record.js --record docs/requirements/customer-export.md --mode ready',
      exit_code: 0,
    },
  });
  assert.equal(observedReadyValidatorPass(validatorEvent), true);
  assert.equal(observedDraftValidatorPass(
    validatorEvent.replace('--mode ready', '--mode draft'),
  ), true);
  assert.equal(persistsReadyValidator({ requirementDocuments: [{
    path: 'docs/requirements/customer-export.md',
    status: 'Accepted',
    content: completedRecord
      .replace('Status: Implemented', 'Status: Accepted')
      .replace(
        '`validate-requirement-record.js --mode ready` — passed',
        '`node "/plugin/skills/develop/scripts/validate-requirement-record.js" --record docs/requirements/customer-export.md --mode ready --finalize`',
      ),
  }] }, 'docs/requirements/customer-export.md'), true);
  assert.equal(observedReadyValidatorPass(
    validatorEvent.replace('"exit_code":0', '"exit_code":1'),
  ), false);
});

test('handoff scorer accepts a compact evidence-backed response without workspace changes', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(
    require('node:os').tmpdir(),
    'engineering-flow-handoff-scorer-',
  ));
  const workspace = path.join(temporaryRoot, 'workspace');

  try {
    fs.cpSync(path.join(ROOT, benchmarks['handoff-continuation'].fixture), workspace, { recursive: true });
    assert.equal(run('git', ['init', '-b', 'main'], workspace).status, 0);
    assert.equal(run('git', ['config', 'user.email', 'test@example.invalid'], workspace).status, 0);
    assert.equal(run('git', ['config', 'user.name', 'Test'], workspace).status, 0);
    assert.equal(run('git', ['add', '.'], workspace).status, 0);
    assert.equal(run('git', ['commit', '-m', 'fixture baseline'], workspace).status, 0);

    require('../fixtures/handoff-continuation/setup')(workspace);
    const head = run('git', ['rev-parse', '--short', 'HEAD'], workspace).stdout.trim();
    const finalMessage = [
      '# Objective and accepted behavior',
      'Complete buildNotificationDigest minimum-severity filtering for low, medium, or high. Preserve input order and reject unsupported values with TypeError.',
      '# Current implementation state',
      'Implementation is partial: src/notification-digest.js filters by the threshold, and notification-digest.test.js covers high filtering without reordering.',
      '# Key files and authoritative documents',
      'The accepted requirement is docs/requirements/notification-digest-severity.md; the rationale is docs/decisions/001-preserve-digest-order.md. The implementation and test files above are the active diff.',
      '# Decisions and reasons',
      'Decision 001 preserves timeline order; numeric ranks are for filtering only, never sorting.',
      '# Commands and latest results',
      `git diff --check passed. The latest commit is ${head} fixture baseline. npm test passed with exit code \`0\` and no failures.`,
      '# Remaining work in dependency order',
      '1. First validate the minimum-severity threshold and all event severities before filtering. 2. Then add rejection tests and coverage for both unsupported cases. 3. Run npm test again.',
      '# Risks, blockers, and unverified areas',
      'Risk: invalid severity currently produces an empty or incomplete digest. Unsupported severity rejection is unverified. Blockers: none.',
      '# Version-control state and unrelated work',
      'Version-control state: unstaged modifications affect src/notification-digest.js, notification-digest.test.js, and unrelated notes/team-notes.md. Preserve that unrelated edit. The latest commit remains fixture baseline.',
    ].join('\n\n');
    const scorer = require('./scorers/handoff');
    const context = {
      finalMessage,
      turns: [{
        finalMessage,
        diff: run('git', ['diff', '--', '.'], workspace).stdout,
        workspaceState: { unauthorizedCommit: false },
      }],
    };
    const score = scorer(workspace, context);

    assert.equal(score.passed, true);
    assert.ok(Object.values(score.checks).every((value) => typeof value === 'boolean'));

    const countStyleResult = scorer(workspace, {
      ...context,
      finalMessage: finalMessage.replace(
        'npm test passed with exit code `0` and no failures.',
        'npm test — passed: 2 tests, 0 failures.',
      ),
    });
    assert.equal(countStyleResult.checks.includesCommandsAndLatestResults, true);

    const semanticThresholdResult = scorer(workspace, {
      ...context,
      finalMessage: finalMessage
        .replace(
          'Complete buildNotificationDigest minimum-severity filtering for low, medium, or high.',
          'Complete buildNotificationDigest severity filtering for low, medium, or high; an omitted threshold defaults to low.',
        )
        .replace('minimum-severity threshold', 'severity threshold'),
    });
    assert.equal(semanticThresholdResult.checks.includesObjectiveAndAcceptedBehavior, true);

    const passingCountResult = scorer(workspace, {
      ...context,
      finalMessage: finalMessage.replace(
        'npm test passed with exit code `0` and no failures.',
        'npm test — passed, 2 tests.',
      ),
    });
    assert.equal(passingCountResult.checks.includesCommandsAndLatestResults, true);

    const failedTestResult = scorer(workspace, {
      ...context,
      finalMessage: finalMessage.replace(
        'npm test passed with exit code `0` and no failures.',
        'npm test — failed, 1 test failed with exit code `1`.',
      ),
    });
    assert.equal(failedTestResult.checks.includesCommandsAndLatestResults, false);

    const requirement = fs.readFileSync(
      path.join(workspace, 'docs', 'requirements', 'notification-digest-severity.md'),
      'utf8',
    );
    const copiedDocument = scorer(workspace, {
      ...context,
      finalMessage: `${finalMessage}\n\n${requirement}`,
    });
    assert.equal(copiedDocument.passed, false);
    assert.equal(copiedDocument.checks.referencesExistingEvidenceCompactly, false);

    fs.writeFileSync(path.join(workspace, 'handoff.md'), 'Do not create this file.\n');
    const repositoryFileCreated = scorer(workspace, context);
    assert.equal(repositoryFileCreated.passed, false);
    assert.equal(repositoryFileCreated.checks.returnsHandoffWithoutCreatingRepositoryFile, false);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
