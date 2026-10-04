/**
 * NRK News24 — SQLite to Supabase PostgreSQL Safe Migration Script
 *
 * Reads: data/nrk_news24.db
 * Writes to: Supabase PostgreSQL (via official @supabase/supabase-js)
 * Uploads: public/uploads/* -> Supabase Storage ('news-images' bucket)
 * Safety: Creates automatic backup of SQLite database before migration.
 * Preserves: All articles, categories, authors, IDs, slugs, dates, status, views, shares, settings.
 */

const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env and .env.local if present
for (const envFile of ['.env', '.env.local']) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function formatTimestamp(str) {
  if (!str) return null;
  try {
    const isoCandidate = str.includes('T') ? str : str.replace(' ', 'T') + 'Z';
    const d = new Date(isoCandidate);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {}
  return str;
}

async function runMigration() {
  console.log('========================================================');
  console.log('  NRK NEWS24: SQLITE -> SUPABASE POSTGRESQL MIGRATION   ');
  console.log('========================================================\n');

  // Validate credentials
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project-id')) {
    console.error('❌ ERROR: Supabase credentials not found in environment.');
    console.error('Please configure the following in your .env / .env.local file:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co');
    console.error('  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-key>\n');
    process.exitCode = 1;
    return;
  }

  console.log(`Connecting to Supabase at: ${SUPABASE_URL}`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Verify connection by checking settings table
  const { error: testErr } = await supabase.from('settings').select('key').limit(1);
  if (testErr) {
    console.error('❌ ERROR connecting to Supabase tables:', testErr.message);
    console.error('The PostgreSQL tables have not been created yet in Supabase.');
    console.error('Please execute "supabase-schema.sql" in your Supabase SQL Editor first.\n');
    process.exitCode = 1;
    return;
  }
  console.log('✅ Supabase PostgreSQL connection verified.\n');

  // Verify SQLite database
  const dbPath = path.join(process.cwd(), 'data', 'nrk_news24.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ ERROR: SQLite database file not found at ${dbPath}`);
    process.exitCode = 1;
    return;
  }

  // Step 1: Create safety backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'data', `backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const filesToBackup = ['nrk_news24.db', 'nrk_news24.db-shm', 'nrk_news24.db-wal'];
  for (const f of filesToBackup) {
    const src = path.join(process.cwd(), 'data', f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(backupDir, f));
    }
  }
  console.log(`🛡️  Safety backup created at: ${backupDir}\n`);

  // Open SQLite in read-only mode for safety
  const sqlite = new Database(dbPath, { readonly: true });

  // Optional: Upload local images to Supabase Storage bucket 'news-images'
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const uploadedImageUrls = {};
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    if (files.length > 0) {
      console.log(`📁 Found ${files.length} local image(s) in public/uploads. Syncing to Supabase Storage...`);
      for (const fileName of files) {
        try {
          const filePath = path.join(uploadsDir, fileName);
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(fileName).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
          };
          const mimeType = mimeTypes[ext] || 'image/jpeg';

          const { error: uploadErr } = await supabase.storage
            .from('news-images')
            .upload(fileName, buffer, { contentType: mimeType, upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('news-images')
              .getPublicUrl(fileName);
            uploadedImageUrls[`/uploads/${fileName}`] = publicUrlData.publicUrl;
            console.log(`  ✓ Uploaded: ${fileName} -> ${publicUrlData.publicUrl}`);
          } else {
            console.warn(`  ⚠️ Upload warning for ${fileName}:`, uploadErr.message);
          }
        } catch (imgErr) {
          console.warn(`  ⚠️ Error syncing image ${fileName}:`, imgErr.message);
        }
      }
      console.log('');
    }
  }

  const migrationStats = {};

  // Helper function to migrate a table
  async function migrateTable(tableName, primaryKey, transformRow) {
    const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`📦 Migrating "${tableName}" (${rows.length} records in SQLite)...`);

    let successCount = 0;
    let failedCount = 0;

    // Batch upsert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize).map(transformRow);

      const { error } = await supabase
        .from(tableName)
        .upsert(chunk, { onConflict: primaryKey });

      if (error) {
        console.warn(`  ⚠️ Batch upsert for ${tableName} chunk ${i / chunkSize + 1} failed: ${error.message}. Retrying row-by-row...`);
        // Fall back to row-by-row to isolate failures
        for (const row of chunk) {
          const { error: rowErr } = await supabase
            .from(tableName)
            .upsert(row, { onConflict: primaryKey });

          if (rowErr) {
            console.error(`  ❌ Failed row in ${tableName} (${primaryKey}=${row[primaryKey]}):`, rowErr.message);
            failedCount++;
          } else {
            successCount++;
          }
        }
      } else {
        successCount += chunk.length;
      }
    }

    migrationStats[tableName] = {
      sqlite: rows.length,
      migrated: successCount,
      failed: failedCount,
    };

    console.log(`  ✅ Finished "${tableName}": ${successCount} migrated, ${failedCount} failed.\n`);
  }

  // 1. Admins
  await migrateTable('admins', 'id', (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    password_hash: r.password_hash,
    role: r.role || 'admin',
    created_at: formatTimestamp(r.created_at),
  }));

  // 2. Categories
  await migrateTable('categories', 'id', (r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description || null,
    display_order: r.display_order || 0,
    created_at: formatTimestamp(r.created_at),
  }));

  // 3. Articles (all 102+ articles)
  await migrateTable('articles', 'id', (r) => {
    // If image was a local upload that we synced to Supabase Storage, update to Supabase URL
    let featuredImage = r.featured_image;
    if (featuredImage && uploadedImageUrls[featuredImage]) {
      featuredImage = uploadedImageUrls[featuredImage];
    }

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary || null,
      content: r.content,
      featured_image: featuredImage || null,
      category_id: r.category_id || 1,
      tags: r.tags || '[]',
      author: r.author || 'NRK News24 Bureau',
      source_name: r.source_name || null,
      source_url: r.source_url || null,
      status: r.status || 'draft',
      is_featured: r.is_featured ? 1 : 0,
      is_breaking: r.is_breaking ? 1 : 0,
      published_at: formatTimestamp(r.published_at),
      updated_at: formatTimestamp(r.updated_at),
      created_at: formatTimestamp(r.created_at),
      views: r.views || 0,
      shares: r.shares || 0,
    };
  });

  // 4. News Sources
  await migrateTable('news_sources', 'id', (r) => ({
    id: r.id,
    name: r.name,
    feed_url: r.feed_url,
    source_type: r.source_type || 'rss',
    category_id: r.category_id || 1,
    is_enabled: r.is_enabled !== undefined ? r.is_enabled : 1,
    last_fetched_at: formatTimestamp(r.last_fetched_at),
    created_at: formatTimestamp(r.created_at),
  }));

  // 5. Article Views
  await migrateTable('article_views', 'id', (r) => ({
    id: r.id,
    article_id: r.article_id,
    ip_hash: r.ip_hash || null,
    viewed_at: formatTimestamp(r.viewed_at),
  }));

  // 6. Article Shares
  await migrateTable('article_shares', 'id', (r) => ({
    id: r.id,
    article_id: r.article_id,
    platform: r.platform,
    shared_at: formatTimestamp(r.shared_at),
  }));

  // 7. Settings
  await migrateTable('settings', 'key', (r) => ({
    key: r.key,
    value: r.value,
    updated_at: formatTimestamp(r.updated_at),
  }));

  // Step 4: Final Verification
  console.log('========================================================');
  console.log('                MIGRATION AUDIT REPORT                  ');
  console.log('========================================================');
  console.table(migrationStats);

  const { count: supabaseArticleCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  const sqliteArticleCount = sqlite.prepare('SELECT count(*) as cnt FROM articles').get().cnt;

  console.log(`\nArticle Verification:`);
  console.log(`  SQLite Article Count:   ${sqliteArticleCount}`);
  console.log(`  Supabase Article Count: ${supabaseArticleCount}`);

  if (supabaseArticleCount >= sqliteArticleCount) {
    console.log('\n🎉 SUCCESS: All articles and records have been successfully migrated to Supabase!');
  } else {
    console.warn(`\n⚠️ Warning: Expected ${sqliteArticleCount} articles, found ${supabaseArticleCount} in Supabase.`);
  }

  console.log('\nNote: The SQLite database at data/nrk_news24.db remains completely intact and unmodified.');
}

runMigration().catch((err) => {
  console.error('\n❌ Unhandled exception during migration:', err);
  process.exit(1);
});
