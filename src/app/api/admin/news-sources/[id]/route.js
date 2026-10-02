import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();
    const { name, feed_url, category_id, is_enabled } = body;

    const db = getDb();
    const existing = db.prepare('SELECT id FROM news_sources WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'News source not found.' }, { status: 404 });
    }

    db.prepare(`
      UPDATE news_sources SET
        name = COALESCE(?, name),
        feed_url = COALESCE(?, feed_url),
        category_id = COALESCE(?, category_id),
        is_enabled = COALESCE(?, is_enabled)
      WHERE id = ?
    `).run(
      name,
      feed_url,
      category_id,
      is_enabled !== undefined ? (is_enabled ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM news_sources WHERE id = ?').get(id);
    return NextResponse.json({ success: true, message: 'News source updated.', source: updated });
  } catch (err) {
    console.error('Error updating news source:', err);
    return NextResponse.json({ success: false, error: 'Failed to update news source.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const db = getDb();

    db.prepare('DELETE FROM news_sources WHERE id = ?').run(id);
    return NextResponse.json({ success: true, message: 'News source deleted.' });
  } catch (err) {
    console.error('Error deleting news source:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete news source.' }, { status: 500 });
  }
}
