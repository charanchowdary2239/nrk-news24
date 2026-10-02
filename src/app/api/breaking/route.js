import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const enabledSetting = db.prepare("SELECT value FROM settings WHERE key = 'breaking_news_enabled'").get();
    const customTickerSetting = db.prepare("SELECT value FROM settings WHERE key = 'custom_breaking_ticker'").get();

    const isEnabled = enabledSetting ? enabledSetting.value === 'true' : true;
    const customTicker = customTickerSetting ? customTickerSetting.value : '';

    if (!isEnabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        items: [],
      });
    }

    const breakingArticles = db.prepare(`
      SELECT 
        a.id, a.title, a.slug, a.published_at,
        c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.is_breaking = 1 AND a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT 6
    `).all();

    const items = [];
    if (customTicker && customTicker.trim()) {
      items.push({
        id: 'custom-alert',
        title: customTicker.trim(),
        slug: null,
        isCustom: true,
      });
    }

    breakingArticles.forEach((art) => {
      items.push({
        id: art.id,
        title: art.title,
        slug: art.slug,
        category: art.category_name,
        isCustom: false,
      });
    });

    return NextResponse.json({
      success: true,
      enabled: true,
      items,
    });
  } catch (err) {
    console.error('Error in /api/breaking:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch breaking news' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { enabled, customTicker } = body;
    const db = getDb();

    if (enabled !== undefined) {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES ('breaking_news_enabled', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(enabled ? 'true' : 'false');
    }

    if (customTicker !== undefined) {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES ('custom_breaking_ticker', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(customTicker || '');
    }

    return NextResponse.json({ success: true, message: 'Breaking news ticker settings updated.' });
  } catch (err) {
    console.error('Error updating breaking settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to update breaking ticker.' }, { status: 500 });
  }
}
