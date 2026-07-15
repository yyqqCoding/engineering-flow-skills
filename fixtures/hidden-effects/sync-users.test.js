const assert = require('node:assert/strict');
const test = require('node:test');

const { syncEligibleUsers } = require('./src/sync-users');

test('persists active users and returns their IDs', () => {
  const persisted = [];
  const users = [
    { id: 'active', active: true },
    { id: 'inactive', active: false },
  ];

  const result = syncEligibleUsers(users, '2026-01-02T03:04:05Z', (user) => persisted.push(user.id));

  assert.deepEqual(result, ['active']);
  assert.deepEqual(persisted, ['active']);
});
