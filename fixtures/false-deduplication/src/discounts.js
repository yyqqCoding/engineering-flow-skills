function calculateShippingDiscount(total) {
  if (total < 100) return 0;
  return Math.min(total * 0.05, 25);
}

function calculateLoyaltyDiscount(total) {
  if (total < 100) return 0;
  return Math.min(total * 0.05, 25);
}

module.exports = {
  calculateLoyaltyDiscount,
  calculateShippingDiscount,
};
