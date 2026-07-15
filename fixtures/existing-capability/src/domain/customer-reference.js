function canonicalizeCustomerReference(value) {
  if (typeof value !== 'string') {
    throw new TypeError('customer reference must be a string');
  }

  const canonical = value.trim().toUpperCase().replace(/[\s-]+/g, '');
  if (!/^CUST\d{4}$/.test(canonical)) {
    throw new TypeError('invalid customer reference');
  }

  return canonical;
}

module.exports = {
  canonicalizeCustomerReference,
};
