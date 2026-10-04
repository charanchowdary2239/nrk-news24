'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { Star, ExternalLink, X, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FeaturedNewsManagerPage() {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/articles?featured=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setFeaturedArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Error fetching featured articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  const handleRemoveFeatured = async (articleId) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_featured: false }),
        credentials: 'include',
      });

      if (res.ok) {
        setFeaturedArticles((prev) => prev.filter((a) => a.id !== articleId));
        setMessage({ type: 'success', text: 'Article removed from featured hero section.' });
      }
    } catch (err) {
      console.error('Error removing featured status:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Featured Stories Curator" onRefresh={fetchFeatured} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Featured Stories Manager</h2>
            <p className="text-xs text-slate-500">
              Curate the prominent stories highlighted in the Homepage Hero & Top Stories grid
            </p>
          </div>
          <Link
            href="/admin/articles"
            className="flex items-center px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Pick from All Articles
          </Link>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Currently Featured ({featuredArticles.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0b2545] mb-2" />
                Loading featured stories...
              </div>
            ) : featuredArticles.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No articles are marked as Featured. The homepage will fallback to the newest stories until you feature stories.
              </div>
            ) : (
              featuredArticles.map((art, idx) => (
                <div key={art.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-3 min-w-0 pr-4">
                    <div className="w-7 h-7 rounded-full bg-yellow-50 text-yellow-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold uppercase text-[#0b2545] bg-blue-50 px-1.5 py-0.5 rounded">
                          {art.category_name || 'News'}
                        </span>
                        <span>•</span>
                        <span>By {art.author || 'NRK Bureau'}</span>
                        <span>•</span>
                        <span>{new Date(art.published_at || art.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {art.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Link
                      href={`/news/${art.slug}`}
                      target="_blank"
                      className="p-1.5 text-slate-500 hover:text-[#0b2545] rounded hover:bg-slate-100"
                      title="View Live Story"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleRemoveFeatured(art.id)}
                      className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                      title="Unfeature"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
