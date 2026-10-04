import { getAuthenticatedAdmin } from './auth';
import { NextResponse } from 'next/server';

/**
 * Middleware function to verify admin authentication in API Route Handlers
 */
export async function requireAdmin(request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      ),
      admin: null,
    };
  }
  return { errorResponse: null, admin };
}
