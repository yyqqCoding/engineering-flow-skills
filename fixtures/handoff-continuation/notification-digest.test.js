const assert = require('node:assert/strict');
const test = require('node:test');

const { buildNotificationDigest } = require('./src/notification-digest');

test('builds a digest in event order', () => {
  const events = [
    { title: 'Queue delayed', severity: 'medium' },
    { title: 'Queue recovered', severity: 'low' },
  ];

  assert.deepEqual(buildNotificationDigest(events), events);
});
