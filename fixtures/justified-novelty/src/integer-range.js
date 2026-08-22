function isAscending(start, end) {
  return Number.isInteger(start) && Number.isInteger(end) && start <= end;
}

module.exports = {
  isAscending,
};
