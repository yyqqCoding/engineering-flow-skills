const assert = require('node:assert/strict');
const test = require('node:test');

const { calculateRenewalDate } = require('./src/renewal-date');

test('adds months when the target month contains the same day', () => {
  assert.equal(calculateRenewalDate('2024-01-15', 1), '2024-02-15');
  assert.equal(calculateRenewalDate('2024-02-15', 2), '2024-04-15');
});
