import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';
    const featured = searchParams.get('featured');
    const breaking = searchParams.get('breaking');
    const sort = searchParams.get('sort') || 'latest';
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const db = getDb();
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

    if (featured === '1' || featured === 'true') {
      whereClauses.push('a.is_featured = 1');
    }

    if (breaking === '1' || breaking === 'true') {
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

    const countSql = `
      SELECT COUNT(*) as total 
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereStr}
    `;
    const countRow = db.prepare(countSql).get(...params);
    const total = countRow ? countRow.total : 0;

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

    const articles = db.prepare(selectSql).all(...params, limit, offset);

    const formatted = articles.map((art) => {
      let parsedTags = [];
      try {
        parsedTags = art.tags ? JSON.parse(art.tags) : [];
      } catch (e) {
        parsedTags = art.tags ? art.tags.split(',').map((t) => t.trim()) : [];
      }
      return {
        ...art,
        tags: Array.isArray(parsedTags) ? parsedTags : [],
      };
    });

    return NextResponse.json({
      success: true,
      articles: formatted,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('Error in /api/articles:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles.' },
      { status: 500 }
    );
  }
}
