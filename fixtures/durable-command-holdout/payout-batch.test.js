const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeAccountCode } = require('./src/payout-batch');

test('normalizes payout account codes', () => {
  assert.equal(normalizeAccountCode('  acct-42  '), 'ACCT-42');
});
