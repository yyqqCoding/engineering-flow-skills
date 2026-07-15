const assert = require('node:assert/strict');
const test = require('node:test');

const { importCustomer } = require('./src/import-customer');
const { createOrderLabel } = require('./src/order-label');

test('imports customers with canonical references', () => {
  assert.deepEqual(importCustomer({ reference: ' cust- 0042 ', name: 'Ada' }), {
    reference: 'CUST0042',
    name: 'Ada',
  });
});

test('creates labels for already canonical references', () => {
  assert.equal(createOrderLabel({ customerReference: 'CUST0042', orderNumber: 17 }), 'CUST0042:17');
});
