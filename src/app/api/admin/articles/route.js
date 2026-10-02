import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { generateUniqueSlug } from '@/lib/slugify';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { errorResponse, admin } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
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
      status = 'published',
      is_featured = false,
      is_breaking = false,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Headline and article content are required.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const articleId = uuidv4();
    const slug = body.slug ? generateUniqueSlug(db, body.slug) : generateUniqueSlug(db, title);
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);

    const publishedAt = status === 'published' ? new Date().toISOString() : null;

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
      title.trim(),
      slug,
      summary ? summary.trim() : '',
      content,
      featured_image || null,
      category_id || 1,
      tagsJson,
      author || admin.name || 'NRK Bureau',
      source_name || null,
      source_url || null,
      status,
      is_featured ? 1 : 0,
      is_breaking ? 1 : 0,
      publishedAt
    );

    const created = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);

    return NextResponse.json({
      success: true,
      message: 'Article created successfully.',
      article: created,
    });
  } catch (err) {
    console.error('Error creating article:', err);
    return NextResponse.json(
      { success: false, error: `Failed to create article: ${err.message}` },
      { status: 500 }
    );
  }
}
