import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreakingNewsTicker from '@/components/BreakingNewsTicker';
import ShareButtons from '@/components/ShareButtons';
import ArticleCard from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import ArticleViewTracker from './ArticleViewTracker';
import { getArticleDetailData, getArticleByIdOrSlug } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  User, 
  Calendar, 
  Tag, 
  ExternalLink, 
  ChevronRight, 
  Eye, 
  Share2, 
  ShieldCheck 
} from 'lucide-react';

export const revalidate = 0; // Dynamic server rendering for live updates

// Generate Dynamic SEO Metadata (Open Graph & Twitter Cards)
export async function generateMetadata({ params }) {
  const { slug } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const article = await getArticleByIdOrSlug(slug);

  if (!article || article.status !== 'published') {
    return {
      title: 'Article Not Found | NRK News24',
      description: 'The requested news story could not be found.',
    };
  }

  const canonicalUrl = `${siteUrl}/news/${slug}`;
  const imageUrl = article.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${article.title} — NRK News24`,
      description: article.summary,
      url: canonicalUrl,
      siteName: 'NRK News24',
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [article.author || 'NRK Bureau'],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} — NRK News24`,
      description: article.summary,
      site: '@nrknews24',
      creator: '@nrknews24',
      images: [imageUrl],
    },
  };
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ArticlePage({ params }) {
  const { slug } = params;
  const data = await getArticleDetailData(slug);


  if (!data || !data.article) {
    notFound();
  }

  const { article, relatedArticles, trendingArticles } = data;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Background View Tracking Ping */}
      <ArticleViewTracker slug={article.slug} />

      {/* Header & Navigation */}
      <Header />

      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Breadcrumb Navigation */}
      <div className="bg-slate-50 border-b border-slate-200 py-2.5 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center flex-wrap gap-1">
          <Link href="/" className="hover:text-[#0b2545]">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href={`/category/${article.category_slug}`} className="hover:text-[#0b2545] font-semibold text-[#0b2545] uppercase">
            {article.category_name}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-700 truncate max-w-xs sm:max-w-md">{article.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ARTICLE CONTENT (8 cols) */}
          <article className="lg:col-span-8">
            {/* Category Badge & Breaking Flag */}
            <div className="flex items-center space-x-2 mb-3">
              <Link
                href={`/category/${article.category_slug}`}
                className="bg-[#0b2545] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm hover:bg-red-600 transition-colors"
              >
                {article.category_name}
              </Link>
              {article.is_breaking === 1 && (
                <span className="bg-red-600 text-white text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-sm animate-pulse">
                  BREAKING NEWS
                </span>
              )}
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4 font-editorial">
              {article.title}
            </h1>

            {/* Sub-headline / Executive Summary */}
            {article.summary && (
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-serif italic mb-6 border-l-4 border-slate-300 pl-4 bg-slate-50 py-2">
                {article.summary}
              </p>
            )}

            {/* Byline & Timestamps */}
            <div className="flex flex-wrap items-center justify-between py-3 border-y border-slate-200 text-xs text-slate-600 mb-6 gap-2">
              <div className="flex items-center space-x-4">
                <span className="flex items-center font-semibold text-slate-900">
                  <User className="w-3.5 h-3.5 mr-1 text-[#0b2545]" />
                  {article.author || 'NRK Bureau'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Published: {formatFullDate(article.published_at)}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-slate-500">
                {article.views > 0 && (
                  <span className="flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {article.views.toLocaleString()} views
                  </span>
                )}
                {article.shares > 0 && (
                  <span className="flex items-center">
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    {article.shares} shares
                  </span>
                )}
              </div>
            </div>

            {/* Primary Share Buttons (Top of Article) */}
            <ShareButtons article={article} />

            {/* Featured Image */}
            {article.featured_image && (
              <figure className="my-6">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-slate-100 shadow-sm">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {article.source_name && (
                  <figcaption className="text-[11px] text-slate-500 mt-2 text-right">
                    Photo / Source Credit: {article.source_name}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Full Formatted Article Content */}
            <div
              className="article-body font-serif text-slate-800"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Source Attribution Box */}
            {article.source_name && (
              <div className="my-8 p-4 bg-slate-50 border border-slate-200 rounded-sm flex items-start space-x-3 text-xs text-slate-600">
                <ShieldCheck className="w-5 h-5 text-[#0b2545] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Editorial Attribution & Wire Disclosure</h4>
                  <p>
                    Reported and verified for NRK News24. Wire information contributed by{' '}
                    <span className="font-semibold text-slate-800">{article.source_name}</span>.
                  </p>
                  {article.source_url && (
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#0b2545] hover:underline mt-1 font-medium"
                    >
                      Original Wire Feed <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Article Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="my-6 pt-4 border-t border-slate-200 flex items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center mr-2">
                  <Tag className="w-3.5 h-3.5 mr-1" /> Tags:
                </span>
                {article.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="text-xs bg-slate-100 hover:bg-[#0b2545] hover:text-white text-slate-700 px-3 py-1 rounded-full transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Secondary Share Buttons (Bottom of Article) */}
            <div className="pt-4 border-t border-slate-200">
              <ShareButtons article={article} />
            </div>

            {/* In-Article Advertisement Slot */}
            <AdBanner slot="in_article" label="Editorial Content Sponsor" />

            {/* Related News Section */}
            {relatedArticles && relatedArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t-2 border-slate-900">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 font-display">
                  RELATED STORIES IN {article.category_name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedArticles.map((rel) => (
                    <ArticleCard key={rel.id} article={rel} variant="standard" />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* SIDEBAR (4 cols) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Sidebar Ad Placement */}
            <AdBanner slot="sidebar" label="Partner Sponsor Slot" />

            {/* Trending News Widget */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display">
                  TRENDING TODAY
                </h3>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  Live Ranking
                </span>
              </div>
              <div className="space-y-1">
                {trendingArticles.map((art, idx) => (
                  <ArticleCard key={art.id} article={art} variant="trending" rank={idx + 1} />
                ))}
              </div>
            </div>

            {/* Quick Category Navigation */}
            <div className="border border-slate-200 p-5 rounded-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 pb-2 mb-3 border-b border-slate-200">
                Explore More Topics
              </h3>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  'Andhra Pradesh', 'Telangana', 'India', 'World',
                  'Politics', 'Technology', 'Business', 'Sports',
                  'Entertainment', 'Education'
                ].map((name) => {
                  const s = name.toLowerCase().replace(' ', '-');
                  return (
                    <Link
                      key={s}
                      href={`/category/${s}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#0b2545] hover:text-white rounded text-slate-700 transition-colors"
                    >
                      {name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
