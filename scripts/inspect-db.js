const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'nrk_news24.db');
console.log('Opening database at:', dbPath);

const db = new Database(dbPath, { readonly: true });

const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log('\n--- TABLES AND SCHEMAS ---');
for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get().c;
  console.log(`\nTable: ${t.name} (Rows: ${count})`);
  console.log(`Schema:\n${t.sql}`);
}

const indexes = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").all();
console.log('\n--- INDEXES ---');
for (const idx of indexes) {
  console.log(`${idx.name} on ${idx.tbl_name}: ${idx.sql}`);
}

console.log('\n--- ARTICLE STATS ---');
const statuses = db.prepare("SELECT status, count(*) as count FROM articles GROUP BY status").all();
console.log('Statuses:', statuses);

const featured = db.prepare("SELECT is_featured, count(*) as count FROM articles GROUP BY is_featured").all();
console.log('Featured:', featured);

const breaking = db.prepare("SELECT is_breaking, count(*) as count FROM articles GROUP BY is_breaking").all();
console.log('Breaking:', breaking);

const uploads = db.prepare("SELECT id, title, featured_image FROM articles WHERE featured_image LIKE '%uploads%'").all();
console.log('Articles with local uploads:', uploads);

const admins = db.prepare("SELECT id, name, email, role, password_hash, created_at FROM admins").all();
console.log('Admins count:', admins.length);
for (const a of admins) {
  console.log(`Admin: id=${a.id}, name=${a.name}, email=${a.email}, role=${a.role}, passHashPrefix=${a.password_hash.substring(0, 10)}...`);
}

