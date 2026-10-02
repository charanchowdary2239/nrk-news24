import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { slugify } from '@/lib/slugify';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();
    const { name, slug, description, display_order } = body;

    const db = getDb();
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Category not found.' }, { status: 404 });
    }

    const cleanSlug = slug ? slugify(slug) : (name ? slugify(name) : undefined);

    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        display_order = COALESCE(?, display_order)
      WHERE id = ?
    `).run(
      name,
      cleanSlug,
      description,
      display_order !== undefined ? parseInt(display_order, 10) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    console.error('Error updating category:', err);
    return NextResponse.json({ success: false, error: 'Failed to update category.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const db = getDb();

    const articleCount = db.prepare('SELECT COUNT(*) as cnt FROM articles WHERE category_id = ?').get(id).cnt;
    if (articleCount > 0) {
      db.prepare('UPDATE articles SET category_id = 1 WHERE category_id = ?').run(id);
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete category.' }, { status: 500 });
  }
}
