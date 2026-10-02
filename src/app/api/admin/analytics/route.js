import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const db = getDb();

    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(shares), 0) as total_shares,
        (SELECT COUNT(*) FROM article_views) as logged_view_events,
        (SELECT COUNT(*) FROM article_shares) as logged_share_events
      FROM articles
    `).get();

    const topViewedArticles = db.prepare(`
      SELECT 
        a.id, a.title, a.slug, a.views, a.shares, a.published_at,
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published' AND a.views > 0
      ORDER BY a.views DESC
      LIMIT 10
    `).all();

    const topSharedArticles = db.prepare(`
      SELECT 
        a.id, a.title, a.slug, a.views, a.shares, a.published_at,
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published' AND a.shares > 0
      ORDER BY a.shares DESC
      LIMIT 10
    `).all();

    const categoryPerformance = db.prepare(`
      SELECT 
        c.name as category_name,
        c.slug as category_slug,
        COUNT(a.id) as published_count,
        COALESCE(SUM(a.views), 0) as total_views,
        COALESCE(SUM(a.shares), 0) as total_shares
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
      GROUP BY c.id
      HAVING total_views > 0 OR total_shares > 0 OR published_count > 0
      ORDER BY total_views DESC
    `).all();

    const sharePlatforms = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM article_shares
      GROUP BY platform
      ORDER BY count DESC
    `).all();

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews: totals.total_views,
        totalShares: totals.total_shares,
        loggedViewEvents: totals.logged_view_events,
        loggedShareEvents: totals.logged_share_events,
        hasData: totals.total_views > 0 || totals.total_shares > 0,
        topViewedArticles,
        topSharedArticles,
        categoryPerformance,
        sharePlatforms,
      },
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics.' }, { status: 500 });
  }
}
