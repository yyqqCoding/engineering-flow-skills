function createOrderLabel({ customerReference, orderNumber }) {
  return `${customerReference}:${orderNumber}`;
}

module.exports = {
  createOrderLabel,
};
