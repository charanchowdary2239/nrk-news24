'use client';

import { useState } from 'react';
import { RefreshCw, ExternalLink, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminHeader({ title = 'Editorial Dashboard', onRefresh = null }) {
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState(null);

  const handleManualFetch = async () => {
    setFetching(true);
    setFetchMessage(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/news-sources/fetch', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setFetchMessage({
          type: 'success',
          text: `Success: ${data.result?.itemsIngested || 0} stories queued for review!`,
        });
        if (onRefresh) onRefresh();
      } else {
        setFetchMessage({ type: 'error', text: data.error || 'Fetch failed' });
      }
    } catch (err) {
      setFetchMessage({ type: 'error', text: err.message });
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMessage(null), 5000);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-black text-slate-900 tracking-tight font-display">
          {title}
        </h1>
        {fetchMessage && (
          <div
            className={`flex items-center text-xs px-2.5 py-1 rounded border ${
              fetchMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
          >
            {fetchMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
            )}
            {fetchMessage.text}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Ingestion Trigger */}
        <button
          onClick={handleManualFetch}
          disabled={fetching}
          className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors disabled:opacity-50"
          title="Fetch latest stories from all enabled RSS feeds now"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fetching ? 'animate-spin text-red-600' : 'text-slate-600'}`} />
          {fetching ? 'Fetching Feeds...' : 'Fetch Feeds Now'}
        </button>

        {/* View Public Site Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center px-3 py-1.5 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          View Live Site
        </Link>

        {/* Admin Badge */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0b2545] font-black text-xs flex items-center justify-center border border-blue-200">
            ED
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-none">Editor-in-Chief</div>
            <div className="text-[10px] text-slate-500 font-mono">admin@nrknews24.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}
