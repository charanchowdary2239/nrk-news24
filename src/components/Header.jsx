'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
const NextLink = Link;
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, 
  Menu, 
  X, 
  Calendar, 
  Globe, 
  ShieldCheck, 
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    // Format live date nicely
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateStr(now.toLocaleDateString('en-IN', options));
  }, []);

  const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'LATEST NEWS', href: '/latest' },
    { label: 'INDIA', href: '/category/india' },
    { label: 'ANDHRA PRADESH', href: '/category/andhra-pradesh' },
    { label: 'TELANGANA', href: '/category/telangana' },
    { label: 'WORLD', href: '/category/world' },
    { label: 'POLITICS', href: '/category/politics' },
    { label: 'SPORTS', href: '/category/sports' },
    { label: 'BUSINESS', href: '/category/business' },
    { label: 'TECHNOLOGY', href: '/category/technology' },
    { label: 'ENTERTAINMENT', href: '/category/entertainment' },
    { label: 'EDUCATION', href: '/category/education' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200">
      {/* 1. Top Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center font-medium text-slate-200">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
              {currentDateStr || 'Today'}
            </span>
            <span className="hidden md:inline-block text-slate-500">|</span>
            <span className="hidden md:flex items-center text-slate-300">
              <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Editions: AP • Telangana • National • Global
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <NextLink 
              href="/latest" 
              className="hidden sm:flex items-center hover:text-white transition-colors text-slate-300"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-breaking" />
              Trending Now
            </NextLink>
            <NextLink 
              href="/admin/login" 
              className="flex items-center text-slate-400 hover:text-slate-100 transition-colors border-l border-slate-700 pl-3"
              title="Editorial Staff Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Newsroom Staff
            </NextLink>
          </div>
        </div>
      </div>

      {/* 2. Main Brand Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <NextLink href="/" className="flex items-center space-x-3 group">
          <div className="flex items-center">
            {/* Logo Badge */}
            <div className="bg-[#0b2545] text-white font-extrabold text-2xl sm:text-3xl px-2.5 py-1 tracking-wider rounded-sm shadow-sm flex items-center">
              NRK
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block ml-1 animate-pulse" />
            </div>
            <div className="ml-2 flex flex-col justify-center">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 group-hover:text-[#0b2545] transition-colors leading-none font-display">
                NEWS<span className="text-red-600">24</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
                Truth • Speed • Integrity
              </span>
            </div>
          </div>
        </NextLink>

        {/* Search trigger & Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Search bar for larger screens */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative w-64">
            <input
              type="text"
              placeholder="Search news, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-full py-1.5 pl-3.5 pr-8 text-slate-800 focus:outline-none focus:border-[#0b2545] focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="absolute right-2.5 text-slate-500 hover:text-[#0b2545]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Quick search button for tablets/mobile */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-[#0b2545] hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Toggle search input"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-[#0b2545] hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Input for Mobile/Tablet */}
      {searchOpen && (
        <div className="lg:hidden bg-slate-50 border-t border-b border-slate-200 px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex items-center">
            <input
              type="text"
              placeholder="Search headlines, politics, AP, TG, tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 text-sm bg-white border border-slate-300 rounded-l-md py-2 px-3 text-slate-900 focus:outline-none focus:border-[#0b2545]"
            />
            <button
              type="submit"
              className="bg-[#0b2545] text-white px-4 py-2 rounded-r-md hover:bg-slate-800 transition-colors flex items-center text-sm font-medium"
            >
              <Search className="w-4 h-4 mr-1.5" />
              Search
            </button>
          </form>
        </div>
      )}

      {/* 3. Primary Desktop Navigation */}
      <nav className="hidden md:block bg-[#0b2545] text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ul className="flex items-center flex-wrap text-[13px] font-bold tracking-wide">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <NextLink
                    href={item.href}
                    className={`inline-block py-2.5 px-3 transition-colors uppercase whitespace-nowrap ${
                      isActive
                        ? 'bg-red-600 text-white font-extrabold'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {item.label}
                  </NextLink>
                </li>
              );
            })}
            <li className="ml-auto">
              <NextLink
                href="/search"
                className={`flex items-center py-2.5 px-3 uppercase text-[12px] font-bold ${
                  pathname === '/search' ? 'text-red-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                SEARCH
              </NextLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* 4. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl flex flex-col z-50 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 bg-[#0b2545] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="bg-white text-[#0b2545] font-black text-lg px-2 py-0.5 rounded">
                  NRK
                </span>
                <span className="font-extrabold text-lg tracking-wide">NEWS24</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white"
                aria-label="Close Menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <form onSubmit={handleSearchSubmit} className="flex">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-l-md px-3 py-2 bg-white"
                />
                <button
                  type="submit"
                  className="bg-[#0b2545] text-white px-3 py-2 rounded-r-md text-sm font-semibold"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Mobile Nav Links */}
            <div className="py-2 flex-1">
              <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                News Sections
              </div>
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium border-l-4 transition-colors ${
                      isActive
                        ? 'border-red-600 bg-red-50 text-red-700 font-bold'
                        : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-[#0b2545]'
                    }`}
                  >
                    <span>{item.label}</span>
                  </NextLink>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              <NextLink
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center text-[#0b2545] font-semibold py-2"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Newsroom Admin Portal
              </NextLink>
              <p className="mt-2 text-[11px]">© 2026 NRK News24 Media Network.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
