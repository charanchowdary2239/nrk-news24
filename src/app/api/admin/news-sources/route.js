import { getNewsSources, createNewsSource } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const sources = await getNewsSources();
    return NextResponse.json({ success: true, sources });
  } catch (err) {
    console.error('Error fetching sources:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch sources.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, feed_url, category_id, is_enabled } = body;

    if (!name || !feed_url) {
      return NextResponse.json({ success: false, error: 'Source name and feed URL are required.' }, { status: 400 });
    }

    const created = await createNewsSource({
      name,
      feed_url,
      category_id,
      is_enabled,
    });

    return NextResponse.json({ success: true, message: 'News source added successfully.', source: created });
  } catch (err) {
    console.error('Error adding news source:', err);
    return NextResponse.json({ success: false, error: 'Failed to add news source.' }, { status: 500 });
  }
}
