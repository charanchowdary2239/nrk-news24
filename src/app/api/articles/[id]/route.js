import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { generateUniqueSlug } from '@/lib/slugify';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = getDb();

    const sql = `
      SELECT 
        a.*,
        c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ? OR a.slug = ?
    `;

    const article = db.prepare(sql).get(id, id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    let parsedTags = [];
    try {
      parsedTags = article.tags ? JSON.parse(article.tags) : [];
    } catch (e) {
      parsedTags = article.tags ? article.tags.split(',').map((t) => t.trim()) : [];
    }

    return NextResponse.json({
      success: true,
      article: {
        ...article,
        tags: Array.isArray(parsedTags) ? parsedTags : [],
      },
    });
  } catch (err) {
    console.error('Error fetching article:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT id, slug, status FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    const {
      title,
      summary,
      content,
      featured_image,
      category_id,
      tags,
      author,
      source_name,
      source_url,
      status,
      is_featured,
      is_breaking,
    } = body;

    let slug = body.slug;
    if (!slug && title) {
      slug = generateUniqueSlug(db, title, id);
    } else if (slug && slug !== existing.slug) {
      slug = generateUniqueSlug(db, slug, id);
    } else {
      slug = existing.slug;
    }

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? JSON.stringify(tags.split(',').map(t => t.trim())) : '[]');

    const newStatus = status || existing.status;
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
        tags = ?,
        author = COALESCE(?, author),
        source_name = COALESCE(?, source_name),
        source_url = COALESCE(?, source_url),
        status = ?,
        is_featured = COALESCE(?, is_featured),
        is_breaking = COALESCE(?, is_breaking),
        updated_at = CURRENT_TIMESTAMP
        ${publishedAtUpdate}
      WHERE id = ?
    `).run(
      title,
      slug,
      summary,
      content,
      featured_image,
      category_id,
      tagsJson,
      author,
      source_name,
      source_url,
      newStatus,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_breaking !== undefined ? (is_breaking ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully.',
      article: updated,
    });
  } catch (err) {
    console.error('Error updating article:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update article.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM articles WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting article:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete article.' },
      { status: 500 }
    );
  }
}
