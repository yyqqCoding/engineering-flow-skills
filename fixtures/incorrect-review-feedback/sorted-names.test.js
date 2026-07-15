const assert = require('node:assert/strict');
const test = require('node:test');

const { sortedNames } = require('./src/sorted-names');

test('returns names in sorted order', () => {
  assert.deepEqual(sortedNames([{ name: 'Zoe' }, { name: 'Ada' }]), ['Ada', 'Zoe']);
});
