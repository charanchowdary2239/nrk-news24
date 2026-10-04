'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import {
  Newspaper,
  CheckCircle2,
  FileEdit,
  Bot,
  Zap,
  Star,
  Eye,
  Share2,
  Plus,
  ArrowRight,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: null, recentArticles: [] });
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, article: null });
  const [deleting, setDeleting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/stats', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.article) return;
    setDeleting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/articles/${deleteModal.article.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        setDeleteModal({ open: false, article: null });
        fetchDashboardData();
      } else {
        alert('Failed to delete article.');
      }
    } catch (err) {
      alert('Network error while deleting article.');
    } finally {
      setDeleting(false);
    }
  };

  const stats = data.stats || {};

  const statCards = [
    { label: 'Total Articles', value: stats.totalArticles ?? 0, icon: Newspaper, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Published Stories', value: stats.publishedCount ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Draft Articles', value: stats.draftCount ?? 0, icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50' },
    {
      label: 'Pending AI Reviews',
      value: stats.pendingAiCount ?? 0,
      icon: Bot,
      color: stats.pendingAiCount > 0 ? 'text-red-600' : 'text-purple-600',
      bg: stats.pendingAiCount > 0 ? 'bg-red-50' : 'bg-purple-50',
      alert: stats.pendingAiCount > 0,
      href: '/admin/ai-news'
    },
    { label: 'Breaking Alerts', value: stats.breakingCount ?? 0, icon: Zap, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Featured Top Stories', value: stats.featuredCount ?? 0, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Total Article Views', value: (stats.totalViews ?? 0).toLocaleString(), icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Social Shares', value: (stats.totalShares ?? 0).toLocaleString(), icon: Share2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Published</span>;
      case 'draft':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Draft</span>;
      case 'pending_review':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">AI Pending</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Newsroom Overview" onRefresh={fetchDashboardData} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome, Editor</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live publishing, AI ingestion pipelines, and newsroom workflows.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/articles/create"
              className="flex items-center px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Write New Article
            </Link>
            {stats.pendingAiCount > 0 && (
              <Link
                href="/admin/ai-news"
                className="flex items-center px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors animate-pulse shadow-sm"
              >
                <Bot className="w-4 h-4 mr-1.5" />
                Review AI Drafts ({stats.pendingAiCount})
              </Link>
            )}
          </div>
        </div>

        {/* 8 Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            const content = (
              <div
                key={idx}
                className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {card.label}
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {loading ? '...' : card.value}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-sm ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );

            return card.href ? (
              <Link key={idx} href={card.href} className="block">
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>

        {/* Recent Articles Table */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Recent Newsroom Articles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest manual creations and approved wire reports
              </p>
            </div>
            <Link
              href="/admin/articles"
              className="text-xs font-bold text-[#0b2545] hover:underline flex items-center"
            >
              View All Articles <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Headline</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created / Published</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading articles data...
                    </td>
                  </tr>
                ) : data.recentArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No articles in database yet. Click "Write New Article" to get started.
                    </td>
                  </tr>
                ) : (
                  data.recentArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 truncate">
                          {art.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          /news/{art.slug}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {art.category_name || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(art.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {art.published_at
                          ? new Date(art.published_at).toLocaleDateString('en-IN')
                          : new Date(art.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {art.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {art.status === 'published' && (
                          <Link
                            href={`/news/${art.slug}`}
                            target="_blank"
                            className="inline-flex p-1.5 text-slate-500 hover:text-[#0b2545] rounded hover:bg-slate-100"
                            title="Preview Public Article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/articles/edit/${art.id}`}
                          className="inline-flex p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                          title="Edit Article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, article: art })}
                          className="inline-flex p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setDeleteModal({ open: false, article: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-xs text-slate-500">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete this article?
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-900 mb-6">
              "{deleteModal.article?.title}"
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ open: false, article: null })}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
