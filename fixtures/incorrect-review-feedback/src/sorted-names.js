function sortedNames(users) {
  return users
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((user) => user.name);
}

module.exports = {
  sortedNames,
};
