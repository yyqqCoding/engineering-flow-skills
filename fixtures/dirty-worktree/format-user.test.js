const assert = require('node:assert/strict');
const test = require('node:test');

const { formatDisplayName } = require('./src/format-user');

test('formats a first and last name', () => {
  assert.equal(formatDisplayName({ firstName: 'Ada', lastName: 'Lovelace' }), 'Ada Lovelace');
});
