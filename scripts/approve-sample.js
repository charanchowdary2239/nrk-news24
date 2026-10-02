const { getDb } = require('../src/lib/db');

const db = getDb();

const targets = [
  '58e9b8b6-2ab0-478c-9368-6ba9b486566d', // India
  '4a3d4962-4eca-420a-b93f-7b226a9043fc', // India
  '6fa54c41-651f-40ba-97af-769fe295f706', // AP
  '63a8361b-dd5a-4998-99af-ab47fe2e5d8a', // Telangana
  '79e43df3-a1d1-4cb7-a55e-0498dbf5ae33', // World
  '0ad2488d-71b5-4b0d-b108-727b1f55a1fa', // Sports
  'bcf914ee-e04f-4096-a9f8-dbe32454a48d', // Business
  'e022f518-e215-4ba8-9e5c-7ec10f0ea58a', // Tech
  'd4cf0f99-f4d6-4448-a006-258679f14e76', // Education
];

let updatedCount = 0;
for (const id of targets) {
  const art = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (art) {
    db.prepare(`
      UPDATE articles SET
        status = 'published',
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
    console.log('Approved & published:', art.title);
    updatedCount++;
  }
}

console.log(`Successfully published ${updatedCount} articles.`);
