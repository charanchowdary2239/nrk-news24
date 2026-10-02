'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Zap } from 'lucide-react';

export default function BreakingNewsTicker({ initialItems = null }) {
  const defaultItems = initialItems || [
    {
      id: 'default-1',
      title: 'Amaravati High-Speed Rail & Port Expressway Corridor Approved by Center',
      slug: 'amaravati-high-speed-rail-and-port-expressway-corridor-approved',
      category: 'Andhra Pradesh',
      isCustom: false,
    },
    {
      id: 'default-2',
      title: 'India Seals Spectacular Series Triumph with Dominant Performance in Final Test',
      slug: 'india-seals-spectacular-series-triumph-final-test',
      category: 'Sports',
      isCustom: false,
    }
  ];

  const [tickerData, setTickerData] = useState({
    enabled: true,
    items: defaultItems,
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchBreaking() {
      try {
        const res = await fetch('/api/breaking');
        if (res.ok) {
          const data = await res.json();
          if (data && data.items && data.items.length > 0) {
            setTickerData(data);
          }
        }
      } catch (err) {
        console.error('Failed to load breaking news:', err);
      }
    }

    fetchBreaking();

    const interval = setInterval(fetchBreaking, 45000);
    return () => clearInterval(interval);
  }, []);

  // Automatic cycling every 6 seconds
  useEffect(() => {
    if (tickerData.items && tickerData.items.length > 1) {
      const cycle = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % tickerData.items.length);
      }, 6000);
      return () => clearInterval(cycle);
    }
  }, [tickerData.items]);

  if (!tickerData.enabled || !tickerData.items || tickerData.items.length === 0) {
    return null;
  }

  const currentItem = tickerData.items[currentIndex] || tickerData.items[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickerData.items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + tickerData.items.length) % tickerData.items.length);
  };

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-10 overflow-hidden">
        {/* Breaking Badge */}
        <div className="flex-shrink-0 flex items-center bg-red-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-sm shadow-sm">
          <span className="w-2 h-2 rounded-full bg-white inline-block mr-1.5 animate-ping" />
          <Zap className="w-3.5 h-3.5 mr-1 fill-white" />
          BREAKING NEWS
        </div>

        {/* Ticker Content */}
        <div className="flex-1 ml-3 overflow-hidden text-sm truncate font-medium">
          {currentItem.slug ? (
            <Link
              href={`/news/${currentItem.slug}`}
              className="text-slate-100 hover:text-red-400 transition-colors flex items-center truncate"
            >
              {currentItem.category && (
                <span className="text-red-400 font-bold uppercase text-[11px] mr-2">
                  [{currentItem.category}]
                </span>
              )}
              <span className="truncate">{currentItem.title}</span>
            </Link>
          ) : (
            <span className="text-slate-100 truncate">{currentItem.title}</span>
          )}
        </div>

        {/* Stepper controls if multiple items */}
        {tickerData.items.length > 1 && (
          <div className="flex-shrink-0 flex items-center space-x-1 ml-2 text-slate-400">
            <span className="text-[11px] font-mono mr-1 hidden sm:inline">
              {currentIndex + 1}/{tickerData.items.length}
            </span>
            <button
              onClick={handlePrev}
              className="p-1 hover:text-white transition-colors"
              aria-label="Previous Breaking News"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:text-white transition-colors"
              aria-label="Next Breaking News"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
