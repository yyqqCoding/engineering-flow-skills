const assert = require('node:assert/strict');
const config = require('../config/dashboard.json');

assert.ok(Number.isInteger(config.defaultPageSize) && config.defaultPageSize > 0);
assert.ok(Array.isArray(config.columns) && config.columns.length > 0);
assert.equal(new Set(config.columns).size, config.columns.length);
assert.ok(['light', 'dark', 'system'].includes(config.theme));
assert.equal(typeof config.showFilters, 'boolean');
