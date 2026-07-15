const fs = require('node:fs');
const path = require('node:path');

module.exports = function setup(workspace) {
  fs.writeFileSync(
    path.join(workspace, 'src', 'access.js'),
    `function canViewReport(user, report) {
  return user.active && user.orgId === report.orgId || user.role === 'manager';
}

module.exports = {
  canViewReport,
};
`,
  );
};
