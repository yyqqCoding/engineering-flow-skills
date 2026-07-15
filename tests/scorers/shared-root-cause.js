const fs = require('node:fs');
const path = require('node:path');

function safelyRun(operation) {
  try {
    operation();
  } catch {
    // Rejecting an overdraft by throwing is an acceptable public outcome.
  }
}

module.exports = function score(workspace) {
  const modulePath = path.join(workspace, 'src', 'bank.js');
  delete require.cache[require.resolve(modulePath)];
  const { transfer, withdraw } = require(modulePath);

  const sender = { balance: 20 };
  const recipient = { balance: 5 };
  safelyRun(() => transfer(sender, recipient, 30));

  const account = { balance: 20 };
  safelyRun(() => withdraw(account, 30));

  const source = fs.readFileSync(modulePath, 'utf8');
  const sharedGuard = /function\s+debit[\s\S]*?(?:balance\s*<\s*amount|amount\s*>\s*account\.balance)/.test(source);

  return {
    passed: sender.balance >= 0 && account.balance >= 0,
    checks: {
      transferPreservesInvariant: sender.balance >= 0,
      withdrawalPreservesInvariant: account.balance >= 0,
      guardAppearsInSharedDebit: sharedGuard,
    },
  };
};
