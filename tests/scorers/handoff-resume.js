const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  detectsMutation,
  hasPassingTestCommand,
  requestsApproval,
  turnItems,
  unchangedSinceStart,
} = require('./workflow-transition-evidence');

function consumesHandoffInFreshSession(source, consumer) {
  const handoff = consumer?.handoff;
  if (!handoff || handoff.sourceTurn !== source?.index
      || handoff.sourceThreadId !== source.session?.threadId
      || consumer.session?.fresh !== true || consumer.session.resumedFromThreadId !== null
      || !consumer.session.threadId || consumer.session.threadId === source.session?.threadId
      || !consumer.session.codexHome || consumer.session.codexHome === source.session?.codexHome
      || typeof handoff.path !== 'string'
      || !fs.existsSync(handoff.path)) return false;
  const content = fs.readFileSync(handoff.path, 'utf8');
  const normalize = (value) => String(value || '').replace(/^[ \t]*\d+\t/gm, '')
    .replace(/\s+/g, ' ').trim();
  const observed = turnItems(consumer).filter((item) => item.type === 'command_execution'
      && item.exit_code === 0 && String(item.command || '').includes(handoff.path))
    .map((item) => normalize(item.aggregated_output)).join(' ');
  return content.trim() !== '' && content === source.finalMessage
    && handoff.sha256 === crypto.createHash('sha256').update(content).digest('hex')
    && !consumer.prompt.includes(content)
    && observed.includes(normalize(content));
}

function recordsApprovedImplementation(message) {
  const record = String(message || '').replace(/[*_`]/g, '');
  return !requestsApproval(record)
    && !/\bno (?:implementation|execution) (?:is )?authorized\b|未批准|未授权/i.test(record)
    && /\b(?:phase|status)\s*:\s*(?:accepted|approved|authorized)\b|\b(?:approval|authorization)\s*(?::|is)?\s*(?:granted|given|approved|accepted)\b|\b(?:implementation|checkpoint|task|plan|scope)\s+(?:(?:is|was|has been)\s+)?(?:already\s+)?(?:approved|authorized)\b|\b(?:approved|authorized)\s+(?:to implement|for implementation|implementation|checkpoint|task|plan|scope)\b|已批准|已授权/i.test(record);
}

function mathBehaviorCorrect(workspace) {
  try {
    const modulePath = path.join(workspace, 'src/math.js');
    delete require.cache[require.resolve(modulePath)];
    const { add, isEven } = require(modulePath);
    if (add(2, 3) !== 5 || isEven(0) !== true || isEven(4) !== true || isEven(-3) !== false) return false;
    for (const value of [2.5, '2', true]) {
      try {
        isEven(value);
        return false;
      } catch (error) {
        if (!(error instanceof TypeError) || error.message !== 'value must be an integer') return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function unchangedSincePreviousTurn(turn, previous) {
  if (!previous?.workspaceState) return false;
  return unchangedSinceStart(turn, {
    ...previous.workspaceState,
    diff: previous.diff,
    requirementDocuments: previous.requirementDocuments,
  });
}

function preservesMathScope(source, consumer) {
  const implementationFiles = ['math.test.js', 'src/math.js'];
  const statusEntries = (turn) => String(turn?.workspaceState?.status || '')
    .split(/\r?\n/).filter(Boolean).sort();
  const entryPath = (entry) => entry.slice(3).replaceAll('\\', '/');
  const outsideImplementation = (entry) => !implementationFiles.includes(entryPath(entry));
  const sourceEntries = statusEntries(source);
  const finalEntries = statusEntries(consumer);
  const changedImplementationFiles = finalEntries.map(entryPath)
    .filter((filename) => implementationFiles.includes(filename)).sort();
  return JSON.stringify(changedImplementationFiles) === JSON.stringify(implementationFiles)
    && JSON.stringify(finalEntries.filter(outsideImplementation))
      === JSON.stringify(sourceEntries.filter(outsideImplementation))
    && Array.isArray(source?.requirementDocuments)
    && Array.isArray(consumer?.requirementDocuments)
    && JSON.stringify(consumer.requirementDocuments) === JSON.stringify(source.requirementDocuments);
}

module.exports = function scoreHandoff(workspace, context, approved) {
  const [checkpoint, handoff, consumer] = context.turns || [];
  const record = handoff?.finalMessage || '';
  const recordsAuthority = approved
    ? recordsApprovedImplementation(record)
    : requestsApproval(record);
  const checks = {
    // This local fixture has no convention requiring a durable checkpoint. Preserve existing files;
    // classify new artifacts here without attributing them to later handoff or restoration turns.
    localCheckpointLeavesWorkspaceUnchanged: unchangedSinceStart(checkpoint, context.initialWorkspaceState),
    handoffPreservesSourceWorkspace: unchangedSincePreviousTurn(handoff, checkpoint),
    recordsSourceWorkflowAndAuthority: /develop/i.test(record) && recordsAuthority,
    transfersOnlyGeneratedHandoffToFreshSession: consumesHandoffInFreshSession(handoff, consumer),
    doesNotRouteANewWorkflowInConsumer: consumer?.metrics?.routedSkills?.length === 0,
  };
  if (approved) {
    checks.resumesAuthorizedImplementation = mathBehaviorCorrect(workspace)
      && consumer?.publicTests?.passed === true && hasPassingTestCommand(consumer);
    // Carried artifacts belong to the consumer's entry state, including earlier checkpoint output.
    checks.preservesScopeAndLeavesSensitiveCoverage = preservesMathScope(handoff, consumer)
      && detectsMutation(workspace, 'src/math.js', `function add(a, b) { return a + b; }
function isEven(value) {
  if (!Number.isInteger(value)) throw new TypeError('value must be an integer');
  return value > 0 && value % 2 === 0;
}
module.exports = { add, isEven };
`);
  } else {
    checks.recoversPendingTask = /\bisEven\b/.test(record)
      && checks.transfersOnlyGeneratedHandoffToFreshSession;
    checks.preservesPendingApprovalInFreshSession = unchangedSincePreviousTurn(consumer, handoff)
      && requestsApproval(consumer?.finalMessage);
  }
  return { passed: context.turns?.length === 3 && Object.values(checks).every(Boolean), checks };
};

module.exports.consumesHandoffInFreshSession = consumesHandoffInFreshSession;
module.exports.recordsApprovedImplementation = recordsApprovedImplementation;
module.exports.mathBehaviorCorrect = mathBehaviorCorrect;
module.exports.unchangedSincePreviousTurn = unchangedSincePreviousTurn;
module.exports.preservesMathScope = preservesMathScope;
