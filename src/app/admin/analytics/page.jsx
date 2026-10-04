'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { Eye, Share2, TrendingUp, BarChart3, Award, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/analytics', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Audience Analytics & Performance" onRefresh={fetchAnalytics} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Content Performance Metrics</h2>
          <p className="text-xs text-slate-500">
            Real-time telemetry measuring article readership, viral sharing, and regional category engagement
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0b2545] mb-2" />
            Aggregating newsroom metrics...
          </div>
        ) : !data || !data.hasData ? (
          <div className="py-20 text-center bg-white border border-slate-200 rounded-sm p-8">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No data available yet.</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              As visitors read and share articles across WhatsApp, X, and Facebook, real-time engagement data will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Aggregate Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                  <Eye className="w-4 h-4 mr-1.5 text-blue-600" />
                  Total Article Views
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {data.totalViews.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Logged reads across all stories</div>
              </div>

              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                  <Share2 className="w-4 h-4 mr-1.5 text-cyan-600" />
                  Total Social Shares
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {data.totalShares.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Shares to WhatsApp, X, FB, TG</div>
              </div>

              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Avg. Reads / Story
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {Math.round(data.totalViews / Math.max(1, data.topViewedArticles.length)).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Average story readership</div>
              </div>

              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                  <Award className="w-4 h-4 mr-1.5 text-amber-500" />
                  Top Category
                </div>
                <div className="text-2xl font-black text-[#0b2545] truncate">
                  {data.categoryPerformance?.[0]?.category_name || 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Highest reader engagement</div>
              </div>
            </div>

            {/* Popular Articles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Most Read Articles */}
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1.5 text-blue-600" />
                    Top 10 Most Read Articles
                  </span>
                  <span className="text-[10px] text-slate-400">By Total Views</span>
                </h3>

                <div className="divide-y divide-slate-100">
                  {data.topViewedArticles.map((art, idx) => (
                    <div key={art.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 min-w-0 pr-3">
                        <span className="font-mono font-bold text-slate-400 w-5 text-right">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/news/${art.slug}`}
                            target="_blank"
                            className="font-bold text-slate-800 hover:text-[#0b2545] truncate block"
                          >
                            {art.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {art.category_name}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-blue-700 flex-shrink-0">
                        {art.views.toLocaleString()} views
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Shared Articles */}
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="flex items-center">
                    <Share2 className="w-4 h-4 mr-1.5 text-cyan-600" />
                    Top 10 Most Shared Articles
                  </span>
                  <span className="text-[10px] text-slate-400">By Social Shares</span>
                </h3>

                <div className="divide-y divide-slate-100">
                  {data.topSharedArticles.map((art, idx) => (
                    <div key={art.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 min-w-0 pr-3">
                        <span className="font-mono font-bold text-slate-400 w-5 text-right">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/news/${art.slug}`}
                            target="_blank"
                            className="font-bold text-slate-800 hover:text-[#0b2545] truncate block"
                          >
                            {art.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {art.category_name}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-cyan-700 flex-shrink-0">
                        {art.shares.toLocaleString()} shares
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-4 border-b border-slate-200">
                Audience Engagement by News Category
              </h3>

              <div className="space-y-4">
                {data.categoryPerformance.map((cat) => {
                  const maxViews = data.categoryPerformance[0]?.total_views || 1;
                  const pct = Math.round((cat.total_views / maxViews) * 100);

                  return (
                    <div key={cat.category_slug} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cat.category_name}</span>
                        <span className="font-mono text-slate-500">
                          {cat.total_views.toLocaleString()} views • {cat.total_shares} shares ({cat.published_count} stories)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0b2545] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
