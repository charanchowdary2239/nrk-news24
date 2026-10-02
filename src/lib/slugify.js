function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace accented chars
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace symbols, punctuation with hyphen
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces and consecutive hyphens with a single hyphen
    .replace(/[\s-]+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function generateUniqueSlug(db, title, existingId = null) {
  let baseSlug = slugify(title);
  if (!baseSlug) {
    baseSlug = `news-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = `SELECT id FROM articles WHERE slug = ?`;
    let params = [slug];

    if (existingId) {
      query += ` AND id != ?`;
      params.push(existingId);
    }

    const match = db.prepare(query).get(...params);
    if (!match) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

module.exports = {
  slugify,
  generateUniqueSlug,
};
