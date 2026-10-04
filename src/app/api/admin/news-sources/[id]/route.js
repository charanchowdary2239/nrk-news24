import { updateNewsSource, deleteNewsSource } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();

    const updated = await updateNewsSource(id, body);
    return NextResponse.json({ success: true, message: 'News source updated.', source: updated });
  } catch (err) {
    console.error('Error updating news source:', err);
    return NextResponse.json({ success: false, error: 'Failed to update news source.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    await deleteNewsSource(id);
    return NextResponse.json({ success: true, message: 'News source deleted.' });
  } catch (err) {
    console.error('Error deleting news source:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete news source.' }, { status: 500 });
  }
}
