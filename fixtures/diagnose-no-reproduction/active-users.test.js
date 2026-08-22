const assert = require('node:assert/strict');
const test = require('node:test');

const { getActiveUserIds } = require('./src/active-users');

test('returns each active user id once', () => {
  assert.deepEqual(getActiveUserIds([
    { id: 'user-1', active: true },
    { id: 'user-1', active: true },
    { id: 'user-2', active: false },
  ]), ['user-1']);
});
