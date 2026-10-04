import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured, deleteImageFromSupabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Lazy-loaded SQLite singleton (fallback for local dev and when Supabase tables are not yet initialized)
let sqliteDb = null;
export function getDb() {
  if (!sqliteDb) {
    try {
      const Database = require('better-sqlite3');
      const path = require('path');
      const fs = require('fs');
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dbPath = path.join(dataDir, 'nrk_news24.db');
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.pragma('foreign_keys = ON');
    } catch (err) {
      console.warn('Local SQLite not initialized:', err.message);
      return null;
    }
  }
  return sqliteDb;
}

/**
 * Checks if a Supabase error is caused by a missing table in the schema cache
 */
export function isTableMissing(error) {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    (typeof error.message === 'string' && error.message.includes('Could not find the table'))
  );
}

/**
 * Helper to obtain the active Supabase client (admin or publishable)
 */
function getActiveSupabase() {
  return getSupabaseAdmin() || getSupabaseClient();
}

/**
 * Standardizes article object fields across Supabase joins and SQLite rows.
 */
export function formatArticle(art) {
  if (!art) return null;

  let parsedTags = [];
  try {
    if (Array.isArray(art.tags)) {
      parsedTags = art.tags;
    } else if (typeof art.tags === 'string') {
      parsedTags = JSON.parse(art.tags);
    }
  } catch (e) {
    parsedTags = typeof art.tags === 'string' ? art.tags.split(',').map((t) => t.trim()) : [];
  }

  const categoryName = art.categories?.name || art.category_name || null;
  const categorySlug = art.categories?.slug || art.category_slug || null;

  return {
    ...art,
    category_name: categoryName,
    category_slug: categorySlug,
    tags: Array.isArray(parsedTags) ? parsedTags : [],
    is_featured: art.is_featured ? 1 : 0,
    is_breaking: art.is_breaking ? 1 : 0,
    views: art.views || 0,
    shares: art.shares || 0,
  };
}

/**
 * Simple slugify helper
 */
export function slugifyText(text) {
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

/**
 * Generates a collision-free slug using Supabase or SQLite
 */
export async function generateUniqueSlug(title, existingId = null) {
  let baseSlug = slugifyText(title);
  if (!baseSlug) {
    baseSlug = `news-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    try {
      while (true) {
        let query = supabase.from('articles').select('id').eq('slug', slug);
        if (existingId) {
          query = query.neq('id', existingId);
        }
        const { data, error } = await query.maybeSingle();
        if (error && isTableMissing(error)) {
          break; // Fallback to local
        }
        if (!data) return slug;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    } catch (e) {
      // Fall through to SQLite
    }
  }

  const db = getDb();
  if (!db) return slug;

  while (true) {
    let query = `SELECT id FROM articles WHERE slug = ?`;
    let params = [slug];
    if (existingId) {
      query += ` AND id != ?`;
      params.push(existingId);
    }
    const match = db.prepare(query).get(...params);
    if (!match) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ==============================================================================
// ARTICLES
// ==============================================================================

export async function getArticles({
  category = null,
  status = 'published',
  featured = null,
  breaking = null,
  sort = 'latest',
  q = null,
  limit = 12,
  offset = 0,
} = {}) {
  const safeLimit = Math.min(Math.max(parseInt(limit || '12', 10), 1), 100);
  const safeOffset = Math.max(parseInt(offset || '0', 10), 0);

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    let query = supabase
      .from('articles')
      .select(
        `
        id, title, slug, summary, content, featured_image,
        category_id, tags, author, source_name, source_url,
        status, is_featured, is_breaking,
        published_at, updated_at, created_at,
        views, shares,
        categories ( id, name, slug )
      `,
        { count: 'exact' }
      );

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      if (/^\d+$/.test(category)) {
        query = query.eq('category_id', parseInt(category, 10));
      } else {
        const cat = await getCategoryBySlug(category);
        if (cat) {
          query = query.eq('category_id', cat.id);
        } else {
          return { articles: [], total: 0, limit: safeLimit, offset: safeOffset };
        }
      }
    }

    if (featured === '1' || featured === 'true' || featured === 1 || featured === true) {
      query = query.eq('is_featured', 1);
    }

    if (breaking === '1' || breaking === 'true' || breaking === 1 || breaking === true) {
      query = query.eq('is_breaking', 1);
    }

    if (q && q.trim()) {
      const term = q.trim();
      query = query.or(
        `title.ilike.%${term}%,summary.ilike.%${term}%,content.ilike.%${term}%,tags.ilike.%${term}%`
      );
    }

    if (sort === 'trending' || sort === 'views') {
      query = query.order('popularity_score', { ascending: false }).order('published_at', { ascending: false });
    } else if (sort === 'shares') {
      query = query.order('shares', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('published_at', { ascending: true });
    } else {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    }

    query = query.range(safeOffset, safeOffset + safeLimit - 1);

    const { data, count, error } = await query;
    if (!error && data) {
      return {
        articles: data.map(formatArticle),
        total: count || 0,
        limit: safeLimit,
        offset: safeOffset,
      };
    }

    if (error && !isTableMissing(error)) {
      console.error('Supabase getArticles error:', error);
      throw error;
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) {
    return { articles: [], total: 0, limit: safeLimit, offset: safeOffset };
  }

  let whereClauses = [];
  let params = [];

  if (status !== 'all') {
    whereClauses.push('a.status = ?');
    params.push(status);
  }

  if (category && category !== 'all') {
    if (/^\d+$/.test(category)) {
      whereClauses.push('a.category_id = ?');
      params.push(parseInt(category, 10));
    } else {
      whereClauses.push('c.slug = ?');
      params.push(category);
    }
  }

  if (featured === '1' || featured === 'true' || featured === 1 || featured === true) {
    whereClauses.push('a.is_featured = 1');
  }

  if (breaking === '1' || breaking === 'true' || breaking === 1 || breaking === true) {
    whereClauses.push('a.is_breaking = 1');
  }

  if (q && q.trim()) {
    whereClauses.push('(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)');
    const term = `%${q.trim()}%`;
    params.push(term, term, term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let orderBy = 'ORDER BY a.published_at DESC';
  if (sort === 'trending' || sort === 'views') {
    orderBy = 'ORDER BY (a.views * 2 + a.shares * 5) DESC, a.published_at DESC';
  } else if (sort === 'shares') {
    orderBy = 'ORDER BY a.shares DESC';
  } else if (sort === 'oldest') {
    orderBy = 'ORDER BY a.published_at ASC';
  }

  const countRow = db.prepare(`
    SELECT COUNT(*) as total 
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereStr}
  `).get(...params);

  const selectSql = `
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.source_name, a.source_url,
      a.status, a.is_featured, a.is_breaking,
      a.published_at, a.updated_at, a.created_at,
      a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereStr}
    ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(selectSql).all(...params, safeLimit, safeOffset);
  return {
    articles: rows.map(formatArticle),
    total: countRow ? countRow.total : 0,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function getArticleByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    try {
      const { data: byId, error: errId } = await supabase
        .from('articles')
        .select('*, categories ( id, name, slug )')
        .eq('id', idOrSlug)
        .maybeSingle();

      if (!errId && byId) return formatArticle(byId);

      const { data: bySlug, error: errSlug } = await supabase
        .from('articles')
        .select('*, categories ( id, name, slug )')
        .eq('slug', idOrSlug)
        .maybeSingle();

      if (!errSlug && bySlug) return formatArticle(bySlug);
    } catch (e) {
      // safe fallback
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) return null;

  const sql = `
    SELECT 
      a.*,
      c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ? OR a.slug = ?
  `;
  const row = db.prepare(sql).get(idOrSlug, idOrSlug);
  return formatArticle(row);
}

export async function createArticle(data) {
  const articleId = data.id || uuidv4();
  const slug = data.slug || (await generateUniqueSlug(data.title));
  const tagsJson = Array.isArray(data.tags)
    ? JSON.stringify(data.tags)
    : (data.tags || JSON.stringify([]));

  const status = data.status || 'draft';
  const publishedAt = status === 'published' ? (data.published_at || new Date().toISOString()) : null;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const newRecord = {
      id: articleId,
      title: data.title.trim(),
      slug,
      summary: data.summary ? data.summary.trim() : '',
      content: data.content,
      featured_image: data.featured_image || null,
      category_id: data.category_id ? parseInt(data.category_id, 10) : 1,
      tags: tagsJson,
      author: data.author || 'NRK News24 Bureau',
      source_name: data.source_name || null,
      source_url: data.source_url || null,
      status,
      is_featured: data.is_featured ? 1 : 0,
      is_breaking: data.is_breaking ? 1 : 0,
      published_at: publishedAt,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: data.views || 0,
      shares: data.shares || 0,
    };

    const { data: inserted, error } = await supabase
      .from('articles')
      .insert(newRecord)
      .select('*, categories ( id, name, slug )')
      .single();

    if (!error && inserted) {
      return formatArticle(inserted);
    }

    if (error && !isTableMissing(error)) {
      console.error('Supabase createArticle error:', error);
      throw error;
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) {
    throw new Error('Database connection unavailable');
  }

  db.prepare(`
    INSERT INTO articles (
      id, title, slug, summary, content, featured_image,
      category_id, tags, author, source_name, source_url,
      status, is_featured, is_breaking, published_at,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `).run(
    articleId,
    data.title.trim(),
    slug,
    data.summary ? data.summary.trim() : '',
    data.content,
    data.featured_image || null,
    data.category_id ? parseInt(data.category_id, 10) : 1,
    tagsJson,
    data.author || 'NRK Bureau',
    data.source_name || null,
    data.source_url || null,
    status,
    data.is_featured ? 1 : 0,
    data.is_breaking ? 1 : 0,
    publishedAt
  );

  return getArticleByIdOrSlug(articleId);
}

export async function updateArticle(id, data) {
  const existing = await getArticleByIdOrSlug(id);
  if (!existing) {
    throw new Error('Article not found.');
  }

  let slug = data.slug;
  if (!slug && data.title && data.title !== existing.title) {
    slug = await generateUniqueSlug(data.title, id);
  } else if (slug && slug !== existing.slug) {
    slug = await generateUniqueSlug(slug, id);
  } else {
    slug = existing.slug;
  }

  const tagsJson = Array.isArray(data.tags)
    ? JSON.stringify(data.tags)
    : (data.tags !== undefined ? String(data.tags) : existing.tags);

  const newStatus = data.status || existing.status;
  let publishedAt = existing.published_at;
  if (newStatus === 'published' && existing.status !== 'published') {
    publishedAt = new Date().toISOString();
  }

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const updatePayload = {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(slug !== undefined && { slug }),
      ...(data.summary !== undefined && { summary: data.summary ? data.summary.trim() : '' }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.featured_image !== undefined && { featured_image: data.featured_image }),
      ...(data.category_id !== undefined && { category_id: parseInt(data.category_id, 10) }),
      ...(data.tags !== undefined && { tags: tagsJson }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.source_name !== undefined && { source_name: data.source_name }),
      ...(data.source_url !== undefined && { source_url: data.source_url }),
      ...(data.status !== undefined && { status: newStatus }),
      ...(data.is_featured !== undefined && { is_featured: data.is_featured ? 1 : 0 }),
      ...(data.is_breaking !== undefined && { is_breaking: data.is_breaking ? 1 : 0 }),
      ...(publishedAt !== undefined && { published_at: publishedAt }),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('articles')
      .update(updatePayload)
      .eq('id', id)
      .select('*, categories ( id, name, slug )')
      .single();

    if (!error && updated) {
      return formatArticle(updated);
    }

    if (error && !isTableMissing(error)) {
      console.error('Supabase updateArticle error:', error);
      throw error;
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) throw new Error('Database connection unavailable');

  let publishedAtUpdate = '';
  if (newStatus === 'published' && existing.status !== 'published') {
    publishedAtUpdate = ', published_at = CURRENT_TIMESTAMP';
  }

  db.prepare(`
    UPDATE articles SET
      title = COALESCE(?, title),
      slug = ?,
      summary = COALESCE(?, summary),
      content = COALESCE(?, content),
      featured_image = COALESCE(?, featured_image),
      category_id = COALESCE(?, category_id),
      tags = COALESCE(?, tags),
      author = COALESCE(?, author),
      source_name = COALESCE(?, source_name),
      source_url = COALESCE(?, source_url),
      status = COALESCE(?, status),
      is_featured = COALESCE(?, is_featured),
      is_breaking = COALESCE(?, is_breaking),
      updated_at = CURRENT_TIMESTAMP
      ${publishedAtUpdate}
    WHERE id = ?
  `).run(
    data.title !== undefined ? data.title.trim() : null,
    slug,
    data.summary !== undefined ? (data.summary ? data.summary.trim() : '') : null,
    data.content !== undefined ? data.content : null,
    data.featured_image !== undefined ? data.featured_image : null,
    data.category_id !== undefined ? parseInt(data.category_id, 10) : null,
    data.tags !== undefined ? tagsJson : null,
    data.author !== undefined ? data.author : null,
    data.source_name !== undefined ? data.source_name : null,
    data.source_url !== undefined ? data.source_url : null,
    data.status !== undefined ? newStatus : null,
    data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : null,
    data.is_breaking !== undefined ? (data.is_breaking ? 1 : 0) : null,
    id
  );

  return getArticleByIdOrSlug(id);
}

export async function deleteArticle(id) {
  const existing = await getArticleByIdOrSlug(id);
  if (!existing) {
    throw new Error('Article not found.');
  }

  if (existing.featured_image) {
    await deleteImageFromSupabase(existing.featured_image);
  }

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) return true;
    if (error && !isTableMissing(error)) throw error;
  }

  // SQLite Fallback
  const db = getDb();
  if (db) {
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  }
  return true;
}

export async function recordArticleView(idOrSlug, clientIp = '127.0.0.1') {
  const article = await getArticleByIdOrSlug(idOrSlug);
  if (!article) return null;

  const newViews = (article.views || 0) + 1;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    try {
      await supabase.from('articles').update({ views: newViews }).eq('id', article.id);
      await supabase.from('article_views').insert({
        article_id: article.id,
        ip_hash: (clientIp || '127.0.0.1').slice(0, 45),
        viewed_at: new Date().toISOString(),
      });
      return newViews;
    } catch (e) {}
  }

  const db = getDb();
  if (db) {
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);
    db.prepare('INSERT INTO article_views (article_id, ip_hash) VALUES (?, ?)').run(
      article.id,
      (clientIp || '127.0.0.1').slice(0, 45)
    );
  }
  return newViews;
}

export async function recordArticleShare(idOrSlug, platform = 'unknown') {
  const article = await getArticleByIdOrSlug(idOrSlug);
  if (!article) return null;

  const newShares = (article.shares || 0) + 1;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    try {
      await supabase.from('articles').update({ shares: newShares }).eq('id', article.id);
      await supabase.from('article_shares').insert({
        article_id: article.id,
        platform: platform || 'unknown',
        shared_at: new Date().toISOString(),
      });
      return newShares;
    } catch (e) {}
  }

  const db = getDb();
  if (db) {
    db.prepare('UPDATE articles SET shares = shares + 1 WHERE id = ?').run(article.id);
    db.prepare('INSERT INTO article_shares (article_id, platform) VALUES (?, ?)').run(
      article.id,
      platform || 'unknown'
    );
  }
  return newShares;
}

// ==============================================================================
// HOMEPAGE & PUBLIC PAGES DATA LOADERS
// ==============================================================================

export async function getHomepageData() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error: testErr } = await supabase.from('articles').select('id').limit(1);

    if (!testErr) {
      const [apCat, tgCat, techCat, bizCat, polCat, indCat] = await Promise.all([
        getCategoryBySlug('andhra-pradesh'),
        getCategoryBySlug('telangana'),
        getCategoryBySlug('technology'),
        getCategoryBySlug('business'),
        getCategoryBySlug('politics'),
        getCategoryBySlug('india'),
      ]);

      const polIndIds = [polCat?.id, indCat?.id].filter(Boolean);

      const fetchSection = async (filterFn, orderField = 'published_at', limit = 4) => {
        let q = supabase
          .from('articles')
          .select(`
            id, title, slug, summary, featured_image,
            category_id, tags, author, status, is_featured, is_breaking,
            published_at, created_at, views, shares,
            categories ( id, name, slug )
          `)
          .eq('status', 'published');

        if (filterFn) q = filterFn(q);
        if (orderField === 'trending') {
          q = q.order('popularity_score', { ascending: false }).order('published_at', { ascending: false });
        } else {
          q = q.order('published_at', { ascending: false });
        }
        q = q.limit(limit);

        const { data } = await q;
        return (data || []).map(formatArticle);
      };

      const [
        featuredRaw,
        latestArticles,
        trendingArticles,
        apArticles,
        tgArticles,
        techArticles,
        businessArticles,
        politicsArticles,
      ] = await Promise.all([
        fetchSection((q) => q.eq('is_featured', 1), 'published_at', 5),
        fetchSection(null, 'published_at', 8),
        fetchSection(null, 'trending', 6),
        fetchSection((q) => (apCat ? q.eq('category_id', apCat.id) : q), 'published_at', 4),
        fetchSection((q) => (tgCat ? q.eq('category_id', tgCat.id) : q), 'published_at', 4),
        fetchSection((q) => (techCat ? q.eq('category_id', techCat.id) : q), 'published_at', 4),
        fetchSection((q) => (bizCat ? q.eq('category_id', bizCat.id) : q), 'published_at', 4),
        fetchSection((q) => (polIndIds.length ? q.in('category_id', polIndIds) : q), 'published_at', 4),
      ]);

      let featured = featuredRaw;
      if (featured.length < 5) {
        featured = latestArticles.slice(0, 5);
      }

      return {
        heroArticle: featured[0] || null,
        sideFeatured: featured.slice(1, 5),
        latestArticles,
        trendingArticles,
        apArticles,
        tgArticles,
        techArticles,
        businessArticles,
        politicsArticles,
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) {
    return {
      heroArticle: null,
      sideFeatured: [],
      latestArticles: [],
      trendingArticles: [],
      apArticles: [],
      tgArticles: [],
      techArticles: [],
      businessArticles: [],
      politicsArticles: [],
    };
  }

  const queryArticles = (whereClause, orderBy, limit) => {
    const sql = `
      SELECT 
        a.id, a.title, a.slug, a.summary, a.featured_image,
        a.category_id, c.name as category_name, c.slug as category_slug,
        a.tags, a.author, a.status, a.is_featured, a.is_breaking,
        a.published_at, a.created_at, a.views, a.shares
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published' ${whereClause ? `AND ${whereClause}` : ''}
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `;
    return db.prepare(sql).all().map(formatArticle);
  };

  let featured = queryArticles('a.is_featured = 1', 'a.published_at DESC', 5);
  if (featured.length < 5) {
    featured = queryArticles(null, 'a.published_at DESC', 5);
  }

  return {
    heroArticle: featured[0] || null,
    sideFeatured: featured.slice(1, 5),
    latestArticles: queryArticles(null, 'a.published_at DESC', 8),
    trendingArticles: queryArticles(null, '(a.views * 2 + a.shares * 5) DESC, a.published_at DESC', 6),
    apArticles: queryArticles("c.slug = 'andhra-pradesh'", 'a.published_at DESC', 4),
    tgArticles: queryArticles("c.slug = 'telangana'", 'a.published_at DESC', 4),
    techArticles: queryArticles("c.slug = 'technology'", 'a.published_at DESC', 4),
    businessArticles: queryArticles("c.slug = 'business'", 'a.published_at DESC', 4),
    politicsArticles: queryArticles("c.slug IN ('politics', 'india')", 'a.published_at DESC', 4),
  };
}

export async function getCategoryData(slug) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error: testErr } = await supabase.from('articles').select('id').limit(1);

    if (!testErr) {
      const [articlesRes, trendingRes] = await Promise.all([
        supabase
          .from('articles')
          .select(`
            id, title, slug, summary, featured_image,
            category_id, tags, author, status, is_featured, is_breaking,
            published_at, created_at, views, shares,
            categories ( id, name, slug )
          `)
          .eq('category_id', category.id)
          .eq('status', 'published')
          .order('published_at', { ascending: false }),

        supabase
          .from('articles')
          .select(`
            id, title, slug, category_id, published_at, views, shares,
            categories ( id, name, slug )
          `)
          .eq('status', 'published')
          .order('popularity_score', { ascending: false })
          .limit(5),
      ]);

      return {
        category,
        articles: (articlesRes.data || []).map(formatArticle),
        trending: (trendingRes.data || []).map(formatArticle),
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) return null;

  const articles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.status, a.is_featured, a.is_breaking,
      a.published_at, a.created_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.category_id = ? AND a.status = 'published'
    ORDER BY a.published_at DESC
  `).all(category.id).map(formatArticle);

  const trending = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.category_id,
      c.name as category_name, c.slug as category_slug,
      a.published_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY (a.views * 2 + a.shares * 5) DESC
    LIMIT 5
  `).all().map(formatArticle);

  return { category, articles, trending };
}

export async function getLatestData() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error: testErr } = await supabase.from('articles').select('id').limit(1);

    if (!testErr) {
      const [articlesRes, trendingRes] = await Promise.all([
        supabase
          .from('articles')
          .select(`
            id, title, slug, summary, featured_image,
            category_id, tags, author, status, is_featured, is_breaking,
            published_at, created_at, views, shares,
            categories ( id, name, slug )
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(30),

        supabase
          .from('articles')
          .select(`
            id, title, slug, category_id, published_at, views, shares,
            categories ( id, name, slug )
          `)
          .eq('status', 'published')
          .order('popularity_score', { ascending: false })
          .limit(5),
      ]);

      return {
        articles: (articlesRes.data || []).map(formatArticle),
        trending: (trendingRes.data || []).map(formatArticle),
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) return { articles: [], trending: [] };

  const articles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.status, a.is_featured, a.is_breaking,
      a.published_at, a.created_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 30
  `).all().map(formatArticle);

  const trending = db.prepare(`
    SELECT 
      a.id, a.title, a.slug,
      c.name as category_name, c.slug as category_slug,
      a.published_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY (a.views * 2 + a.shares * 5) DESC
    LIMIT 5
  `).all().map(formatArticle);

  return { articles, trending };
}

export async function getArticleDetailData(slug) {
  const article = await getArticleByIdOrSlug(slug);
  if (!article || article.status !== 'published') return null;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error: testErr } = await supabase.from('articles').select('id').limit(1);

    if (!testErr) {
      const [relatedRes, trendingRes] = await Promise.all([
        supabase
          .from('articles')
          .select(`
            id, title, slug, summary, featured_image,
            category_id, tags, author, published_at,
            categories ( id, name, slug )
          `)
          .eq('status', 'published')
          .eq('category_id', article.category_id || 1)
          .neq('id', article.id)
          .order('published_at', { ascending: false })
          .limit(4),

        supabase
          .from('articles')
          .select(`
            id, title, slug, summary, featured_image,
            category_id, published_at, views, shares,
            categories ( id, name, slug )
          `)
          .eq('status', 'published')
          .neq('id', article.id)
          .order('popularity_score', { ascending: false })
          .limit(5),
      ]);

      return {
        article,
        relatedArticles: (relatedRes.data || []).map(formatArticle),
        trendingArticles: (trendingRes.data || []).map(formatArticle),
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) return { article, relatedArticles: [], trendingArticles: [] };

  const relatedArticles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.published_at, a.author
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.category_id = ? AND a.id != ? AND a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 4
  `).all(article.category_id || 1, article.id).map(formatArticle);

  const trendingArticles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.published_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id != ? AND a.status = 'published'
    ORDER BY (a.views * 2 + a.shares * 5) DESC
    LIMIT 5
  `).all(article.id).map(formatArticle);

  return {
    article,
    relatedArticles,
    trendingArticles,
  };
}

export async function getSitemapData() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error: testErr } = await supabase.from('articles').select('id').limit(1);

    if (!testErr) {
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from('articles')
          .select('slug, published_at, updated_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1000),

        supabase
          .from('categories')
          .select('slug')
          .order('display_order', { ascending: true }),
      ]);

      return {
        articles: articlesRes.data || [],
        categories: categoriesRes.data || [],
      };
    }
  }

  const db = getDb();
  if (!db) return { articles: [], categories: [] };

  return {
    articles: db.prepare(`
      SELECT slug, published_at, updated_at 
      FROM articles 
      WHERE status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 1000
    `).all(),
    categories: db.prepare('SELECT slug FROM categories ORDER BY display_order ASC').all(),
  };
}

// ==============================================================================
// CATEGORIES
// ==============================================================================

export async function getCategories() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error && categories && categories.length > 0) {
      const { data: artCounts } = await supabase
        .from('articles')
        .select('category_id')
        .eq('status', 'published');

      const countMap = {};
      if (artCounts) {
        for (const a of artCounts) {
          if (a.category_id) {
            countMap[a.category_id] = (countMap[a.category_id] || 0) + 1;
          }
        }
      }

      return categories.map((c) => ({
        ...c,
        article_count: countMap[c.id] || 0,
      }));
    }
  }

  const db = getDb();
  if (!db) return [];

  return db.prepare(`
    SELECT 
      c.*,
      COUNT(CASE WHEN a.status = 'published' THEN 1 END) as article_count
    FROM categories c
    LEFT JOIN articles a ON c.id = a.category_id
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.name ASC
  `).all();
}

export async function getCategoryBySlug(slug) {
  if (!slug) return null;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) return data;
  }

  const db = getDb();
  if (!db) return null;

  return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
}

export async function createCategory(data) {
  const name = data.name.trim();
  let slug = data.slug ? slugifyText(data.slug) : slugifyText(name);
  const order = parseInt(data.display_order || '0', 10);
  const description = data.description || '';

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const existing = await getCategoryBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description,
        display_order: order,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (!error && created) return created;
    if (error && !isTableMissing(error)) throw error;
  }

  const db = getDb();
  if (!db) throw new Error('Database connection unavailable');

  const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const result = db.prepare(`
    INSERT INTO categories (name, slug, description, display_order)
    VALUES (?, ?, ?, ?)
  `).run(name, slug, description, order);

  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
}

export async function updateCategory(id, data) {
  const cleanSlug = data.slug
    ? slugifyText(data.slug)
    : data.name
    ? slugifyText(data.name)
    : undefined;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const updatePayload = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (cleanSlug !== undefined) updatePayload.slug = cleanSlug;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.display_order !== undefined) updatePayload.display_order = parseInt(data.display_order, 10);

    const { data: updated, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && updated) return updated;
    if (error && !isTableMissing(error)) throw error;
  }

  const db = getDb();
  if (!db) throw new Error('Database connection unavailable');

  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      slug = COALESCE(?, slug),
      description = COALESCE(?, description),
      display_order = COALESCE(?, display_order)
    WHERE id = ?
  `).run(
    data.name,
    cleanSlug,
    data.description,
    data.display_order !== undefined ? parseInt(data.display_order, 10) : null,
    id
  );

  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export async function deleteCategory(id) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    try {
      await supabase.from('articles').update({ category_id: 1 }).eq('category_id', id);
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {}
  }

  const db = getDb();
  if (!db) return true;

  const articleCount = db.prepare('SELECT COUNT(*) as cnt FROM articles WHERE category_id = ?').get(id).cnt;
  if (articleCount > 0) {
    db.prepare('UPDATE articles SET category_id = 1 WHERE category_id = ?').run(id);
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return true;
}

// ==============================================================================
// ADMIN AUTH & USERS
// ==============================================================================

export async function getAdminByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!error && data) return data;
  }

  const db = getDb();
  if (!db) return null;

  return db.prepare('SELECT * FROM admins WHERE email = ?').get(cleanEmail);
}

export async function getAdminById(id) {
  if (!id) return null;

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('admins')
      .select('id, name, email, role, created_at')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) return data;
  }

  const db = getDb();
  if (!db) return null;

  return db.prepare('SELECT id, name, email, role, created_at FROM admins WHERE id = ?').get(id);
}

export async function updateAdmin(id, updateData) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) return data;
  }

  const db = getDb();
  if (!db) return null;

  if (updateData.password_hash) {
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(updateData.password_hash, id);
  }
  if (updateData.name) {
    db.prepare('UPDATE admins SET name = ? WHERE id = ?').run(updateData.name, id);
  }
  return getAdminById(id);
}

// ==============================================================================
// ADMIN DASHBOARD STATS & RECENT ARTICLES
// ==============================================================================

export async function getAdminStats() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();

    // Check if view exists
    const { data: viewData, error: viewErr } = await supabase.from('admin_stats_view').select('*').maybeSingle();
    if (!viewErr && viewData) {
      return {
        totalArticles: Number(viewData.total_articles) || 0,
        publishedCount: Number(viewData.published_count) || 0,
        draftCount: Number(viewData.draft_count) || 0,
        pendingAiCount: Number(viewData.pending_ai_count) || 0,
        breakingCount: Number(viewData.breaking_count) || 0,
        featuredCount: Number(viewData.featured_count) || 0,
        totalViews: Number(viewData.total_views) || 0,
        totalShares: Number(viewData.total_shares) || 0,
      };
    }

    const { error: testErr } = await supabase.from('articles').select('id').limit(1);
    if (!testErr) {
      const [totalRes, pubRes, draftRes, pendingRes, breakRes, featRes, viewsSharesRes] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('is_breaking', 1),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('is_featured', 1),
        supabase.from('articles').select('views, shares'),
      ]);

      let totalViews = 0;
      let totalShares = 0;
      if (viewsSharesRes.data) {
        for (const row of viewsSharesRes.data) {
          totalViews += row.views || 0;
          totalShares += row.shares || 0;
        }
      }

      return {
        totalArticles: totalRes.count || 0,
        publishedCount: pubRes.count || 0,
        draftCount: draftRes.count || 0,
        pendingAiCount: pendingRes.count || 0,
        breakingCount: breakRes.count || 0,
        featuredCount: featRes.count || 0,
        totalViews,
        totalShares,
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) {
    return {
      totalArticles: 0,
      publishedCount: 0,
      draftCount: 0,
      pendingAiCount: 0,
      breakingCount: 0,
      featuredCount: 0,
      totalViews: 0,
      totalShares: 0,
    };
  }

  const counts = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
      COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_ai,
      COUNT(CASE WHEN is_breaking = 1 AND status = 'published' THEN 1 END) as breaking,
      COUNT(CASE WHEN is_featured = 1 AND status = 'published' THEN 1 END) as featured,
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(shares), 0) as total_shares
    FROM articles
  `).get();

  return {
    totalArticles: counts?.total || 0,
    publishedCount: counts?.published || 0,
    draftCount: counts?.drafts || 0,
    pendingAiCount: counts?.pending_ai || 0,
    breakingCount: counts?.breaking || 0,
    featuredCount: counts?.featured || 0,
    totalViews: counts?.total_views || 0,
    totalShares: counts?.total_shares || 0,
  };
}

export async function getAdminRecentArticles(limit = 8) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id, title, slug, status, is_featured, is_breaking,
        published_at, created_at, views, shares,
        categories ( id, name, slug )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data.map(formatArticle);
    }
  }

  const db = getDb();
  if (!db) return [];

  return db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.status, a.is_featured, a.is_breaking,
      a.published_at, a.created_at, a.views, a.shares,
      c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit);
}

// ==============================================================================
// SETTINGS
// ==============================================================================

export async function getSettings() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data && data.length > 0) {
      const settings = {};
      for (const r of data) {
        settings[r.key] = r.value;
      }
      return settings;
    }
  }

  const db = getDb();
  if (!db) return {};

  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}

export async function upsertSetting(key, value) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    try {
      const { error } = await supabase.from('settings').upsert({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      });
      if (!error) return true;
    } catch (e) {}
  }

  const db = getDb();
  if (db) {
    db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, String(value));
  }
  return true;
}

// ==============================================================================
// BREAKING NEWS
// ==============================================================================

export async function getBreakingNewsData() {
  const settings = await getSettings();
  const isEnabled = settings.breaking_news_enabled !== 'false';
  const customTicker = settings.custom_breaking_ticker || '';

  if (!isEnabled) {
    return { enabled: false, items: [] };
  }

  let breakingArticles = [];
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id, title, slug, published_at,
        categories ( name, slug )
      `)
      .eq('is_breaking', 1)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6);

    if (!error && data && data.length > 0) {
      breakingArticles = data.map(formatArticle);
    }
  }

  if (breakingArticles.length === 0) {
    const db = getDb();
    if (db) {
      breakingArticles = db.prepare(`
        SELECT 
          a.id, a.title, a.slug, a.published_at,
          c.name as category_name, c.slug as category_slug
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.is_breaking = 1 AND a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT 6
      `).all().map(formatArticle);
    }
  }

  const items = [];
  if (customTicker && customTicker.trim()) {
    items.push({
      id: 'custom-alert',
      title: customTicker.trim(),
      slug: null,
      isCustom: true,
    });
  }

  for (const art of breakingArticles) {
    items.push({
      id: art.id,
      title: art.title,
      slug: art.slug,
      category: art.category_name,
      isCustom: false,
    });
  }

  return { enabled: true, items };
}

// ==============================================================================
// SEARCH
// ==============================================================================

export async function searchArticles({ query = '', category = '', sort = 'relevance', limit = 20 } = {}) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { query: '', results: [], total: 0 };
  }

  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    let q = supabase
      .from('articles')
      .select(`
        id, title, slug, summary, featured_image,
        category_id, tags, author, published_at, views, shares,
        categories ( id, name, slug )
      `, { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${cleanQuery}%,summary.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%,tags.ilike.%${cleanQuery}%`);

    if (category && category !== 'all') {
      const cat = await getCategoryBySlug(category);
      if (cat) q = q.eq('category_id', cat.id);
    }

    q = q.order('published_at', { ascending: false }).limit(limit);

    const { data, count, error } = await q;
    if (!error && data) {
      return {
        query: cleanQuery,
        total: count || 0,
        results: data.map(formatArticle),
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) return { query: cleanQuery, total: 0, results: [] };

  const term = `%${cleanQuery}%`;
  let whereClauses = [
    "a.status = 'published'",
    "(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.tags LIKE ? OR c.name LIKE ?)"
  ];
  let params = [term, term, term, term, term];

  if (category && category !== 'all') {
    whereClauses.push('c.slug = ?');
    params.push(category);
  }

  const whereStr = `WHERE ${whereClauses.join(' AND ')}`;
  const countRow = db.prepare(`
    SELECT COUNT(*) as total 
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereStr}
  `).get(...params);

  const results = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.published_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereStr}
    ORDER BY (CASE WHEN a.title LIKE ? THEN 3 WHEN a.summary LIKE ? THEN 2 ELSE 1 END) DESC, a.published_at DESC
    LIMIT ?
  `).all(...params, term, term, limit).map(formatArticle);

  return {
    query: cleanQuery,
    total: countRow ? countRow.total : 0,
    results,
  };
}

// ==============================================================================
// NEWS SOURCES
// ==============================================================================

export async function getNewsSources() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('news_sources')
      .select('*, categories ( id, name, slug )')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        ...s,
        category_name: s.categories?.name || null,
        category_slug: s.categories?.slug || null,
      }));
    }
  }

  const db = getDb();
  if (!db) return [];

  return db.prepare(`
    SELECT 
      ns.*,
      c.name as category_name, c.slug as category_slug
    FROM news_sources ns
    LEFT JOIN categories c ON ns.category_id = c.id
    ORDER BY ns.id ASC
  `).all();
}

export async function createNewsSource(data) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data: created, error } = await supabase
      .from('news_sources')
      .insert({
        name: data.name.trim(),
        feed_url: data.feed_url.trim(),
        category_id: data.category_id ? parseInt(data.category_id, 10) : 1,
        is_enabled: data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : 1,
        source_type: data.source_type || 'rss',
        created_at: new Date().toISOString(),
      })
      .select('*, categories ( id, name, slug )')
      .single();

    if (!error && created) return created;
    if (error && !isTableMissing(error)) throw error;
  }

  const db = getDb();
  if (!db) throw new Error('Database connection unavailable');

  const res = db.prepare(`
    INSERT INTO news_sources (name, feed_url, category_id, is_enabled, source_type)
    VALUES (?, ?, ?, ?, 'rss')
  `).run(
    data.name.trim(),
    data.feed_url.trim(),
    data.category_id || 1,
    data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : 1
  );

  return db.prepare('SELECT * FROM news_sources WHERE id = ?').get(res.lastInsertRowid);
}

export async function updateNewsSource(id, data) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const updatePayload = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.feed_url !== undefined) updatePayload.feed_url = data.feed_url.trim();
    if (data.category_id !== undefined) updatePayload.category_id = parseInt(data.category_id, 10);
    if (data.is_enabled !== undefined) updatePayload.is_enabled = data.is_enabled ? 1 : 0;

    const { data: updated, error } = await supabase
      .from('news_sources')
      .update(updatePayload)
      .eq('id', id)
      .select('*, categories ( id, name, slug )')
      .single();

    if (!error && updated) return updated;
    if (error && !isTableMissing(error)) throw error;
  }

  const db = getDb();
  if (!db) throw new Error('Database connection unavailable');

  db.prepare(`
    UPDATE news_sources SET
      name = COALESCE(?, name),
      feed_url = COALESCE(?, feed_url),
      category_id = COALESCE(?, category_id),
      is_enabled = COALESCE(?, is_enabled)
    WHERE id = ?
  `).run(
    data.name,
    data.feed_url,
    data.category_id,
    data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : null,
    id
  );

  return db.prepare('SELECT * FROM news_sources WHERE id = ?').get(id);
}

export async function deleteNewsSource(id) {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error } = await supabase.from('news_sources').delete().eq('id', id);
    if (!error) return true;
    if (error && !isTableMissing(error)) throw error;
  }

  const db = getDb();
  if (db) {
    db.prepare('DELETE FROM news_sources WHERE id = ?').run(id);
  }
  return true;
}

// ==============================================================================
// ANALYTICS
// ==============================================================================

export async function getAnalyticsData() {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { error: testErr } = await supabase.from('articles').select('id').limit(1);

    if (!testErr) {
      const [viewsCountRes, sharesCountRes, allArticlesRes, topViewedRes, topSharedRes, categoriesRes, sharesRowsRes] = await Promise.all([
        supabase.from('article_views').select('*', { count: 'exact', head: true }),
        supabase.from('article_shares').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('views, shares, category_id').eq('status', 'published'),
        supabase.from('articles').select('id, title, slug, views, shares, published_at, categories(name)').eq('status', 'published').gt('views', 0).order('views', { ascending: false }).limit(10),
        supabase.from('articles').select('id, title, slug, views, shares, published_at, categories(name)').eq('status', 'published').gt('shares', 0).order('shares', { ascending: false }).limit(10),
        supabase.from('categories').select('id, name, slug'),
        supabase.from('article_shares').select('platform'),
      ]);

      let totalViews = 0;
      let totalShares = 0;
      const catPerfMap = {};

      if (allArticlesRes.data) {
        for (const a of allArticlesRes.data) {
          totalViews += (a.views || 0);
          totalShares += (a.shares || 0);
          if (a.category_id) {
            if (!catPerfMap[a.category_id]) {
              catPerfMap[a.category_id] = { published_count: 0, total_views: 0, total_shares: 0 };
            }
            catPerfMap[a.category_id].published_count++;
            catPerfMap[a.category_id].total_views += (a.views || 0);
            catPerfMap[a.category_id].total_shares += (a.shares || 0);
          }
        }
      }

      const categoryPerformance = (categoriesRes.data || [])
        .map((c) => ({
          category_name: c.name,
          category_slug: c.slug,
          published_count: catPerfMap[c.id]?.published_count || 0,
          total_views: catPerfMap[c.id]?.total_views || 0,
          total_shares: catPerfMap[c.id]?.total_shares || 0,
        }))
        .filter((c) => c.published_count > 0 || c.total_views > 0 || c.total_shares > 0)
        .sort((a, b) => b.total_views - a.total_views);

      const platformCounts = {};
      if (sharesRowsRes.data) {
        for (const s of sharesRowsRes.data) {
          platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1;
        }
      }

      const sharePlatforms = Object.entries(platformCounts)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalViews,
        totalShares,
        loggedViewEvents: viewsCountRes.count || 0,
        loggedShareEvents: sharesCountRes.count || 0,
        hasData: totalViews > 0 || totalShares > 0,
        topViewedArticles: (topViewedRes.data || []).map((a) => ({ ...a, category_name: a.categories?.name })),
        topSharedArticles: (topSharedRes.data || []).map((a) => ({ ...a, category_name: a.categories?.name })),
        categoryPerformance,
        sharePlatforms,
      };
    }
  }

  // SQLite Fallback
  const db = getDb();
  if (!db) {
    return {
      totalViews: 0,
      totalShares: 0,
      loggedViewEvents: 0,
      loggedShareEvents: 0,
      hasData: false,
      topViewedArticles: [],
      topSharedArticles: [],
      categoryPerformance: [],
      sharePlatforms: [],
    };
  }

  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(shares), 0) as total_shares,
      (SELECT COUNT(*) FROM article_views) as logged_view_events,
      (SELECT COUNT(*) FROM article_shares) as logged_share_events
    FROM articles
  `).get();

  const topViewedArticles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.views, a.shares, a.published_at,
      c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published' AND a.views > 0
    ORDER BY a.views DESC
    LIMIT 10
  `).all();

  const topSharedArticles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.views, a.shares, a.published_at,
      c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published' AND a.shares > 0
    ORDER BY a.shares DESC
    LIMIT 10
  `).all();

  const categoryPerformance = db.prepare(`
    SELECT 
      c.name as category_name,
      c.slug as category_slug,
      COUNT(a.id) as published_count,
      COALESCE(SUM(a.views), 0) as total_views,
      COALESCE(SUM(a.shares), 0) as total_shares
    FROM categories c
    LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
    GROUP BY c.id
    HAVING total_views > 0 OR total_shares > 0 OR published_count > 0
    ORDER BY total_views DESC
  `).all();

  const sharePlatforms = db.prepare(`
    SELECT platform, COUNT(*) as count
    FROM article_shares
    GROUP BY platform
    ORDER BY count DESC
  `).all();

  return {
    totalViews: totals.total_views,
    totalShares: totals.total_shares,
    loggedViewEvents: totals.logged_view_events,
    loggedShareEvents: totals.logged_share_events,
    hasData: totals.total_views > 0 || totals.total_shares > 0,
    topViewedArticles,
    topSharedArticles,
    categoryPerformance,
    sharePlatforms,
  };
}

// ==============================================================================
// AI NEWS REVIEW QUEUE
// ==============================================================================

export async function getAiQueueArticles(status = 'pending_review') {
  if (isSupabaseConfigured()) {
    const supabase = getActiveSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id, title, slug, summary, content, featured_image,
        category_id, tags, author, source_name, source_url,
        status, created_at,
        categories ( id, name, slug )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(formatArticle);
    }
  }

  const db = getDb();
  if (!db) return [];

  return db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.content, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.source_name, a.source_url,
      a.status, a.created_at
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = ?
    ORDER BY a.created_at DESC
  `).all(status).map(formatArticle);
}
