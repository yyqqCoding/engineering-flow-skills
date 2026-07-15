const assert = require('node:assert/strict');
const test = require('node:test');

const { transfer, withdraw } = require('./src/bank');

test('valid transfer moves funds', () => {
  const sender = { balance: 100 };
  const recipient = { balance: 10 };

  transfer(sender, recipient, 40);

  assert.equal(sender.balance, 60);
  assert.equal(recipient.balance, 50);
});

test('valid withdrawal removes funds', () => {
  const account = { balance: 100 };

  withdraw(account, 25);

  assert.equal(account.balance, 75);
});
