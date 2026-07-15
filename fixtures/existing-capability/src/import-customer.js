const { canonicalizeCustomerReference } = require('./domain/customer-reference');

function importCustomer(record) {
  return {
    ...record,
    reference: canonicalizeCustomerReference(record.reference),
  };
}

module.exports = {
  importCustomer,
};
