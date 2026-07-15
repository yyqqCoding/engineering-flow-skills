function debit(account, amount) {
  account.balance -= amount;
}

function withdraw(account, amount) {
  debit(account, amount);
}

function transfer(sender, recipient, amount) {
  debit(sender, amount);
  recipient.balance += amount;
}

module.exports = {
  transfer,
  withdraw,
};
