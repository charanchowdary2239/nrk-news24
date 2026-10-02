'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  PlusCircle,
  FileEdit,
  Bot,
  FolderTree,
  Zap,
  Star,
  Rss,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink
} from 'lucide-react';

export default function AdminSidebar({ stats = {} }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All News', href: '/admin/articles', icon: Newspaper, count: stats.totalArticles },
    { label: 'Add News', href: '/admin/articles/create', icon: PlusCircle },
    { label: 'Drafts', href: '/admin/articles?status=draft', icon: FileEdit, count: stats.draftCount },
    { label: 'AI News Review', href: '/admin/ai-news', icon: Bot, count: stats.pendingAiCount, alert: stats.pendingAiCount > 0 },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Breaking News', href: '/admin/breaking-news', icon: Zap, count: stats.breakingCount },
    { label: 'Featured News', href: '/admin/featured-news', icon: Star, count: stats.featuredCount },
    { label: 'News Sources', href: '/admin/news-sources', icon: Rss },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#06172c] text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <span className="bg-red-600 text-white font-black text-sm px-2 py-0.5 rounded-sm shadow-sm">
            NRK
          </span>
          <span className="text-lg font-black tracking-tight text-white font-display">
            NEWS24 <span className="text-[11px] font-sans text-slate-400 font-semibold">CMS</span>
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Newsroom Core
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href.includes('?') && pathname === item.href.split('?')[0]);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-900/60 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.alert
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <span className="flex items-center">
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            Live News Portal
          </span>
          <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">View</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-md transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Logout from Newsroom
        </button>
      </div>
    </aside>
  );
}
