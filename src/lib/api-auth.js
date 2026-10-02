const { getAuthenticatedAdmin } = require('./auth');
const { NextResponse } = require('next/server');

/**
 * Middleware function to verify admin authentication in API Route Handlers
 */
function requireAdmin(request) {
  const admin = getAuthenticatedAdmin(request);
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

module.exports = {
  requireAdmin,
};
