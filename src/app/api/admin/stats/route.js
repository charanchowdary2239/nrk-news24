import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const db = getDb();

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_ai,
        COUNT(CASE WHEN is_breaking = 1 AND status = 'published' THEN 1 END) as breaking,
        COUNT(CASE WHEN is_featured = 1 AND status = 'published' THEN 1 END) as featured,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(shares), 0) as total_shares
      FROM articles
    `).get();

    const recentArticles = db.prepare(`
      SELECT 
        a.id, a.title, a.slug, a.status, a.is_featured, a.is_breaking,
        a.published_at, a.created_at, a.views, a.shares,
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 8
    `).all();

    return NextResponse.json({
      success: true,
      stats: {
        totalArticles: stats.total,
        publishedCount: stats.published,
        draftCount: stats.drafts,
        pendingAiCount: stats.pending_ai,
        breakingCount: stats.breaking,
        featuredCount: stats.featured,
        totalViews: stats.total_views,
        totalShares: stats.total_shares,
      },
      recentArticles,
    });
  } catch (err) {
    console.error('Error in /api/admin/stats:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve admin stats.' }, { status: 500 });
  }
}
