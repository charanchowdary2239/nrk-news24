'use client';

import { useState, useMemo } from 'react';
import ArticleCard from '@/components/ArticleCard';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, RefreshCw } from 'lucide-react';

export default function CategoryArticleList({ initialArticles = [], categoryName = '' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [pageSize] = useState(6);
  const [displayCount, setDisplayCount] = useState(6);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let list = [...initialArticles];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((art) => {
        const titleMatch = art.title?.toLowerCase().includes(q);
        const summaryMatch = art.summary?.toLowerCase().includes(q);
        const tagMatch = art.tags?.toLowerCase().includes(q);
        return titleMatch || summaryMatch || tagMatch;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'popular') {
        const aScore = (a.views || 0) * 2 + (a.shares || 0) * 5;
        const bScore = (b.views || 0) * 2 + (b.shares || 0) * 5;
        return bScore - aScore;
      }
      if (sortBy === 'shares') {
        return (b.shares || 0) - (a.shares || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.published_at || a.created_at) - new Date(b.published_at || b.created_at);
      }
      // default 'latest'
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });

    return list;
  }, [initialArticles, searchQuery, sortBy]);

  const visibleArticles = filteredArticles.slice(0, displayCount);
  const hasMore = displayCount < filteredArticles.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Category Search & Filter Toolbar */}
      <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Filter ${categoryName} stories...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayCount(pageSize); // reset pagination on search
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-[#0b2545] text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <label htmlFor="cat-sort" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            Sort:
          </label>
          <select
            id="cat-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-300 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#0b2545]"
          >
            <option value="latest">Latest First</option>
            <option value="popular">Most Popular</option>
            <option value="shares">Most Shared</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <span className="font-bold text-slate-800">{visibleArticles.length}</span> of{' '}
          <span className="font-bold text-slate-800">{filteredArticles.length}</span> articles
        </span>
        {searchQuery && (
          <span className="text-slate-600">
            Filtered by: &ldquo;<span className="font-semibold text-[#0b2545]">{searchQuery}</span>&rdquo;
          </span>
        )}
      </div>

      {/* Article Cards Grid */}
      {visibleArticles.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-sm">
          <p className="text-sm font-semibold text-slate-600">No articles match your filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSortBy('latest');
            }}
            className="mt-3 text-xs font-bold text-red-600 hover:underline"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visibleArticles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" />
          ))}
        </div>
      )}

      {/* Pagination / Load More Button */}
      {hasMore && (
        <div className="pt-6 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="inline-flex items-center px-6 py-2.5 bg-[#0b2545] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-colors"
          >
            <ChevronDown className="w-4 h-4 mr-1.5" />
            Load More Stories ({filteredArticles.length - visibleArticles.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
