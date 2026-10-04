import { getSettings, upsertSetting, updateAdmin } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { initCronScheduler } from '@/lib/scheduler';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const settings = await getSettings();
    const hasAiKey = !!(process.env.AI_API_KEY && process.env.AI_API_KEY.trim());
    settings.has_system_ai_key = hasAiKey;

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { errorResponse, admin } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

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

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await upsertSetting(key, String(body[key]));
      }
    }

    if (body.new_password && body.new_password.trim().length >= 6) {
      const hashed = await hashPassword(body.new_password.trim());
      await updateAdmin(admin.id, { password_hash: hashed });
    }

    if (body.admin_name && body.admin_name.trim()) {
      await updateAdmin(admin.id, { name: body.admin_name.trim() });
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
