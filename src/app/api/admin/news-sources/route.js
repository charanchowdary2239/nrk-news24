import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const db = getDb();
    const sources = db.prepare(`
      SELECT 
        ns.*,
        c.name as category_name, c.slug as category_slug
      FROM news_sources ns
      LEFT JOIN categories c ON ns.category_id = c.id
      ORDER BY ns.id ASC
    `).all();

    return NextResponse.json({ success: true, sources });
  } catch (err) {
    console.error('Error fetching sources:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch sources.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, feed_url, category_id, is_enabled } = body;

    if (!name || !feed_url) {
      return NextResponse.json({ success: false, error: 'Source name and feed URL are required.' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO news_sources (name, feed_url, category_id, is_enabled, source_type)
      VALUES (?, ?, ?, ?, 'rss')
    `).run(name.trim(), feed_url.trim(), category_id || 1, is_enabled !== undefined ? (is_enabled ? 1 : 0) : 1);

    const created = db.prepare('SELECT * FROM news_sources WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ success: true, message: 'News source added successfully.', source: created });
  } catch (err) {
    console.error('Error adding news source:', err);
    return NextResponse.json({ success: false, error: 'Failed to add news source.' }, { status: 500 });
  }
}
