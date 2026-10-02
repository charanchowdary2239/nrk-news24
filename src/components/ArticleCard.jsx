'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Share2, ArrowRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor((now - date) / (1000 * 60)));
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticleCard({ article, variant = 'standard', rank = null }) {
  if (!article) return null;

  const fallbackImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
  const imageUrl = article.featured_image || fallbackImage;
  const categoryName = article.category_name || 'News';
  const categorySlug = article.category_slug || 'india';
  const articleUrl = `/news/${article.slug}`;

  // 1. HERO VARIANT (Main Featured Story)
  if (variant === 'hero') {
    return (
      <article className="group relative flex flex-col bg-white border border-slate-200 rounded-sm overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={article.title}
            loading="eager"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <Link
              href={`/category/${categorySlug}`}
              className="bg-[#0b2545] text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm hover:bg-red-600 transition-colors"
            >
              {categoryName}
            </Link>
            {article.is_breaking === 1 && (
              <span className="bg-red-600 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded-sm animate-pulse">
                BREAKING
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-1">
          <div className="flex items-center space-x-3 text-xs text-slate-500 mb-2">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {formatDate(article.published_at || article.created_at)}
            </span>
            <span>•</span>
            <span>By {article.author || 'NRK Bureau'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 group-hover:text-[#0b2545] transition-colors leading-tight mb-3 font-editorial">
            <Link href={articleUrl}>{article.title}</Link>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4 flex-1">
            {article.summary}
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-slate-500">
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

            <Link
              href={articleUrl}
              className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#0b2545] hover:text-red-600 transition-colors"
            >
              Read Full Story <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // 2. HORIZONTAL VARIANT (for lists or side-by-side)
  if (variant === 'horizontal') {
    return (
      <article className="group flex gap-4 bg-white p-3 border-b border-slate-200 hover:bg-slate-50 transition-colors">
        <div className="w-28 sm:w-36 h-20 sm:h-24 flex-shrink-0 relative overflow-hidden rounded-sm bg-slate-100">
          <img
            src={imageUrl}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center space-x-2 text-[11px] mb-1">
              <Link
                href={`/category/${categorySlug}`}
                className="font-bold uppercase tracking-wider text-[#0b2545] hover:underline"
              >
                {categoryName}
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">{formatDate(article.published_at || article.created_at)}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0b2545] line-clamp-2 leading-snug">
              <Link href={articleUrl}>{article.title}</Link>
            </h3>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>By {article.author || 'NRK Bureau'}</span>
            <Link href={articleUrl} className="text-[#0b2545] font-semibold hover:underline">
              Read More
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // 3. TRENDING RANKED VARIANT
  if (variant === 'trending') {
    return (
      <article className="group flex items-start space-x-3.5 py-3 border-b border-slate-100 last:border-none">
        {rank !== null && (
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-black text-lg text-slate-400 group-hover:text-red-600 font-mono transition-colors">
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 text-[11px] mb-1">
            <Link
              href={`/category/${categorySlug}`}
              className="text-[#0b2545] font-bold uppercase tracking-wider hover:underline"
            >
              {categoryName}
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">{formatDate(article.published_at || article.created_at)}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0b2545] line-clamp-2 leading-snug">
            <Link href={articleUrl}>{article.title}</Link>
          </h4>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1.5">
            {article.views > 0 && <span>{article.views.toLocaleString()} views</span>}
            {article.shares > 0 && <span>• {article.shares} shares</span>}
          </div>
        </div>
      </article>
    );
  }

  // 4. COMPACT VARIANT
  if (variant === 'compact') {
    return (
      <article className="group py-2.5 border-b border-slate-100 last:border-none">
        <div className="flex items-center space-x-2 text-[11px] mb-1">
          <Link
            href={`/category/${categorySlug}`}
            className="text-red-600 font-bold uppercase tracking-wider hover:underline"
          >
            {categoryName}
          </Link>
          <span className="text-slate-400">•</span>
          <span className="text-slate-400">{formatDate(article.published_at || article.created_at)}</span>
        </div>
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0b2545] line-clamp-2 leading-snug">
          <Link href={articleUrl}>{article.title}</Link>
        </h4>
      </article>
    );
  }

  // 5. STANDARD CARD VARIANT (Default)
  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5">
          <Link
            href={`/category/${categorySlug}`}
            className="bg-[#0b2545] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm hover:bg-red-600 transition-colors"
          >
            {categoryName}
          </Link>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-2">
          <Clock className="w-3 h-3" />
          <span>{formatDate(article.published_at || article.created_at)}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0b2545] transition-colors line-clamp-2 leading-snug mb-2 font-editorial">
          <Link href={articleUrl}>{article.title}</Link>
        </h3>

        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
          {article.summary}
        </p>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate max-w-[120px]">
            {article.author || 'NRK Bureau'}
          </span>
          <Link
            href={articleUrl}
            className="text-[#0b2545] font-bold hover:text-red-600 transition-colors"
          >
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}
