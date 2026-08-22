const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizePrincipal } = require('./src/access-batch');

test('normalizes access principals', () => {
  assert.equal(normalizePrincipal('  Team-42  '), 'team-42');
});
