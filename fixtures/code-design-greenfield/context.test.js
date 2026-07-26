const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('fixture context is available', () => {
  const context = fs.readFileSync('context.md', 'utf8');
  assert.match(context, /PostgreSQL/);
  assert.match(context, /no message broker/);
});
