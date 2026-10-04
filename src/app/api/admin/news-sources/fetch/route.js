import { requireAdmin } from '@/lib/api-auth';
import { runIngestionTask } from '@/lib/scheduler';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { errorResponse } = requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const result = await runIngestionTask();
    return NextResponse.json({
      success: true,
      message: `News ingestion completed. ${result.itemsIngested} new stories queued for editorial review.`,
      result,
    });
  } catch (err) {
    console.error('Error triggering news fetch:', err);
    return NextResponse.json({
      success: false,
      error: `Failed to trigger ingestion: ${err.message}`,
    }, { status: 500 });
  }
}
