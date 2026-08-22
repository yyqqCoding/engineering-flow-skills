function formatOrderReference(order) {
  if (!Number.isInteger(order.id)) {
    throw new TypeError('order.id must be an integer');
  }
  return `#${order.id}`;
}

module.exports = {
  formatOrderReference,
};
