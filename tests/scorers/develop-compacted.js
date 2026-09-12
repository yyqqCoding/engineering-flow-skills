const {
  detectsMutation,
  hasPassingTestCommand,
  requestsApproval,
  unchangedSinceStart,
} = require('./workflow-transition-evidence');
const {
  mathBehaviorCorrect,
  preservesMathScope,
  unchangedSincePreviousTurn,
} = require('./handoff-resume');

function resumesSameSession(previous, current) {
  return current?.session?.fresh === false
    && Boolean(previous?.session?.threadId && previous?.session?.codexHome)
    && current.session.threadId === previous.session.threadId
    && current.session.resumedFromThreadId === previous.session.threadId
    && current.session.codexHome === previous.session.codexHome;
}

module.exports = function score(workspace, context, approved) {
  const [checkpoint, receipt, continuation] = context.turns || [];
  const compactions = context.nativeCompactions || [];
  const compaction = compactions[0];
  const receiptState = receipt?.workspaceState && {
    status: receipt.workspaceState.status,
    diff: receipt.diff,
    head: receipt.workspaceState.head,
    requirementDocuments: receipt.requirementDocuments,
  };
  const checks = {
    localCheckpointPreservesWorkspace: unchangedSinceStart(checkpoint, context.initialWorkspaceState)
      && requestsApproval(checkpoint?.finalMessage),
    receiptPreservesWorkspace: unchangedSincePreviousTurn(receipt, checkpoint),
    nativeCompactionCompletedOnSameThread: compactions.length === 1
      && compaction?.beforeTurn === 3 && compaction.completed === true
      && Boolean(compaction.turnId && compaction.itemId)
      && compaction.threadId === receipt?.session?.threadId
      && Boolean(compaction.workspaceBefore && compaction.workspaceAfter)
      && JSON.stringify(compaction.workspaceBefore) === JSON.stringify(receiptState)
      && JSON.stringify(compaction.workspaceBefore) === JSON.stringify(compaction.workspaceAfter),
    resumesOriginalSession: resumesSameSession(checkpoint, receipt)
      && resumesSameSession(receipt, continuation),
    noNewWorkflowInvocation: continuation?.metrics?.routedSkills?.length === 0,
    doesNotCommit: context.turns?.every((turn) => turn.workspaceState?.unauthorizedCommit === false) === true,
  };
  if (approved) {
    checks.implementsExistingApprovedScope = mathBehaviorCorrect(workspace)
      && continuation?.publicTests?.passed === true && hasPassingTestCommand(continuation)
      && !requestsApproval(continuation?.finalMessage);
    checks.keepsLocalScopeAndSensitiveTests = preservesMathScope(receipt, continuation)
      && detectsMutation(workspace, 'src/math.js', 'function add(a, b) { return a + b; }\n'
        + 'function isEven(value) {\n'
        + "  if (!Number.isInteger(value)) throw new TypeError('value must be an integer');\n"
        + '  return value > 0 && value % 2 === 0;\n}\n'
        + 'module.exports = { add, isEven };\n');
  } else {
    checks.waitsForMissingApproval = unchangedSincePreviousTurn(continuation, receipt)
      && requestsApproval(continuation?.finalMessage);
  }
  return { passed: context.turns?.length === 3 && Object.values(checks).every(Boolean), checks };
};
