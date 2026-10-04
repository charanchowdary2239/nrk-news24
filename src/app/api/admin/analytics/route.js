import { getAnalyticsData } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const analytics = await getAnalyticsData();
    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics.' }, { status: 500 });
  }
}
