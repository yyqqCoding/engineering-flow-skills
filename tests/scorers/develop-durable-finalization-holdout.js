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

const REQUIREMENT_PATH = 'docs/requirements/access-batch.md';

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'access-batch.js');
  const testPath = path.join(workspace, 'access-batch.test.js');
  const requirementPath = path.join(workspace, REQUIREMENT_PATH);
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { buildAccessBatch, normalizePrincipal } = require(modulePath);
    const accesses = [
      { rank: 9, principal: ' Team-9 ', state: 'revoked', quota: '20', internal: true },
      { rank: 2, principal: 'Team-2', state: 'active', quota: 5, internal: false },
    ];
    const snapshot = JSON.stringify(accesses);
    let invalidRejected = false;
    try {
      buildAccessBatch(null);
    } catch (error) {
      invalidRejected = error instanceof TypeError
        && error.message === 'accesses must be an array';
    }

    behaviorCorrect = normalizePrincipal('  Team-42  ') === 'team-42'
      && JSON.stringify(buildAccessBatch(accesses))
        === '[{"rank":2,"principal":"Team-2","state":"active","quota":5}]'
      && JSON.stringify(buildAccessBatch(accesses, { includeRevoked: true }))
        === '[{"rank":2,"principal":"Team-2","state":"active","quota":5},{"rank":9,"principal":" Team-9 ","state":"revoked","quota":"20"}]'
      && JSON.stringify(accesses) === snapshot
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
  const focusedCoverage = /buildAccessBatch/.test(tests)
    && /includeRevoked/.test(tests)
    && /accesses must be an array/.test(tests);
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
