const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeInvoiceReference } = require('./src/invoice-ledger');

test('normalizes invoice references', () => {
  assert.equal(normalizeInvoiceReference('  inv-42  '), 'INV-42');
});
