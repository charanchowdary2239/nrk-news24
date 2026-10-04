import { searchArticles } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'relevance';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const result = await searchArticles({
      query,
      category,
      sort,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Error in /api/search:', err);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
