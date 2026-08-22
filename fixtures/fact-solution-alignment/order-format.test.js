const assert = require('node:assert/strict');
const test = require('node:test');

const { formatOrderReference } = require('./src/order-format');
const { describeOrder } = require('./src/order-service');

test('formats order references at the formatting boundary', () => {
  assert.equal(formatOrderReference({ id: 42 }), '#42');
  assert.equal(describeOrder({ id: 42, status: 'ready' }), '#42 ready');
});
