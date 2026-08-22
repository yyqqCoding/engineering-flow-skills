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

const REQUIREMENT_PATH = 'docs/requirements/invoice-ledger.md';

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'invoice-ledger.js');
  const testPath = path.join(workspace, 'invoice-ledger.test.js');
  const requirementPath = path.join(workspace, REQUIREMENT_PATH);
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { buildInvoiceLedger, normalizeInvoiceReference } = require(modulePath);
    const invoices = [
      { sequence: 11, reference: ' inv-11 ', state: 'void', amount: '9.50', internal: true },
      { sequence: 2, reference: 'Inv-2', state: 'posted', amount: 7, internal: false },
    ];
    const snapshot = JSON.stringify(invoices);
    let invalidRejected = false;
    try {
      buildInvoiceLedger(null);
    } catch (error) {
      invalidRejected = error instanceof TypeError
        && error.message === 'invoices must be an array';
    }

    behaviorCorrect = normalizeInvoiceReference('  inv-42  ') === 'INV-42'
      && JSON.stringify(buildInvoiceLedger(invoices))
        === '[{"sequence":2,"reference":"Inv-2","state":"posted","amount":7}]'
      && JSON.stringify(buildInvoiceLedger(invoices, { includeVoid: true }))
        === '[{"sequence":2,"reference":"Inv-2","state":"posted","amount":7},{"sequence":11,"reference":" inv-11 ","state":"void","amount":"9.50"}]'
      && JSON.stringify(invoices) === snapshot
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
  const focusedCoverage = /buildInvoiceLedger/.test(tests)
    && /includeVoid/.test(tests)
    && /invoices must be an array/.test(tests);
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
