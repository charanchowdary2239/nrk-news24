import { getCategories, createCategory } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, description, display_order, slug } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    const created = await createCategory({
      name,
      description,
      display_order,
      slug,
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully.',
      category: created,
    });
  } catch (err) {
    console.error('Error creating category:', err);
    return NextResponse.json({ success: false, error: 'Failed to create category.' }, { status: 500 });
  }
}
