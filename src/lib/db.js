const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'nrk_news24.db');

// Singleton database instance
let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath, {
      // verbose: process.env.NODE_ENV === 'development' ? console.log : null
    });
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db) {
  // 1. Admins Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Articles Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      featured_image TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      tags TEXT, -- JSON array string or comma-separated
      author TEXT DEFAULT 'NRK News24 Bureau',
      source_name TEXT,
      source_url TEXT,
      status TEXT CHECK(status IN ('draft', 'pending_review', 'published', 'rejected')) DEFAULT 'draft',
      is_featured INTEGER DEFAULT 0,
      is_breaking INTEGER DEFAULT 0,
      published_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
    CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);
    CREATE INDEX IF NOT EXISTS idx_articles_breaking ON articles(is_breaking);
  `);

  // 4. News Sources Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      feed_url TEXT NOT NULL,
      source_type TEXT DEFAULT 'rss', -- 'rss' or 'api'
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      is_enabled INTEGER DEFAULT 1,
      last_fetched_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Article Views Tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
      ip_hash TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_views_article ON article_views(article_id);
    CREATE INDEX IF NOT EXISTS idx_views_time ON article_views(viewed_at);
  `);

  // 6. Article Shares Tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
      platform TEXT NOT NULL, -- 'whatsapp', 'facebook', 'x', 'telegram', 'email', 'copy', 'native'
      shared_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_shares_article ON article_shares(article_id);
  `);

  // 7. Site Settings Table (Key-Value)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default settings if empty
  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('site_name', 'NRK News24');
  insertSetting.run('site_tagline', 'Truth, Speed, Integrity — 24/7 Digital Journalism');
  insertSetting.run('site_description', 'NRK News24 is an independent digital news organization delivering real-time coverage across Andhra Pradesh, Telangana, India, and the World.');
  insertSetting.run('default_author', 'NRK Bureau');
  insertSetting.run('breaking_news_enabled', 'true');
  insertSetting.run('custom_breaking_ticker', '');
  insertSetting.run('ads_top_banner_enabled', 'true');
  insertSetting.run('ads_sidebar_enabled', 'true');
  insertSetting.run('ads_article_enabled', 'true');
  insertSetting.run('ads_footer_enabled', 'true');
  insertSetting.run('cron_enabled', 'true');
  insertSetting.run('cron_frequency', '30'); // minutes
  insertSetting.run('ai_model', 'gemini-1.5-flash');
  insertSetting.run('social_twitter', 'https://x.com/nrknews24');
  insertSetting.run('social_facebook', 'https://facebook.com/nrknews24');
  insertSetting.run('social_telegram', 'https://t.me/nrknews24');
  insertSetting.run('social_whatsapp', 'https://whatsapp.com/channel/nrknews24');
  insertSetting.run('social_youtube', 'https://youtube.com/@nrknews24');
}

module.exports = {
  getDb
};
