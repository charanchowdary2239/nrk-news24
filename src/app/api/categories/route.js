import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { slugify } from '@/lib/slugify';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(CASE WHEN a.status = 'published' THEN 1 END) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `).all();

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
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, description, display_order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    const db = getDb();
    let slug = body.slug ? slugify(body.slug) : slugify(name);

    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const order = parseInt(display_order || '0', 10);
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, display_order)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), slug, description || '', order);

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

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
