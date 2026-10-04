import { getArticleByIdOrSlug, updateArticle } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const existing = await getArticleByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    await updateArticle(id, { status: 'rejected' });

    return NextResponse.json({
      success: true,
      message: 'Article marked as rejected.',
    });
  } catch (err) {
    console.error('Error rejecting article:', err);
    return NextResponse.json({ success: false, error: 'Failed to reject article.' }, { status: 500 });
  }
}
