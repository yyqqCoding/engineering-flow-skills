function normalizeInvoiceReference(reference) {
  return reference.trim().toUpperCase();
}

module.exports = {
  normalizeInvoiceReference,
};
