'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono font-bold text-red-600 uppercase tracking-widest mb-1">
          System Notice
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display mb-3">
          Unable to Load Content
        </h1>

        <p className="text-sm text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
          We encountered a temporary issue while fetching the requested news content. Our technical desk has been notified. Please try refreshing.
        </p>

        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => reset()}
            className="flex items-center px-4 py-2.5 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors"
          >
            <Home className="w-4 h-4 mr-1.5" />
            Go to Homepage
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
