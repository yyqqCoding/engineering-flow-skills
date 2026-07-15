const assert = require('node:assert/strict');
const test = require('node:test');

const { sendNotification } = require('./src/notifications');

test('formats and sends email and sms notifications', () => {
  const calls = [];
  const transports = {
    email: (address, payload) => calls.push({ address, payload }),
    sms: (address, payload) => calls.push({ address, payload }),
  };

  sendNotification({ channel: 'email', address: 'a@example.com', body: 'hello' }, transports);
  sendNotification({ channel: 'sms', address: '+12025550123', body: 'hello' }, transports);

  assert.deepEqual(calls, [
    { address: 'a@example.com', payload: { subject: 'Notice', text: 'hello' } },
    { address: '+12025550123', payload: 'hello' },
  ]);
});
