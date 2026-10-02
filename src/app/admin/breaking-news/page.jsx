'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { Zap, Plus, CheckCircle2, AlertCircle, Save, ExternalLink, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BreakingNewsManagerPage() {
  const [breakingArticles, setBreakingArticles] = useState([]);
  const [customTicker, setCustomTicker] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [breakRes, artRes] = await Promise.all([
        fetch('/api/breaking'),
        fetch('/api/articles?breaking=1&limit=50')
      ]);

      if (breakRes.ok) {
        const bData = await breakRes.json();
        setEnabled(bData.enabled ?? true);
        const customItem = bData.items?.find((i) => i.isCustom);
        if (customItem) setCustomTicker(customItem.title);
      }

      if (artRes.ok) {
        const aData = await artRes.json();
        setBreakingArticles(aData.articles || []);
      }
    } catch (err) {
      console.error('Error fetching breaking news data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/breaking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, customTicker }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Breaking news ticker updated successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update ticker settings.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Communication error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBreaking = async (articleId) => {
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_breaking: false }),
      });

      if (res.ok) {
        setBreakingArticles((prev) => prev.filter((a) => a.id !== articleId));
        setMessage({ type: 'success', text: 'Removed from breaking news.' });
      }
    } catch (err) {
      console.error('Error removing breaking status:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Breaking News Control Desk" onRefresh={fetchData} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Breaking News Manager</h2>
          <p className="text-xs text-slate-500">
            Control the top animated breaking news ticker and manage active urgency flags
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Ticker Settings (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1 text-red-600" />
                Global Ticker Controls
              </h3>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Breaking News Ticker</div>
                  <div className="text-[11px] text-slate-500">Display red ticker across all pages</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Custom Alert Marquee Text (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter a custom urgent bulletin, election flash, or meteorological alert..."
                  value={customTicker}
                  onChange={(e) => setCustomTicker(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If set, this custom text will appear in the ticker alongside breaking news headlines.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center py-2 px-4 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? 'Saving...' : 'Save Ticker Configuration'}
              </button>
            </div>
          </div>

          {/* Active Breaking Articles (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Active Breaking Articles ({breakingArticles.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stories currently broadcasting in the breaking news ticker
                  </p>
                </div>
                <Link
                  href="/admin/articles"
                  className="text-xs font-bold text-[#0b2545] hover:underline"
                >
                  Manage All Articles
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading breaking items...</div>
                ) : breakingArticles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No articles are currently flagged as Breaking News. You can flag an article when editing or creating it.
                  </div>
                ) : (
                  breakingArticles.map((art) => (
                    <div key={art.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-0.5">
                          <span className="font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {art.category_name || 'News'}
                          </span>
                          <span>•</span>
                          <span>{new Date(art.published_at || art.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {art.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Link
                          href={`/news/${art.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-[#0b2545] rounded hover:bg-slate-100"
                          title="View Live"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleRemoveBreaking(art.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                          title="Remove from Breaking News"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
