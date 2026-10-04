const { NextResponse } = require('next/server');

export async function POST(request) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  response.cookies.delete('nrk_admin_token');
  return response;
}
