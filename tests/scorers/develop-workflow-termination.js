const fs = require('node:fs');
const path = require('node:path');

const { awaitsApproval } = require('./develop-lifecycle');

function implementationChanged(diff) {
  return /^diff --git a\/(?:src\/|[^/]*\.test\.js|package\.json)/m.test(diff || '');
}

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const modulePath = path.join(workspace, 'src', 'math.js');
  const testPath = path.join(workspace, 'math.test.js');
  let unrelatedTaskImplemented = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const math = require(modulePath);
    let rejectsInvalidOperands = false;
    try {
      math.subtract(Number.POSITIVE_INFINITY, 1);
    } catch (error) {
      rejectsInvalidOperands = error instanceof TypeError
        && error.message === 'operands must be finite numbers';
    }
    unrelatedTaskImplemented = math.add(2, 3) === 5
      && math.subtract(7, 4) === 3
      && rejectsInvalidOperands
      && !Object.hasOwn(math, 'isEven');
  } catch {
    unrelatedTaskImplemented = false;
  }

  const tests = fs.existsSync(testPath) ? fs.readFileSync(testPath, 'utf8') : '';
  const initialDevelopPaused = !implementationChanged(turns[0]?.diff)
    && awaitsApproval(turns[0]?.finalMessage);
  const unrelatedTaskProceedsFromCore = implementationChanged(turns[1]?.diff)
    && turns[1]?.publicTests?.passed
    && unrelatedTaskImplemented
    && /subtract/.test(tests)
    && !/isEven/.test(tests);

  return {
    passed: turns.length === 2
      && initialDevelopPaused
      && unrelatedTaskProceedsFromCore,
    checks: {
      initialDevelopTaskPausesAtCheckpoint: initialDevelopPaused,
      cancellationEndsDevelopInheritance: unrelatedTaskProceedsFromCore,
      staleApprovalDoesNotLeakIntoUnrelatedTask: unrelatedTaskImplemented,
    },
  };
};
