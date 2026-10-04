'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  Rss, 
  Plus, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Power, 
  ExternalLink,
  Loader2 
} from 'lucide-react';

export default function NewsSourcesPage() {
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState(null);

  // New source form states
  const [name, setName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srcRes, catRes] = await Promise.all([
        fetch('/api/admin/news-sources'),
        fetch('/api/categories'),
      ]);

      if (srcRes.ok) {
        const sData = await srcRes.json();
        setSources(sData.sources || []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
        if (cData.categories?.length > 0) {
          setCategoryId(cData.categories[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching news sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleEnabled = async (source) => {
    const nextState = source.is_enabled === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/news-sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: nextState }),
      });

      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === source.id ? { ...s, is_enabled: nextState } : s))
        );
      }
    } catch (err) {
      console.error('Error toggling source:', err);
    }
  };

  const handleDelete = async (source) => {
    if (!confirm(`Delete news source "${source.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/news-sources/${source.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== source.id));
        setMessage({ type: 'success', text: 'Source deleted.' });
      }
    } catch (err) {
      console.error('Delete source error:', err);
    }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!name.trim() || !feedUrl.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/news-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          feed_url: feedUrl.trim(),
          category_id: parseInt(categoryId, 10),
          is_enabled: 1,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'News source added successfully.' });
        setModalOpen(false);
        setName('');
        setFeedUrl('');
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add source.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Communication error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchAllNow = async () => {
    setFetching(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/news-sources/fetch', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Success: ${data.result?.itemsIngested || 0} stories queued for review! (${data.result?.itemsSkipped || 0} existing skipped)`,
        });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Fetch failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Fetch error.' });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Approved News Sources & RSS Feeds" onRefresh={fetchData} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Configured Wire Feeds</h2>
            <p className="text-xs text-slate-500">
              Legitimate RSS wire sources monitored by the automated collection scheduler
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleFetchAllNow}
              disabled={fetching}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? 'Ingesting Feeds...' : 'Fetch All Sources Now'}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add News Source
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

        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source Name</th>
                <th className="py-3 px-4">Feed URL</th>
                <th className="py-3 px-4">Target Category</th>
                <th className="py-3 px-4">Last Ingested</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0b2545] mb-2" />
                    Loading news sources...
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No news sources configured. Click "Add News Source" to add an RSS feed.
                  </td>
                </tr>
              ) : (
                sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleEnabled(src)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          src.is_enabled === 1
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle enabled/disabled"
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {src.is_enabled === 1 ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {src.name}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-slate-600">
                      <a
                        href={src.feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#0b2545] hover:underline flex items-center"
                      >
                        <span className="truncate">{src.feed_url}</span>
                        <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {src.category_name || 'General'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {src.last_fetched_at
                        ? new Date(src.last_fetched_at).toLocaleString('en-IN')
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(src)}
                        className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                        title="Delete source"
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
      </main>

      {/* Add News Source Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              Add Approved News Source
            </h3>

            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Source Publisher Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Press Trust of India / The Hindu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  RSS Feed or API URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://.../rss.xml"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Default Target Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0b2545]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add News Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
