import { recordArticleShare } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || 'unknown';

    const newShares = await recordArticleShare(id, platform);
    if (newShares === null) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shares: newShares,
    });
  } catch (err) {
    console.error('Error incrementing share:', err);
    return NextResponse.json({ success: false, error: 'Failed to record share' }, { status: 500 });
  }
}
