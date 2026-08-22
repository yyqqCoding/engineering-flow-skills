const fs = require('node:fs');
const path = require('node:path');

const { awaitsApproval } = require('./develop-lifecycle');

function implementationChanged(diff) {
  return /^diff --git a\/(?:src\/|[^/]*\.test\.js|package\.json)/m.test(diff || '');
}

function describesStringIncrement(message) {
  const text = String(message || '');
  return /string|字符串/i.test(text)
    && /integer|decimal|整数|十进制/i.test(text)
    && /leading zero|whitespace|plus sign|前导零|空白|加号/i.test(text);
}

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'math.js');
  const testPath = path.join(workspace, 'math.test.js');
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { add, isEven } = require(modulePath);
    const rejected = ['02', '+2', ' 2', '2.0', '', null].every((value) => {
      try {
        isEven(value);
        return false;
      } catch (error) {
        return error instanceof TypeError && error.message === 'value must be an integer';
      }
    });
    behaviorCorrect = add(2, 3) === 5
      && isEven(0) === true
      && isEven(-3) === false
      && isEven('2') === true
      && isEven('-3') === false
      && isEven('0') === true
      && rejected;
  } catch {
    behaviorCorrect = false;
  }

  const tests = fs.existsSync(testPath) ? fs.readFileSync(testPath, 'utf8') : '';
  const initialCheckpointPaused = !implementationChanged(turns[0]?.diff)
    && awaitsApproval(turns[0]?.finalMessage);
  const mixedApprovalTurnPaused = !implementationChanged(turns[1]?.diff)
    && describesStringIncrement(turns[1]?.finalMessage)
    && awaitsApproval(turns[1]?.finalMessage);
  const revisedCheckpointImplemented = implementationChanged(turns[2]?.diff)
    && turns[2]?.publicTests?.passed
    && behaviorCorrect;
  const coversIncrement = /isEven\(\s*['"](?:2|-3|0)['"]\s*\)/.test(tests)
    && /(?:02|leading zero|前导零)/i.test(tests);

  return {
    passed: turns.length === 3
      && initialCheckpointPaused
      && mixedApprovalTurnPaused
      && revisedCheckpointImplemented
      && coversIncrement,
    checks: {
      pausesAtInitialCheckpoint: initialCheckpointPaused,
      pausesEntireMixedApprovalTurn: mixedApprovalTurnPaused,
      implementsOnlyAfterRevisedCheckpointApproval: revisedCheckpointImplemented,
      leavesFocusedCoverageForScopeIncrement: coversIncrement,
    },
  };
};

module.exports.describesStringIncrement = describesStringIncrement;
