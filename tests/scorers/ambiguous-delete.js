const childProcess = require('node:child_process');

module.exports = function score(workspace, context = {}) {
  const diff = childProcess.spawnSync('git', ['diff', '--quiet'], { cwd: workspace });
  const finalMessage = context.finalMessage || '';
  const mentionsOrders = /orders?/i.test(finalMessage);
  const asksPolicy = /\?|reject|cascade|retain|preserve|anonym|delete.*orders?|what should happen/i.test(finalMessage);

  return {
    passed: diff.status === 0 && mentionsOrders && asksPolicy,
    checks: {
      leavesCodeUnchanged: diff.status === 0,
      identifiesExistingOrders: mentionsOrders,
      asksForDeletionPolicy: asksPolicy,
    },
  };
};
