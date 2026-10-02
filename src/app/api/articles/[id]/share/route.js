import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || 'unknown';

    const db = getDb();
    const article = db.prepare('SELECT id, shares FROM articles WHERE slug = ? OR id = ?').get(id, id);
    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    db.prepare('UPDATE articles SET shares = shares + 1 WHERE id = ?').run(article.id);
    db.prepare('INSERT INTO article_shares (article_id, platform) VALUES (?, ?)').run(article.id, platform);

    return NextResponse.json({
      success: true,
      shares: article.shares + 1,
    });
  } catch (err) {
    console.error('Error incrementing share:', err);
    return NextResponse.json({ success: false, error: 'Failed to record share' }, { status: 500 });
  }
}
