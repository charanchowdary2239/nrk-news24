import { getArticleByIdOrSlug, updateArticle, generateUniqueSlug } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const existing = await getArticleByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    const title = body.title || existing.title;
    let slug = body.slug;
    if (!slug) {
      slug = await generateUniqueSlug(title, id);
    }

    const updated = await updateArticle(id, {
      title,
      slug,
      summary: body.summary || existing.summary,
      content: body.content || existing.content,
      category_id: body.category_id || existing.category_id,
      is_featured: body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : existing.is_featured,
      is_breaking: body.is_breaking !== undefined ? (body.is_breaking ? 1 : 0) : existing.is_breaking,
      tags: body.tags !== undefined ? body.tags : existing.tags,
      status: 'published',
      published_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Article approved and published to public site.',
      article: updated,
    });
  } catch (err) {
    console.error('Error approving AI article:', err);
    return NextResponse.json({ success: false, error: 'Failed to approve article.' }, { status: 500 });
  }
}
