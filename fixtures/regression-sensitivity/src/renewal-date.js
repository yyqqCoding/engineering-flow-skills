function calculateRenewalDate(isoDate, months) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  calculateRenewalDate,
};
