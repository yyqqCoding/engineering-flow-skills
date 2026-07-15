const assert = require('node:assert/strict');
const test = require('node:test');

const { canViewReport } = require('./src/access');

test('allows an active manager in the same organization', () => {
  assert.equal(canViewReport(
    { active: true, orgId: 'org-1', role: 'manager' },
    { orgId: 'org-1' },
  ), true);
});
