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

const REQUIREMENT_PATH = 'docs/requirements/shipment-manifest.md';

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'shipment-manifest.js');
  const testPath = path.join(workspace, 'shipment-manifest.test.js');
  const requirementPath = path.join(workspace, REQUIREMENT_PATH);
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { buildShipmentManifest, normalizeDestination } = require(modulePath);
    const shipments = [
      { id: 12, destination: '  South Dock  ', status: 'cancelled', internal: true },
      { id: 3, destination: 'North  Dock', status: 'ready', internal: false },
    ];
    const snapshot = JSON.stringify(shipments);
    let invalidRejected = false;
    try {
      buildShipmentManifest(null);
    } catch (error) {
      invalidRejected = error instanceof TypeError
        && error.message === 'shipments must be an array';
    }

    behaviorCorrect = normalizeDestination('  North   Dock  ') === 'North Dock'
      && JSON.stringify(buildShipmentManifest(shipments))
        === '[{"id":3,"destination":"North  Dock","status":"ready"}]'
      && JSON.stringify(buildShipmentManifest(shipments, { includeCancelled: true }))
        === '[{"id":3,"destination":"North  Dock","status":"ready"},{"id":12,"destination":"  South Dock  ","status":"cancelled"}]'
      && JSON.stringify(shipments) === snapshot
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
  const focusedCoverage = /buildShipmentManifest/.test(tests)
    && /includeCancelled/.test(tests)
    && /shipments must be an array/.test(tests);
  const reconciledRecord = /Status:\s*Implemented/i.test(requirement)
    && /Acceptance|验收/i.test(requirement)
    && /Out of scope|非目标|范围外/i.test(requirement)
    && reconcilesCompletionEvidence(requirement, turns[2]);
  const validatedBeforeCompletion = observedReadyValidatorPass(context.events);
  const validatedDraft = observedDraftValidatorPass(context.events);
  const durableValidatorCommand = persistsReadyValidator(turns[0], REQUIREMENT_PATH)
    && persistsReadyValidator(turns[1], REQUIREMENT_PATH);

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
      createsDraftRequirementAndPauses: draftPaused,
      recordsApprovalWithoutImplementing: acceptedPaused,
      resumesFromDurableRecordAndImplements: implementedAfterEvidence,
      leavesFocusedCoverage: focusedCoverage,
      replacesPendingGateWithActualEvidence: reconciledRecord,
      runsPassingDraftValidator: validatedDraft,
      persistsReadyValidatorCommand: durableValidatorCommand,
      runsPassingCompletionValidator: validatedBeforeCompletion,
    },
  };
};
