import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';

    const db = getDb();
    const articles = db.prepare(`
      SELECT 
        a.id, a.title, a.slug, a.summary, a.content, a.featured_image,
        a.category_id, c.name as category_name, c.slug as category_slug,
        a.tags, a.author, a.source_name, a.source_url,
        a.status, a.created_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = ?
      ORDER BY a.created_at DESC
    `).all(status);

    const formatted = articles.map((art) => {
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
      articles: formatted,
      count: formatted.length,
    });
  } catch (err) {
    console.error('Error fetching AI news queue:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve AI review queue.' }, { status: 500 });
  }
}
