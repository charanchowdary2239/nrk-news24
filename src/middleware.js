import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  let token = request.cookies.get('nrk_admin_token')?.value;

  // Fallback to raw Cookie header if request.cookies is empty
  if (!token) {
    const rawCookie = request.headers.get('cookie');
    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)nrk_admin_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // Fallback to Authorization: Bearer <token>
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    // If accessing login page
    if (pathname === '/admin/login') {
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Any other /admin route: redirect to /admin/login if unauthenticated
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin routes
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
