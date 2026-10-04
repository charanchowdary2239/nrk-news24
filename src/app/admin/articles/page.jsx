'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  FileEdit,
  Loader2
} from 'lucide-react';

function ArticlesManagerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get('status') || 'all';
  const categoryParam = searchParams.get('category') || 'all';

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(statusParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, article: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') params.append('status', activeStatus);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      params.append('limit', '50');

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [activeStatus, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArticles();
  };

  // Toggle Featured status
  const handleToggleFeatured = async (art) => {
    const nextVal = art.is_featured === 1 ? 0 : 1;
    const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_featured: nextVal }),
        credentials: 'include',
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === art.id ? { ...a, is_featured: nextVal } : a))
        );
      }
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
  };

  // Toggle Breaking status
  const handleToggleBreaking = async (art) => {
    const nextVal = art.is_breaking === 1 ? 0 : 1;
    const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_breaking: nextVal }),
        credentials: 'include',
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === art.id ? { ...a, is_breaking: nextVal } : a))
        );
      }
    } catch (err) {
      console.error('Error toggling breaking:', err);
    }
  };

  // Delete article
  const handleDeleteConfirm = async () => {
    if (!deleteModal.article) return;
    setActionLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/articles/${deleteModal.article.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        setDeleteModal({ open: false, article: null });
        fetchArticles();
      } else {
        alert('Failed to delete article.');
      }
    } catch (err) {
      alert('Delete network error.');
    } finally {
      setActionLoading(false);
    }
  };

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
      <AdminHeader title="News Articles Directory" onRefresh={fetchArticles} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Articles Management</h2>
            <p className="text-xs text-slate-500">
              Filter, search, edit, feature, and review newsroom stories
            </p>
          </div>
          <Link
            href="/admin/articles/create"
            className="inline-flex items-center px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Write New Article
          </Link>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Articles' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Drafts' },
              { id: 'pending_review', label: 'Pending AI Review' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`px-3 py-1.5 rounded-sm transition-colors whitespace-nowrap ${
                  activeStatus === tab.id
                    ? 'bg-[#0b2545] text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
              <input
                type="text"
                placeholder="Search articles by headline or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            </form>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0b2545]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchArticles}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded"
              >
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Headline</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-center">Breaking</th>
                  <th className="py-3 px-4 text-center">Views / Shares</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0b2545] mb-2" />
                      Loading articles...
                    </td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No articles match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">
                          {art.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          /news/{art.slug}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {art.category_name || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(art.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(art)}
                          className={`p-1.5 rounded transition-colors ${
                            art.is_featured === 1
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title="Toggle Featured Story"
                        >
                          <Star className={`w-4 h-4 ${art.is_featured === 1 ? 'fill-yellow-500' : ''}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleBreaking(art)}
                          className={`p-1.5 rounded transition-colors ${
                            art.is_breaking === 1
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title="Toggle Breaking Alert"
                        >
                          <Zap className={`w-4 h-4 ${art.is_breaking === 1 ? 'fill-red-600' : ''}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                        {art.views.toLocaleString()} / {art.shares}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {art.published_at
                          ? new Date(art.published_at).toLocaleDateString('en-IN')
                          : new Date(art.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {art.status === 'published' && (
                          <Link
                            href={`/news/${art.slug}`}
                            target="_blank"
                            className="inline-flex p-1.5 text-slate-500 hover:text-[#0b2545] rounded hover:bg-slate-100"
                            title="View Public Story"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/articles/edit/${art.id}`}
                          className="inline-flex p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, article: art })}
                          className="inline-flex p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                          title="Delete"
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
                <h3 className="text-base font-bold text-slate-900">Confirm Article Deletion</h3>
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
                disabled={actionLoading}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArticlesManagerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading articles manager...</div>}>
      <ArticlesManagerContent />
    </Suspense>
  );
}
