import { getArticleByIdOrSlug, updateArticle, deleteArticle } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const article = await getArticleByIdOrSlug(id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (err) {
    console.error('Error fetching article:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();

    const existing = await getArticleByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    const updated = await updateArticle(id, body);

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully.',
      article: updated,
    });
  } catch (err) {
    console.error('Error updating article:', err);
    return NextResponse.json(
      { success: false, error: `Failed to update article: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const existing = await getArticleByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    await deleteArticle(id);

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting article:', err);
    return NextResponse.json(
      { success: false, error: `Failed to delete article: ${err.message}` },
      { status: 500 }
    );
  }
}
