import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'relevance';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return NextResponse.json({
        success: true,
        query: '',
        results: [],
        total: 0,
      });
    }

    const db = getDb();
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

    let orderBy = 'ORDER BY (CASE WHEN a.title LIKE ? THEN 3 WHEN a.summary LIKE ? THEN 2 ELSE 1 END) DESC, a.published_at DESC';
    const orderParams = [term, term];

    const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

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
        a.tags, a.author, a.published_at, a.views, a.shares
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereStr}
      ${orderBy}
      LIMIT ?
    `;

    const results = db.prepare(selectSql).all(...params, ...orderParams, limit);

    const formatted = results.map((art) => {
      let parsedTags = [];
      try {
        parsedTags = art.tags ? JSON.parse(art.tags) : [];
      } catch (e) {
        parsedTags = art.tags ? art.tags.split(',') : [];
      }
      return {
        ...art,
        tags: Array.isArray(parsedTags) ? parsedTags : [],
      };
    });

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      total,
      results: formatted,
    });
  } catch (err) {
    console.error('Error in /api/search:', err);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
