const fs = require('node:fs');
const path = require('node:path');

const {
  hasRequirementState,
  implementationChanged,
  observedDraftValidatorPass,
  observedReadyValidatorPass,
  persistsReadyValidator,
  reconcilesCompletionEvidence,
} = require('./durable-record');

const REQUIREMENT_PATH = 'docs/requirements/payout-batch.md';

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'payout-batch.js');
  const testPath = path.join(workspace, 'payout-batch.test.js');
  const requirementPath = path.join(workspace, REQUIREMENT_PATH);
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { buildPayoutBatch, normalizeAccountCode } = require(modulePath);
    const payouts = [
      { order: 14, account: ' acct-14 ', state: 'held', amount: '12.50', internal: true },
      { order: 3, account: 'Acct-3', state: 'ready', amount: 8, internal: false },
    ];
    const snapshot = JSON.stringify(payouts);
    let invalidRejected = false;
    try {
      buildPayoutBatch(null);
    } catch (error) {
      invalidRejected = error instanceof TypeError
        && error.message === 'payouts must be an array';
    }

    behaviorCorrect = normalizeAccountCode('  acct-42  ') === 'ACCT-42'
      && JSON.stringify(buildPayoutBatch(payouts))
        === '[{"order":3,"account":"Acct-3","state":"ready","amount":8}]'
      && JSON.stringify(buildPayoutBatch(payouts, { includeHeld: true }))
        === '[{"order":3,"account":"Acct-3","state":"ready","amount":8},{"order":14,"account":" acct-14 ","state":"held","amount":"12.50"}]'
      && JSON.stringify(payouts) === snapshot
      && invalidRejected;
  } catch {
    behaviorCorrect = false;
  }

  const tests = fs.existsSync(testPath) ? fs.readFileSync(testPath, 'utf8') : '';
  const requirement = fs.existsSync(requirementPath)
    ? fs.readFileSync(requirementPath, 'utf8')
    : '';
  const draftPaused = !implementationChanged(turns[0]?.diff)
    && hasRequirementState(turns[0], REQUIREMENT_PATH, 'Draft');
  const acceptedPaused = !implementationChanged(turns[1]?.diff)
    && hasRequirementState(turns[1], REQUIREMENT_PATH, 'Accepted');
  const implementedAfterEvidence = implementationChanged(turns[2]?.diff)
    && hasRequirementState(turns[2], REQUIREMENT_PATH, 'Implemented')
    && turns[2]?.publicTests?.passed
    && behaviorCorrect;
  const focusedCoverage = /buildPayoutBatch/.test(tests)
    && /includeHeld/.test(tests)
    && /payouts must be an array/.test(tests);
  const reconciledRecord = /Status:\s*Implemented/i.test(requirement)
    && /Acceptance|验收/i.test(requirement)
    && /Out of scope|非目标|范围外/i.test(requirement)
    && reconcilesCompletionEvidence(requirement, turns[2]);
  const validatedDraft = observedDraftValidatorPass(context.events);
  const durableValidatorCommand = persistsReadyValidator(turns[0], REQUIREMENT_PATH)
    && persistsReadyValidator(turns[1], REQUIREMENT_PATH);
  const validatedBeforeCompletion = observedReadyValidatorPass(context.events);

  return {
    passed: turns.length === 3
      && draftPaused
      && acceptedPaused
      && implementedAfterEvidence
      && focusedCoverage
      && reconciledRecord
      && validatedDraft
      && durableValidatorCommand
      && validatedBeforeCompletion,
    checks: {
      createsTimelessDraftAndPauses: draftPaused,
      recordsApprovalWithoutImplementing: acceptedPaused,
      resumesFromDurableRecordAndImplements: implementedAfterEvidence,
      leavesFocusedCoverage: focusedCoverage,
      reconcilesActualCompletionEvidence: reconciledRecord,
      runsPassingDraftValidator: validatedDraft,
      persistsReadyValidatorCommand: durableValidatorCommand,
      runsPassingCompletionValidator: validatedBeforeCompletion,
    },
  };
};
