const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('fixture contains the intended contradictions', () => {
  const design = fs.readFileSync('docs/export-design.md', 'utf8');
  assert.match(design, /synchronously/);
  assert.match(design, /asynchronous export job/);
  assert.match(design, /Any authenticated user/);
  assert.match(design, /Only support administrators/);
});
