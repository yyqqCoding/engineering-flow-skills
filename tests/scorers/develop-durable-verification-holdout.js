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

const REQUIREMENT_PATH = 'docs/requirements/return-bundle.md';

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'return-bundle.js');
  const testPath = path.join(workspace, 'return-bundle.test.js');
  const requirementPath = path.join(workspace, REQUIREMENT_PATH);
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { buildReturnBundle, normalizeRecipient } = require(modulePath);
    const returns = [
      { position: 8, recipient: ' Warehouse-8 ', state: 'held', amount: '18.00', internal: true },
      { position: 1, recipient: 'Warehouse-1', state: 'ready', amount: 4, internal: false },
    ];
    const snapshot = JSON.stringify(returns);
    let invalidRejected = false;
    try {
      buildReturnBundle(null);
    } catch (error) {
      invalidRejected = error instanceof TypeError
        && error.message === 'returns must be an array';
    }

    behaviorCorrect = normalizeRecipient('  Warehouse-42  ') === 'warehouse-42'
      && JSON.stringify(buildReturnBundle(returns))
        === '[{"position":1,"recipient":"Warehouse-1","state":"ready","amount":4}]'
      && JSON.stringify(buildReturnBundle(returns, { includeHeld: true }))
        === '[{"position":1,"recipient":"Warehouse-1","state":"ready","amount":4},{"position":8,"recipient":" Warehouse-8 ","state":"held","amount":"18.00"}]'
      && JSON.stringify(returns) === snapshot
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
  const focusedCoverage = /buildReturnBundle/.test(tests)
    && /includeHeld/.test(tests)
    && /returns must be an array/.test(tests);
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
