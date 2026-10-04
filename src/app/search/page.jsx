'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { Search as SearchIcon, Filter, AlertCircle, Loader2 } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch category list for filter
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // Perform search
  const performSearch = async (q, cat) => {
    if (!q || !q.trim()) {
      setResults([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: q.trim(),
        limit: '30',
      });
      if (cat && cat !== 'all') {
        params.append('category', cat);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialCategory);
    }
  }, [initialQuery, initialCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&category=${selectedCategory}`);
      performSearch(query.trim(), selectedCategory);
    }
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&category=${cat}`);
      performSearch(query.trim(), cat);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      {/* Search Bar & Filters Form */}
      <div className="max-w-3xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0b2545] uppercase tracking-tight text-center mb-6 font-display">
          SEARCH NRK NEWS24
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search news by headline, topic, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-[#0b2545] shadow-sm"
            />
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#0b2545] shadow-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#0b2545] text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Search
            </button>
          </div>
        </form>

        {/* Quick popular search tags */}
        <div className="mt-3 flex items-center justify-center flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-semibold">Popular:</span>
          {['Amaravati', 'Hyderabad', 'ISRO', 'Sensex', 'Cricket', 'AI Technology'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag);
                router.push(`/search?q=${encodeURIComponent(tag)}&category=all`);
                performSearch(tag, 'all');
              }}
              className="hover:text-[#0b2545] hover:underline"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {searched && (
        <div className="mb-6 pb-2 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">
            {loading ? (
              'Searching articles...'
            ) : (
              <>
                Found <span className="text-[#0b2545]">{total}</span> {total === 1 ? 'story' : 'stories'} matching{' '}
                <span className="text-slate-900">"{query}"</span>
              </>
            )}
          </h2>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0b2545] mb-2" />
          <span className="text-sm">Searching digital news archives...</span>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="max-w-md mx-auto py-16 text-center bg-slate-50 border border-slate-200 rounded-sm p-8">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Results Found</h3>
          <p className="text-xs text-slate-500 mb-4">
            We couldn't find any articles matching "{query}". Try checking your spelling or search using a more general keyword.
          </p>
          <div className="text-xs text-slate-600 font-medium">
            Suggestions:
            <ul className="list-disc list-inside mt-2 text-slate-500 text-left max-w-xs mx-auto space-y-1">
              <li>Ensure all words are spelled correctly</li>
              <li>Try different or broader keywords</li>
              <li>Switch category filter to "All Categories"</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading search interface...</div>}>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}
