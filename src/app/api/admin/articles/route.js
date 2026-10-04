import { createArticle, generateUniqueSlug } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { errorResponse, admin } = await requireAdmin(request);
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

    const slug = body.slug ? await generateUniqueSlug(body.slug) : await generateUniqueSlug(title);

    const created = await createArticle({
      title: title.trim(),
      slug,
      summary: summary ? summary.trim() : '',
      content,
      featured_image: featured_image || null,
      category_id: category_id || 1,
      tags: tags || [],
      author: author || admin.name || 'NRK Bureau',
      source_name: source_name || null,
      source_url: source_url || null,
      status,
      is_featured: is_featured ? 1 : 0,
      is_breaking: is_breaking ? 1 : 0,
    });

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
