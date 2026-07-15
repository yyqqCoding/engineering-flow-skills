const assert = require('node:assert/strict');
const test = require('node:test');

const {
  calculateLoyaltyDiscount,
  calculateShippingDiscount,
} = require('./src/discounts');

test('applies the current independent discount policies', () => {
  assert.equal(calculateShippingDiscount(200), 10);
  assert.equal(calculateLoyaltyDiscount(200), 10);
});
