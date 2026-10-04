import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreakingNewsTicker from '@/components/BreakingNewsTicker';
import ArticleCard from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import { getHomepageData } from '@/lib/db';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, TrendingUp, Compass } from 'lucide-react';

export const revalidate = 0; // Dynamic server rendering for live news

export default async function HomePage() {
  const data = await getHomepageData();


  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header & Navigation */}
      <Header />

      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Top Banner Ad Space */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <AdBanner slot="top_banner" label="NRK News24 Partner Network" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {/* 1. HERO / TOP STORIES SECTION */}
        <section className="mb-12">
          <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-[#0b2545]">
            <h2 className="text-xl sm:text-2xl font-black text-[#0b2545] uppercase tracking-tight flex items-center font-display">
              <Sparkles className="w-5 h-5 mr-2 text-red-600" />
              TOP STORIES
            </h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Curated Editorial Lead
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Featured Article (7 cols) */}
            <div className="lg:col-span-7">
              {data.heroArticle ? (
                <ArticleCard article={data.heroArticle} variant="hero" />
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">No top stories available.</p>
                </div>
              )}
            </div>

            {/* Smaller Top Stories Grid (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 mb-3 border-b border-slate-200 flex items-center">
                  <Flame className="w-3.5 h-3.5 mr-1 text-red-600" />
                  Key Headlines
                </h3>
                <div className="divide-y divide-slate-200">
                  {data.sideFeatured.map((art) => (
                    <ArticleCard key={art.id} article={art} variant="horizontal" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. LATEST & TRENDING DUAL SECTION */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LATEST NEWS COLUMN (8 cols) */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-slate-900">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display flex items-center">
                  <Compass className="w-5 h-5 mr-2 text-[#0b2545]" />
                  LATEST NEWS
                </h2>
                <Link
                  href="/latest"
                  className="text-xs font-bold text-[#0b2545] hover:text-red-600 flex items-center uppercase tracking-wider"
                >
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {data.latestArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} variant="standard" />
                ))}
              </div>
            </div>

            {/* TRENDING NEWS SIDEBAR (4 cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-4 space-y-6">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center font-display">
                      <TrendingUp className="w-4 h-4 mr-2 text-red-600" />
                      TRENDING NOW
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Most Read
                    </span>
                  </div>

                  <div className="space-y-1">
                    {data.trendingArticles.map((art, idx) => (
                      <ArticleCard key={art.id} article={art} variant="trending" rank={idx + 1} />
                    ))}
                  </div>
                </div>

                {/* Sidebar Ad Placement */}
                <AdBanner slot="sidebar" label="Partner Media Space" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. ANDHRA PRADESH & TELANGANA SPOTLIGHT */}
        <section className="mb-12 bg-slate-50 border border-slate-200 p-6 rounded-sm">
          <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-[#0b2545]">
            <h2 className="text-xl font-black text-[#0b2545] uppercase tracking-tight font-display">
              TELUGU STATES SPOTLIGHT — AP & TELANGANA
            </h2>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <Link href="/category/andhra-pradesh" className="text-[#0b2545] hover:underline">
                Andhra Pradesh →
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/category/telangana" className="text-[#0b2545] hover:underline">
                Telangana →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Andhra Pradesh Block */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Andhra Pradesh Headlines
                </h3>
                <Link href="/category/andhra-pradesh" className="text-[11px] font-bold text-red-600 hover:underline">
                  More AP News
                </Link>
              </div>
              <div className="space-y-3">
                {data.apArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} variant="horizontal" />
                ))}
              </div>
            </div>

            {/* Telangana Block */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Telangana Headlines
                </h3>
                <Link href="/category/telangana" className="text-[11px] font-bold text-red-600 hover:underline">
                  More Telangana News
                </Link>
              </div>
              <div className="space-y-3">
                {data.tgArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} variant="horizontal" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. TECHNOLOGY & BUSINESS SECTION */}
        <section className="mb-12">
          <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-slate-900">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display">
              TECH & BUSINESS INTELLIGENCE
            </h2>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <Link href="/category/technology" className="text-[#0b2545] hover:underline">
                Technology
              </Link>
              <span>•</span>
              <Link href="/category/business" className="text-[#0b2545] hover:underline">
                Business
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...data.techArticles.slice(0, 2), ...data.businessArticles.slice(0, 2)].map((art) => (
              <ArticleCard key={art.id} article={art} variant="standard" />
            ))}
          </div>
        </section>
      </main>

      {/* Footer Ad Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mb-6">
        <AdBanner slot="footer" label="NRK News24 Footer Sponsor Slot" />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
