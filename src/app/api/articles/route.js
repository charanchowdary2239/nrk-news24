import { getArticles } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';
    const featured = searchParams.get('featured');
    const breaking = searchParams.get('breaking');
    const sort = searchParams.get('sort') || 'latest';
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '12';
    const offset = searchParams.get('offset') || '0';

    const result = await getArticles({
      category,
      status,
      featured,
      breaking,
      sort,
      q,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Error in /api/articles:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles.' },
      { status: 500 }
    );
  }
}
