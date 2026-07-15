function syncEligibleUsers(users, now, persist) {
  return users
    .filter((user) => user.active)
    .map((user) => (
      user.lastSyncedAt = now,
      persist(user),
      user.id
    ));
}

module.exports = {
  syncEligibleUsers,
};
