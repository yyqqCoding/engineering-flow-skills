const assert = require('node:assert/strict');
const test = require('node:test');

const { CustomerService } = require('./src/customer-service');

test('finds an existing customer', () => {
  const service = new CustomerService([{ id: 'customer-1' }], []);

  assert.deepEqual(service.findCustomer('customer-1'), { id: 'customer-1' });
});
