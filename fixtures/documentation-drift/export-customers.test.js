const assert = require('node:assert/strict');
const test = require('node:test');

const { exportCustomers } = require('./src/export-customers');

test('exports customer identity fields', () => {
  assert.deepEqual(exportCustomers([
    { id: 'customer-1', email: 'a@example.com', disabled: false },
  ]), [{ id: 'customer-1', email: 'a@example.com' }]);
});
