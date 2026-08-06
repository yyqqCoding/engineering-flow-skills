function normalizeCustomerName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

module.exports = {
  normalizeCustomerName,
};
