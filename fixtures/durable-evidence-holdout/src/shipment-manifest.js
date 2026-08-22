function normalizeDestination(destination) {
  return destination.trim().replace(/\s+/g, ' ');
}

module.exports = {
  normalizeDestination,
};
