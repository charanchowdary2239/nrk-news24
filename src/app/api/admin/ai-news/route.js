import { getAiQueueArticles } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';

    const articles = await getAiQueueArticles(status);

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
    });
  } catch (err) {
    console.error('Error fetching AI news queue:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve AI review queue.' }, { status: 500 });
  }
}
