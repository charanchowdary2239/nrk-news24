function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function generateUniqueSlug(db, title, existingId = null) {
  // Support both (db, title, existingId) and (title, existingId) signatures
  let actualTitle = title;
  let actualExistingId = existingId;
  let actualDb = db;

  if (typeof db === 'string') {
    actualTitle = db;
    actualExistingId = title;
    actualDb = null;
  }

  let baseSlug = slugify(actualTitle);
  if (!baseSlug) {
    baseSlug = `news-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  if (actualDb && typeof actualDb.prepare === 'function') {
    while (true) {
      let query = `SELECT id FROM articles WHERE slug = ?`;
      let params = [slug];

      if (actualExistingId) {
        query += ` AND id != ?`;
        params.push(actualExistingId);
      }

      const match = actualDb.prepare(query).get(...params);
      if (!match) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}

module.exports = {
  slugify,
  generateUniqueSlug,
};
