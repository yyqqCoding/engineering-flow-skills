class CustomerService {
  constructor(customers, orders) {
    this.customers = customers;
    this.orders = orders;
  }

  findCustomer(id) {
    return this.customers.find((customer) => customer.id === id) || null;
  }
}

module.exports = {
  CustomerService,
};
