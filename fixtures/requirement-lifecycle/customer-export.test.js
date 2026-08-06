const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeCustomerName } = require('./src/customer-export');

test('normalizes customer names', () => {
  assert.equal(normalizeCustomerName('  Ada  Lovelace '), 'Ada Lovelace');
});
