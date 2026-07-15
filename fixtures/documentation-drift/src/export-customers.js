function exportCustomers(customers) {
  return customers.map((customer) => ({
    id: customer.id,
    email: customer.email,
  }));
}

module.exports = {
  exportCustomers,
};
