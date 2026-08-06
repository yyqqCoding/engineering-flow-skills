const fs = require('node:fs');
const path = require('node:path');

function implementationChanged(diff) {
  return /^diff --git a\/(?:src\/|[^/]*\.test\.js|package\.json)/m.test(diff || '');
}

function hasRequirementState(turn, expected) {
  return (turn?.requirementDocuments || []).some((document) => (
    document.path === 'docs/requirements/customer-export.md'
      && document.status === expected
  ));
}

function expectedCsv() {
  return [
    'id,name,status',
    '1,"Ada, ""A""",active',
    '2,"Line One\nLine Two",disabled',
  ].join('\n');
}

function normalizeLineEndings(csv) {
  return csv.replaceAll('\r\n', '\n');
}

function csvMatches(actual, expected) {
  return normalizeLineEndings(actual).replace(/\n$/, '') === expected;
}

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'customer-export.js');
  const testPath = path.join(workspace, 'customer-export.test.js');
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { buildCustomerExport, normalizeCustomerName } = require(modulePath);
    const customers = [
      { id: 2, name: 'Line One\nLine Two', status: 'disabled' },
      { id: 1, name: 'Ada, "A"', status: 'active' },
    ];
    const snapshot = JSON.stringify(customers);
    const defaultCsv = buildCustomerExport(customers);
    const completeCsv = buildCustomerExport(customers, { includeDisabled: true });
    let invalidRejected = false;
    try {
      buildCustomerExport(null);
    } catch (error) {
      invalidRejected = error instanceof TypeError
        && error.message === 'customers must be an array';
    }

    behaviorCorrect = normalizeCustomerName('  Ada  Lovelace ') === 'Ada Lovelace'
      && csvMatches(defaultCsv, [
        'id,name,status',
        '1,"Ada, ""A""",active',
      ].join('\n'))
      && csvMatches(completeCsv, expectedCsv())
      && JSON.stringify(customers) === snapshot
      && invalidRejected;
  } catch {
    behaviorCorrect = false;
  }

  const tests = fs.existsSync(testPath) ? fs.readFileSync(testPath, 'utf8') : '';
  const requirementPath = path.join(workspace, 'docs', 'requirements', 'customer-export.md');
  const requirement = fs.existsSync(requirementPath)
    ? fs.readFileSync(requirementPath, 'utf8')
    : '';
  const draftPaused = !implementationChanged(turns[0]?.diff)
    && hasRequirementState(turns[0], 'Draft');
  const acceptedPaused = !implementationChanged(turns[1]?.diff)
    && hasRequirementState(turns[1], 'Accepted');
  const implementedAfterEvidence = implementationChanged(turns[2]?.diff)
    && hasRequirementState(turns[2], 'Implemented')
    && turns[2]?.publicTests?.passed
    && behaviorCorrect;
  const focusedCoverage = /buildCustomerExport/.test(tests)
    && /includeDisabled/.test(tests)
    && /customers must be an array/.test(tests);
  const durableRecord = /Status:\s*Implemented/i.test(requirement)
    || hasRequirementState(turns[2], 'Implemented');
  const reconciledRecord = durableRecord
    && /Acceptance|验收/i.test(requirement)
    && /Out of scope|非目标|范围外/i.test(requirement)
    && /customer-export\.test\.js/.test(requirement)
    && !/test-running|to be (?:added|created)|待添加|待创建/i.test(requirement);

  return {
    passed: turns.length === 3
      && draftPaused
      && acceptedPaused
      && implementedAfterEvidence
      && focusedCoverage
      && reconciledRecord,
    checks: {
      createsDraftRequirementAndPauses: draftPaused,
      recordsApprovalWithoutImplementing: acceptedPaused,
      implementsThenMarksRequirementImplemented: implementedAfterEvidence,
      leavesFocusedCoverage: focusedCoverage,
      keepsDurableAcceptanceRecord: reconciledRecord,
    },
  };
};

module.exports.csvMatches = csvMatches;
