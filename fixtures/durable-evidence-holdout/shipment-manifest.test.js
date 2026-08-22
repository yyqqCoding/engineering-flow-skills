const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeDestination } = require('./src/shipment-manifest');

test('normalizes shipment destinations', () => {
  assert.equal(normalizeDestination('  North   Dock  '), 'North Dock');
});
