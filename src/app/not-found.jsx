import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Newspaper, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#0b2545] mb-4">
          <Newspaper className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono font-bold text-red-600 uppercase tracking-widest mb-1">
          Error 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display mb-3">
          Page or Article Not Found
        </h1>

        <p className="text-sm text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
          The story you are looking for may have been archived, renamed, or temporarily moved. You can search our digital archives or browse recent headlines.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center px-4 py-2.5 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
          >
            <Home className="w-4 h-4 mr-1.5" />
            Return to Homepage
          </Link>
          <Link
            href="/search"
            className="flex items-center px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Search Articles
          </Link>
          <Link
            href="/latest"
            className="flex items-center px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors"
          >
            View Latest Stories
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
