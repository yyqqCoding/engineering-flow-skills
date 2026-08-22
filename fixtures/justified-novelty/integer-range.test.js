const assert = require('node:assert/strict');
const test = require('node:test');

const { isAscending } = require('./src/integer-range');

test('reports whether integer bounds ascend', () => {
  assert.equal(isAscending(1, 3), true);
  assert.equal(isAscending(3, 1), false);
});
