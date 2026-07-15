function slugify(value) {
  return value.toLowerCase().replaceAll(' ', '-');
}

module.exports = {
  slugify,
};
