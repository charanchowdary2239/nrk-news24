import { getAdminStats, getAdminRecentArticles } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const stats = await getAdminStats();
    const recentArticles = await getAdminRecentArticles(8);

    return NextResponse.json({
      success: true,
      stats,
      recentArticles,
    });
  } catch (err) {
    console.error('Error in /api/admin/stats:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve admin stats.' }, { status: 500 });
  }
}
