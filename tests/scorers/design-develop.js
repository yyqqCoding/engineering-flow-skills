const scoreWallet = require('./post-implementation-testing');
const {
  hasPassingTestCommand,
  requestsApproval,
  unchangedSinceStart,
} = require('./workflow-transition-evidence');

function hasAcceptanceExamples(message) {
  const text = String(message || '').replace(/[`*_]/g, '');
  function example(balance, amount, expected) {
    const input = `(?:debitBalance\\(\\s*${balance}\\s*,\\s*${amount}\\s*\\)|${balance}\\s*\\|\\s*${amount}\\s*\\||${balance}\\s*-\\s*${amount}\\s*=)`;
    return new RegExp(`${input}[^\\n]{0,90}\\b${expected}\\b`, 'i').test(text);
  }
  return example(10, 4, '6') && example(4, 4, '0') && example(5, 6, 'RangeError');
}

function hasEarlyAcceptanceEvidence(message) {
  const text = String(message || '');
  const referencesProvidedExamples = /(?:reuse|use|retain|carry|follow|verify|cover|test)[^\n]{0,80}(?:user[- ]provided|provided|supplied|given|request)[^\n]{0,50}(?:examples|cases)/i.test(text)
    || /(?:acceptance examples|examples|cases)[^\n]{0,60}(?:provided|supplied|given|in the request)/i.test(text)
    || /(?:复用|采用|沿用|覆盖|验证).{0,30}(?:用户|给出|已提供|请求).{0,30}(?:实例|示例|案例)/.test(text);
  const verificationIntent = /test|verif|测试|验证/i.test(text)
    && /debitBalance|wallet\.test|public (?:API|interface|function)|exact[- ]balance|overdraft|insufficient balance|公开接口|余额/i.test(text);
  return (hasAcceptanceExamples(text) || referencesProvidedExamples) && verificationIntent;
}

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const wallet = scoreWallet(workspace, context);
  const [design, checkpoint, implementation] = turns;
  const plannedEvidence = `${design?.finalMessage || ''}\n${checkpoint?.finalMessage || ''}`;
  const checks = {
    designAndCheckpointPreserveWorkspace: unchangedSinceStart(design, context.initialWorkspaceState)
      && unchangedSinceStart(checkpoint, context.initialWorkspaceState),
    explicitDevelopRetainsOneApprovalGate: /\$engineering-flow:develop\b/.test(checkpoint?.prompt || '')
      && requestsApproval(checkpoint?.finalMessage)
      && implementation?.publicTests?.passed === true,
    recordsIndependentAcceptanceExamplesBeforeImplementation: hasEarlyAcceptanceEvidence(plannedEvidence),
    implementsAcceptedBalanceInvariant: wallet.checks.implementsAcceptedBalanceInvariant,
    changesOnlyProductionAndEstablishedTestFiles: wallet.checks.changesOnlyProductionAndEstablishedTestFiles,
    fulfillsBoundaryExamplesWithSensitiveCoverage: wallet.checks.testsDetectOverdraftAndExactBalanceBoundary,
    reportsFreshVerificationEvidence: hasPassingTestCommand(implementation)
      && /wallet\.test\.js|npm test|node --test/.test(implementation?.finalMessage || ''),
  };
  return {
    passed: turns.length === 3 && Object.values(checks).every(Boolean),
    checks,
    observations: {
      // This remains diagnostic. The historical scorer keeps its original ordering gate.
      writesProductionBeforeTests: wallet.checks.writesProductionBeforeTests,
    },
  };
};

module.exports.hasAcceptanceExamples = hasAcceptanceExamples;
module.exports.hasEarlyAcceptanceEvidence = hasEarlyAcceptanceEvidence;
