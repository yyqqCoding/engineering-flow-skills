function getActiveUserIds(users) {
  return [...new Set(
    users
      .filter((user) => user.active)
      .map((user) => user.id),
  )];
}

module.exports = { getActiveUserIds };
