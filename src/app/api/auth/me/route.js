import { getAuthenticatedAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, authenticated: false, admin: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
}
