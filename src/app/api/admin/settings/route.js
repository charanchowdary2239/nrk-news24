import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { initCronScheduler } from '@/lib/scheduler';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all();

    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    const hasAiKey = !!(process.env.AI_API_KEY && process.env.AI_API_KEY.trim());
    settings.has_system_ai_key = hasAiKey;

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { errorResponse, admin } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const db = getDb();

    const allowedKeys = [
      'site_name',
      'site_tagline',
      'site_description',
      'default_author',
      'breaking_news_enabled',
      'custom_breaking_ticker',
      'ads_top_banner_enabled',
      'ads_sidebar_enabled',
      'ads_article_enabled',
      'ads_footer_enabled',
      'cron_enabled',
      'cron_frequency',
      'ai_model',
      'social_twitter',
      'social_facebook',
      'social_telegram',
      'social_whatsapp',
      'social_youtube',
    ];

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        upsert.run(key, String(body[key]));
      }
    }

    if (body.new_password && body.new_password.trim().length >= 6) {
      const hashed = await hashPassword(body.new_password.trim());
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hashed, admin.id);
    }

    if (body.admin_name && body.admin_name.trim()) {
      db.prepare('UPDATE admins SET name = ? WHERE id = ?').run(body.admin_name.trim(), admin.id);
    }

    if (body.cron_enabled !== undefined || body.cron_frequency !== undefined) {
      try {
        initCronScheduler();
      } catch (cronErr) {
        console.warn('Could not reinitialize cron:', cronErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully.',
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to update settings.' }, { status: 500 });
  }
}
