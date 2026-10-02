import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const db = getDb();

    const article = db.prepare('SELECT id, views FROM articles WHERE slug = ? OR id = ?').get(id, id);
    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    db.prepare('INSERT INTO article_views (article_id, ip_hash) VALUES (?, ?)').run(article.id, clientIp.slice(0, 45));

    return NextResponse.json({
      success: true,
      views: article.views + 1,
    });
  } catch (err) {
    console.error('Error incrementing view:', err);
    return NextResponse.json({ success: false, error: 'Failed to record view' }, { status: 500 });
  }
}
