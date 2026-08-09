function buildNotificationDigest(events) {
  return events.map((event) => ({
    title: event.title,
    severity: event.severity,
  }));
}

module.exports = {
  buildNotificationDigest,
};
