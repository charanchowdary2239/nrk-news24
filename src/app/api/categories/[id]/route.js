import { updateCategory, deleteCategory } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();

    const updated = await updateCategory(id, body);
    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    console.error('Error updating category:', err);
    return NextResponse.json({ success: false, error: 'Failed to update category.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    await deleteCategory(id);
    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete category.' }, { status: 500 });
  }
}
