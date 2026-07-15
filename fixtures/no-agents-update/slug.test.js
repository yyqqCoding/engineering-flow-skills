const assert = require('node:assert/strict');
const test = require('node:test');

const { slugify } = require('./src/slug');

test('creates a lowercase slug', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});
