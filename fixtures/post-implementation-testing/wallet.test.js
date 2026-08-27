const assert = require('node:assert/strict');
const test = require('node:test');

const { formatAccountId } = require('./src/wallet');

test('formats an account id', () => {
  assert.equal(formatAccountId(7), 'acct-7');
});
