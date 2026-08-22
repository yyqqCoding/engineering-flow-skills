function normalizeAccountCode(account) {
  return account.trim().toUpperCase();
}

module.exports = {
  normalizeAccountCode,
};
