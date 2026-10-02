import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 });
    }

    db.prepare("UPDATE articles SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    return NextResponse.json({
      success: true,
      message: 'Article marked as rejected.',
    });
  } catch (err) {
    console.error('Error rejecting article:', err);
    return NextResponse.json({ success: false, error: 'Failed to reject article.' }, { status: 500 });
  }
}
