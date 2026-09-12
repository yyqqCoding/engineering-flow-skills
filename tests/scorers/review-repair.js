const fs = require('node:fs');
const path = require('node:path');
const {
  detectsMutation,
  observesRegressionBeforeRepair,
  unchangedSinceStart,
} = require('./workflow-transition-evidence');

const BYPASS = `function canViewReport(user, report) {
  return user.active && user.orgId === report.orgId || user.role === 'manager';
}
module.exports = { canViewReport };
`;

function identifiesLocatedManagerBypass(finding) {
  const text = String(finding || '').replace(/[*_`]/g, '');
  if (!/access\.js(?::\d+|[^\n]{0,60}line\s+\d+)/i.test(text)) return false;
  const clauses = text.split(/\r?\n|[;。！？]+|(?<=[.!?])\s+|\b(?:but|however)\b/i);
  return clauses.some((clause) => {
    if (!/\bmanagers?\b/i.test(clause)) return false;
    // A policy, a denial, or a suggested check is not an observed access failure.
    const deniedOrPrescribed = /\b(?:cannot|can not|can't|never|must|should|denies|denied|deny)\b|\bno\s+(?:managers?|bypass)\b|\b(?:does not|do not|did not|doesn't|don't|is not|are not|isn't|aren't)\s+(?:allow(?:ed)?|grant(?:ed)?|permit(?:ted)?|bypass|ignore|skip|access|view|read|return)\b|\b(?:prevents?|blocks?|stops?|prohibits?|forbids?)\b.{0,60}\b(?:managers?|bypass)/i;
    const unsubstantiated = /\bno (?:evidence|finding|issue)\b|\b(?:verify|check|test|confirm)\s+whether\b/i;
    const bypass = /\b(?:bypass(?:es|ing)?|ignore(?:s|d)?|skip(?:s|ped)?)\b.{0,100}?\b(?:orgId|organization(?:al)?\s+checks?)\b/i.exec(clause);
    const grant = /\b(?:allows?|allowed|grants?|granted|permits?|permitted|lets?|can\s+(?:access|view|read)|returns?\s+true)\b/i.exec(clause);
    const boundary = /\bcross[- ]org(?:anization)?\b|\b(?:other|another|different)\s+organizations?\b|\b(?:regardless|irrespective)\s+of\b.{0,100}?\b(?:orgId|organizations?)\b/i.exec(clause);
    // Include the boundary's predicate: its denial cannot complete an earlier valid grant.
    const boundaryIsDenied = boundary && /^(?:\s+access)?\s+(?:is|are|remains?)\s+(?:denied|blocked|forbidden|prohibited|not\s+(?:allowed|granted|permitted))\b/i.test(
      clause.slice(boundary.index + boundary[0].length),
    );
    const claimEnds = [];
    if (bypass) claimEnds.push(bypass.index + bypass[0].length);
    if (grant && boundary && !boundaryIsDenied) claimEnds.push(Math.max(
      grant.index + grant[0].length, boundary.index + boundary[0].length,
    ));
    return claimEnds.some((end) => {
      // A later quotation of the policy must not negate an already stated bypass.
      const claim = clause.slice(0, end);
      return !deniedOrPrescribed.test(claim) && !unsubstantiated.test(claim);
    });
  });
}

function hasCorrectAccessPolicy(workspace) {
  try {
    const modulePath = path.join(workspace, 'src/access.js');
    delete require.cache[require.resolve(modulePath)];
    const { canViewReport } = require(modulePath);
    for (const role of ['member', 'manager', 'guest']) {
      for (const active of [true, false]) {
        for (const orgId of ['org-1', 'org-2']) {
          const expected = active && orgId === 'org-1' && role !== 'guest';
          if (canViewReport({ role, active, orgId }, { orgId: 'org-1' }) !== expected) return false;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = function score(workspace, context = {}) {
  const [review, repair] = context.turns || [];
  const finding = review?.finalMessage || '';
  const finalStatus = String(repair?.workspaceState?.status || '').split(/\r?\n/).filter(Boolean)
    .map((line) => line.slice(3).replaceAll('\\', '/')).sort();
  const policyPath = path.join(workspace, 'docs/access-policy.md');
  const checks = {
    reviewRemainsReadOnly: unchangedSinceStart(review, context.initialWorkspaceState),
    findingIdentifiesPermissionFailureWithLocation: identifiesLocatedManagerBypass(finding),
    authorizedRepairPreservesAccessPolicy: hasCorrectAccessPolicy(workspace)
      && fs.readFileSync(policyPath, 'utf8').includes('A role never grants cross-organization access.'),
    repairsOnlyTheSelectedFinding: finalStatus.includes('access.test.js')
      && finalStatus.every((filename) => ['access.test.js', 'src/access.js'].includes(filename)),
    observesRegressionBeforeProductionRepair: observesRegressionBeforeRepair(
      repair, 'src/access.js', 'access.test.js',
    ),
    retainsSensitiveRegressionCoverage: detectsMutation(workspace, 'src/access.js', BYPASS),
    completesWithoutAnotherDevelopGate: repair?.publicTests?.passed === true
      && (repair.metrics?.invokedSkills || []).every((name) => name === 'review')
      && repair.workspaceState?.unauthorizedCommit === false,
  };
  return { passed: context.turns?.length === 2 && Object.values(checks).every(Boolean), checks };
};
