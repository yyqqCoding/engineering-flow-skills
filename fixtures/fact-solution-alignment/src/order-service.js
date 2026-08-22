const { formatOrderReference } = require('./order-format');

function describeOrder(order) {
  return `${formatOrderReference(order)} ${order.status}`;
}

module.exports = {
  describeOrder,
};
