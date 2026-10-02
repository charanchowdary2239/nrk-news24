import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import AdminSidebar from '@/components/AdminSidebar';

export const metadata = {
  title: 'NRK News24 Editorial Admin CMS',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
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

  // If not authenticated, we let the page handle login or redirect in page components
  // But to provide seamless sidebar stats when authenticated:
  let stats = {};
  if (isAuthenticated) {
    try {
      const db = getDb();
      const counts = db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
          COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_ai,
          COUNT(CASE WHEN is_breaking = 1 AND status = 'published' THEN 1 END) as breaking,
          COUNT(CASE WHEN is_featured = 1 AND status = 'published' THEN 1 END) as featured
        FROM articles
      `).get();

      stats = {
        totalArticles: counts?.total || 0,
        draftCount: counts?.drafts || 0,
        pendingAiCount: counts?.pending_ai || 0,
        breakingCount: counts?.breaking || 0,
        featuredCount: counts?.featured || 0,
      };
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
