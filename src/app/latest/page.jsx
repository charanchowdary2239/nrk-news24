import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreakingNewsTicker from '@/components/BreakingNewsTicker';
import ArticleCard from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import { Clock, TrendingUp } from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Latest News & Real-Time Headlines | NRK News24',
  description: 'Chronological real-time updates and breaking headlines across India, Andhra Pradesh, Telangana and the world.',
};

function getLatestData() {
  const db = getDb();

  const articles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.status, a.is_featured, a.is_breaking,
      a.published_at, a.created_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 30
  `).all();

  const trending = db.prepare(`
    SELECT 
      a.id, a.title, a.slug,
      c.name as category_name, c.slug as category_slug,
      a.published_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY (a.views * 2 + a.shares * 5) DESC
    LIMIT 5
  `).all();

  return { articles, trending };
}

export default function LatestNewsPage() {
  const { articles, trending } = getLatestData();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <BreakingNewsTicker />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="mb-8 pb-3 border-b-2 border-slate-900 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center font-display">
            <Clock className="w-6 h-6 mr-2 text-red-600" />
            LATEST NEWS STREAM
          </h1>
          <span className="text-xs font-semibold text-slate-500">
            Updated Continuously
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {articles.map((art) => (
                <ArticleCard key={art.id} article={art} variant="standard" />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <AdBanner slot="sidebar" label="Partner Media Space" />

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-3 pb-2 border-b border-slate-200 font-display">
                <TrendingUp className="w-4 h-4 inline mr-1 text-red-600" />
                TRENDING TODAY
              </h3>
              <div className="space-y-1">
                {trending.map((art, idx) => (
                  <ArticleCard key={art.id} article={art} variant="trending" rank={idx + 1} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
