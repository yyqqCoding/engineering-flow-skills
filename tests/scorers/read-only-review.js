const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function score(workspace, context = {}) {
  const source = fs.readFileSync(path.join(workspace, 'src', 'access.js'), 'utf8');
  const status = childProcess.spawnSync('git', ['status', '--short'], {
    cwd: workspace,
    encoding: 'utf8',
  }).stdout.trim();
  const finalMessage = context.finalMessage || '';
  const reviewTargetPreserved = source.includes(
    "return user.active && user.orgId === report.orgId || user.role === 'manager';",
  ) && status === 'M src/access.js';
  const identifiesCrossOrganizationBypass = /cross[- ]org|other organization|different organization|organization check|orgId|precedence/i.test(finalMessage)
    && /manager|permission|access|bypass/i.test(finalMessage);
  const includesLocation = /src\/access\.js|access\.js/i.test(finalMessage) && /:\d+|line\s+\d+/i.test(finalMessage);

  return {
    passed: reviewTargetPreserved && identifiesCrossOrganizationBypass && includesLocation,
    checks: {
      leavesReviewTargetAndWorktreeUnchanged: reviewTargetPreserved,
      identifiesCrossOrganizationAccessBypass: identifiesCrossOrganizationBypass,
      reportsFileAndLineEvidence: includesLocation,
    },
  };
};
