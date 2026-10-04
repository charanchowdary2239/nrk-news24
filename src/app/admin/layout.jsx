import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth';
import { getAdminStats } from '@/lib/db';
import AdminSidebar from '@/components/AdminSidebar';

export const metadata = {
  title: 'NRK News24 Editorial Admin CMS',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }) {
  const cookieStore = cookies();
  const token = cookieStore.get('nrk_admin_token')?.value;

  // Verify auth
  let isAuthenticated = false;
  let admin = null;
  if (token) {
    admin = verifyAdminToken(token);
    if (admin) {
      isAuthenticated = true;
    }
  }

  // Provide seamless sidebar stats when authenticated:
  let stats = {};
  if (isAuthenticated) {
    try {
      stats = await getAdminStats();
    } catch (e) {
      // safe fallback
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* If authenticated, display sidebar */}
      {isAuthenticated && <AdminSidebar stats={stats} />}

      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
