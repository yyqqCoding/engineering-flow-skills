function validateAddress(notification) {
  if (notification.channel === 'email' && !notification.address.includes('@')) {
    throw new TypeError('Invalid email address');
  }
  if (notification.channel === 'sms' && !notification.address.startsWith('+')) {
    throw new TypeError('Invalid phone number');
  }
  if (notification.channel === 'push' && notification.address.length === 0) {
    throw new TypeError('Invalid device token');
  }
}

function formatPayload(notification) {
  if (notification.channel === 'email') {
    return { subject: 'Notice', text: notification.body };
  }
  if (notification.channel === 'sms') {
    return notification.body;
  }
  if (notification.channel === 'push') {
    return { body: notification.body };
  }
  throw new TypeError(`Unsupported channel: ${notification.channel}`);
}

function selectTransport(channel, transports) {
  if (channel === 'email') return transports.email;
  if (channel === 'sms') return transports.sms;
  if (channel === 'push') return transports.push;
  throw new TypeError(`Unsupported channel: ${channel}`);
}

function sendNotification(notification, transports) {
  validateAddress(notification);
  const payload = formatPayload(notification);
  const transport = selectTransport(notification.channel, transports);
  return transport(notification.address, payload);
}

module.exports = {
  sendNotification,
};
