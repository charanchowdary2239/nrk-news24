import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { generateUniqueSlug } from '@/lib/slugify';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const db = getDb();

    const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    const title = body.title || existing.title;
    let slug = body.slug;
    if (!slug) {
      slug = generateUniqueSlug(db, title, id);
    }

    const summary = body.summary || existing.summary;
    const content = body.content || existing.content;
    const category_id = body.category_id || existing.category_id;
    const is_featured = body.is_featured ? 1 : 0;
    const is_breaking = body.is_breaking ? 1 : 0;
    const tagsJson = body.tags ? (Array.isArray(body.tags) ? JSON.stringify(body.tags) : JSON.stringify(body.tags.split(',').map(t => t.trim()))) : existing.tags;

    db.prepare(`
      UPDATE articles SET
        title = ?,
        slug = ?,
        summary = ?,
        content = ?,
        category_id = ?,
        tags = ?,
        is_featured = ?,
        is_breaking = ?,
        status = 'published',
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      slug,
      summary,
      content,
      category_id,
      tagsJson,
      is_featured,
      is_breaking,
      id
    );

    const approved = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      message: 'Article approved and published to public site.',
      article: approved,
    });
  } catch (err) {
    console.error('Error approving AI article:', err);
    return NextResponse.json({ success: false, error: 'Failed to approve article.' }, { status: 500 });
  }
}
