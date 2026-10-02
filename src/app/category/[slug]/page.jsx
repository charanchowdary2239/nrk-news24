import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreakingNewsTicker from '@/components/BreakingNewsTicker';
import ArticleCard from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Filter, Sparkles, Inbox } from 'lucide-react';
import CategoryArticleList from './CategoryArticleList';

export const revalidate = 0;

function getCategoryData(slug) {
  const db = getDb();

  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  if (!category) return null;

  // Articles for this category
  const articles = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.featured_image,
      a.category_id, c.name as category_name, c.slug as category_slug,
      a.tags, a.author, a.status, a.is_featured, a.is_breaking,
      a.published_at, a.created_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.category_id = ? AND a.status = 'published'
    ORDER BY a.published_at DESC
  `).all(category.id);

  // Trending in this category or overall
  const trending = db.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.category_id,
      c.name as category_name, c.slug as category_slug,
      a.published_at, a.views, a.shares
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY (a.views * 2 + a.shares * 5) DESC
    LIMIT 5
  `).all();

  return {
    category,
    articles,
    trending,
  };
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  const db = getDb();
  const category = db.prepare('SELECT name, description FROM categories WHERE slug = ?').get(slug);

  if (!category) {
    return { title: 'Category Not Found | NRK News24' };
  }

  return {
    title: `${category.name} News — Latest Updates & Analysis`,
    description: category.description || `Read breaking and in-depth news stories from ${category.name} on NRK News24.`,
    openGraph: {
      title: `${category.name} News — NRK News24`,
      description: category.description || `Read verified reporting from ${category.name}.`,
    },
  };
}

export default function CategoryPage({ params }) {
  const { slug } = params;
  const data = getCategoryData(slug);

  if (!data || !data.category) {
    notFound();
  }

  const { category, articles, trending } = data;
  const featuredArticle = articles.find((a) => a.is_featured === 1) || articles[0];
  const remainingArticles = featuredArticle
    ? articles.filter((a) => a.id !== featuredArticle.id)
    : articles;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <BreakingNewsTicker />

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200 py-2 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center space-x-1.5">
          <Link href="/" className="hover:text-[#0b2545]">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-[#0b2545] font-bold uppercase">{category.name}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* Category Header */}
        <div className="mb-8 pb-4 border-b-2 border-[#0b2545] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0b2545] uppercase tracking-tight font-display">
              {category.name} NEWS
            </h1>
            {category.description && (
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                {category.description}
              </p>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing {articles.length} verified {articles.length === 1 ? 'article' : 'articles'}
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 border border-slate-200 rounded-sm">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Articles In This Category Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check back shortly or visit our home page for the latest breaking news.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-xs font-bold bg-[#0b2545] text-white px-4 py-2 rounded-sm"
            >
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content (8 cols) */}
            <div className="lg:col-span-8">
              {/* Category Featured Story */}
              {featuredArticle && (
                <div className="mb-8">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Featured in {category.name}
                  </div>
                  <ArticleCard article={featuredArticle} variant="hero" />
                </div>
              )}

              {/* Feed of remaining articles */}
              {remainingArticles.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 pb-2 mb-4 border-b border-slate-200">
                    Latest {category.name} Stories
                  </h3>
                  <CategoryArticleList
                    initialArticles={remainingArticles}
                    categoryName={category.name}
                  />
                </div>
              )}
            </div>

            {/* Sidebar (4 cols) */}
            <aside className="lg:col-span-4 space-y-8">
              <AdBanner slot="sidebar" label="Partner Media Space" />

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-3 pb-2 border-b border-slate-200 font-display">
                  TRENDING HEADLINES
                </h3>
                <div className="space-y-1">
                  {trending.map((art, idx) => (
                    <ArticleCard key={art.id} article={art} variant="trending" rank={idx + 1} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
