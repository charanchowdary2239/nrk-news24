'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import RichEditor from '@/components/RichEditor';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  X, 
  Calendar, 
  Tag, 
  Loader2 
} from 'lucide-react';

export default function AiNewsReviewPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_review'); // 'pending_review' | 'rejected'
  const [reviewModal, setReviewModal] = useState({ open: false, article: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal edit states
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsBreaking, setEditIsBreaking] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/ai-news?status=${activeTab}`, {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI news queue:', err);
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
    fetchQueue();
  }, [activeTab]);

  const openReviewModal = (art) => {
    setEditTitle(art.title);
    setEditSummary(art.summary || '');
    setEditContent(art.content || '');
    setEditCategoryId(art.category_id ? art.category_id.toString() : '1');
    setEditIsFeatured(false);
    setEditIsBreaking(false);
    setReviewModal({ open: true, article: art });
  };

  const handleApproveAndPublish = async (articleId, customData = null) => {
    setActionLoading(true);
    setMessage(null);

    const payload = customData || {
      title: editTitle,
      summary: editSummary,
      content: editContent,
      category_id: parseInt(editCategoryId, 10),
      is_featured: editIsFeatured,
      is_breaking: editIsBreaking,
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/ai-news/${articleId}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Story approved and published live: "${data.article?.title}"` });
        setReviewModal({ open: false, article: null });
        fetchQueue();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to approve article.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Approval network communication error.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (articleId) => {
    setActionLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/ai-news/${articleId}/reject`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Article moved to rejected archive.' });
        fetchQueue();
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!confirm('Permanently delete this AI draft?')) return;
    setActionLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Draft permanently deleted.' });
        fetchQueue();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="AI News Review & Approval Desk" onRefresh={fetchQueue} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner Notice */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Bot className="w-4 h-4" />
              <span>Editorial Safeguard Pipeline</span>
            </div>
            <h2 className="text-lg font-bold">Pending Automated Ingestion Queue</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Incoming stories gathered from legitimate news feeds are synthesized by AI into journalistic drafts. Every story requires human editorial review and approval before becoming public.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchQueue}
              className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh Queue
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded text-xs flex items-center ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-red-50 border border-red-300 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('pending_review')}
            className={`px-4 py-2 text-xs font-bold rounded-sm transition-colors ${
              activeTab === 'pending_review'
                ? 'bg-[#0b2545] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Awaiting Editorial Review ({activeTab === 'pending_review' ? articles.length : '...'})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 text-xs font-bold rounded-sm transition-colors ${
              activeTab === 'rejected'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rejected Wire Drafts
          </button>
        </div>

        {/* Queue Grid / List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0b2545] mb-2" />
            Loading AI review items...
          </div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-sm p-8">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {activeTab === 'pending_review'
                ? 'No Pending AI Stories in Queue'
                : 'No Rejected Drafts in Archive'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {activeTab === 'pending_review'
                ? 'The automated ingestion queue is up to date. You can click "Fetch Feeds Now" in the header to check enabled RSS feeds for new stories.'
                : 'Rejected stories will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col lg:flex-row gap-5"
              >
                {/* Image Thumbnail */}
                <div className="lg:w-56 h-36 flex-shrink-0 relative rounded overflow-hidden bg-slate-100">
                  <img
                    src={art.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80'}
                    alt={art.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-[#0b2545] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    {art.category_name || 'General'}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-slate-800 flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-red-500" />
                        Wire Source: {art.source_name || 'RSS Wire Feed'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Ingested: {new Date(art.created_at).toLocaleString('en-IN')}
                      </span>
                      {art.source_url && (
                        <>
                          <span>•</span>
                          <a
                            href={art.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[#0b2545] hover:underline"
                          >
                            Source Link <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 font-editorial">
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {art.summary}
                    </p>

                    {/* Tag chips */}
                    {art.tags && art.tags.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5 mb-3">
                        {art.tags.map((t, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openReviewModal(art)}
                        className="flex items-center px-3.5 py-1.5 bg-blue-50 text-[#0b2545] hover:bg-blue-100 rounded text-xs font-bold transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Review & Edit Content
                      </button>

                      {activeTab === 'pending_review' && (
                        <button
                          onClick={() => handleApproveAndPublish(art.id, {
                            title: art.title,
                            summary: art.summary,
                            content: art.content,
                            category_id: art.category_id || 1,
                            is_featured: false,
                            is_breaking: false,
                          })}
                          disabled={actionLoading}
                          className="flex items-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Approve & Publish Now
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {activeTab === 'pending_review' && (
                        <button
                          onClick={() => handleReject(art.id)}
                          disabled={actionLoading}
                          className="flex items-center px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(art.id)}
                        disabled={actionLoading}
                        className="flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review & Edit Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-[#0b2545] text-white flex items-center justify-between rounded-t-md">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Review & Refine AI Story Draft
                </h3>
              </div>
              <button
                onClick={() => setReviewModal({ open: false, article: null })}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Original Wire Source info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <strong>Original Source:</strong> {reviewModal.article?.source_name}
                </div>
                {reviewModal.article?.source_url && (
                  <a
                    href={reviewModal.article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0b2545] hover:underline flex items-center font-semibold"
                  >
                    Open Wire Article <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 text-sm font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              {/* Category & Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0b2545]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editIsFeatured}
                      onChange={(e) => setEditIsFeatured(e.target.checked)}
                      className="w-4 h-4 text-[#0b2545] rounded"
                    />
                    <span>Mark as Featured</span>
                  </label>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-red-600">
                    <input
                      type="checkbox"
                      checked={editIsBreaking}
                      onChange={(e) => setEditIsBreaking(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span>Mark as Breaking</span>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Executive Summary
                </label>
                <textarea
                  rows={2}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2 text-xs text-slate-800 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Article Body (Formatted Content)
                </label>
                <RichEditor value={editContent} onChange={setEditContent} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-md">
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, article: null })}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleReject(reviewModal.article.id)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-xs font-semibold"
                >
                  Reject Story
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveAndPublish(reviewModal.article.id)}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-sm"
                >
                  {actionLoading ? 'Publishing...' : 'Approve & Publish to Live Site'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
