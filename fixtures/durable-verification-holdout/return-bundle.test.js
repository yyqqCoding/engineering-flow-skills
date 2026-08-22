const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeRecipient } = require('./src/return-bundle');

test('normalizes return recipients', () => {
  assert.equal(normalizeRecipient('  Warehouse-42  '), 'warehouse-42');
});
