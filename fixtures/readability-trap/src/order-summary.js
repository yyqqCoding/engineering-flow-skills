function summarizeOrders(orders) {
  return orders.reduce(
    (summary, order) => (
      order.cancelled
        ? summary
        : (
          order.total > 1000
            ? summary.high.push(order.id)
            : order.total > 0
              ? summary.normal.push(order.id)
              : summary.invalid.push(order.id),
          summary
        )
    ),
    { high: [], normal: [], invalid: [] },
  );
}

module.exports = {
  summarizeOrders,
};
