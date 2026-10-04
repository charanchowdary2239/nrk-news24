import { getBreakingNewsData, upsertSetting } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getBreakingNewsData();
    return NextResponse.json({
      success: true,
      enabled: data.enabled,
      items: data.items,
    });
  } catch (err) {
    console.error('Error in /api/breaking:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch breaking news' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { enabled, customTicker } = body;

    if (enabled !== undefined) {
      await upsertSetting('breaking_news_enabled', enabled ? 'true' : 'false');
    }

    if (customTicker !== undefined) {
      await upsertSetting('custom_breaking_ticker', customTicker || '');
    }

    return NextResponse.json({ success: true, message: 'Breaking news ticker settings updated.' });
  } catch (err) {
    console.error('Error updating breaking settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to update breaking ticker.' }, { status: 500 });
  }
}
