const assert = require('node:assert/strict');
const test = require('node:test');

const { summarizeOrders } = require('./src/order-summary');

test('groups active positive and negative orders', () => {
  const result = summarizeOrders([
    { id: 'high', total: 1500, cancelled: false },
    { id: 'normal', total: 100, cancelled: false },
    { id: 'invalid', total: -1, cancelled: false },
    { id: 'cancelled', total: 5000, cancelled: true },
  ]);

  assert.deepEqual(result, {
    high: ['high'],
    normal: ['normal'],
    invalid: ['invalid'],
  });
});
