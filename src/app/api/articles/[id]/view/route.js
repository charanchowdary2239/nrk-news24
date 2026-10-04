import { recordArticleView } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const newViews = await recordArticleView(id, clientIp);
    if (newViews === null) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      views: newViews,
    });
  } catch (err) {
    console.error('Error incrementing view:', err);
    return NextResponse.json({ success: false, error: 'Failed to record view' }, { status: 500 });
  }
}
