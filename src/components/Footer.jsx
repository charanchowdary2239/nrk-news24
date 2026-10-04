'use client';

import Link from 'next/link';
import { ShieldCheck, Mail, MapPin, Phone, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const categories = [
    { label: 'India', href: '/category/india' },
    { label: 'Andhra Pradesh', href: '/category/andhra-pradesh' },
    { label: 'Telangana', href: '/category/telangana' },
    { label: 'World', href: '/category/world' },
    { label: 'Politics', href: '/category/politics' },
    { label: 'Sports', href: '/category/sports' },
    { label: 'Business', href: '/category/business' },
    { label: 'Technology', href: '/category/technology' },
    { label: 'Entertainment', href: '/category/entertainment' },
    { label: 'Education', href: '/category/education' },
  ];

  return (
    <footer className="w-full bg-[#06172c] text-slate-300 border-t border-slate-800 mt-auto">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="bg-white text-[#0b2545] font-black text-xl px-2.5 py-0.5 rounded-sm shadow-sm">
                NRK
              </span>
              <span className="text-2xl font-black tracking-tight text-white font-display">
                NEWS<span className="text-red-500">24</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              NRK News24 is an independent digital news publishing platform committed to unbiased, real-time coverage across Andhra Pradesh, Telangana, India, and the globe.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-2 text-slate-500" />
                <span>Bureaus: Amaravati • Hyderabad • New Delhi</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-2 text-slate-500" />
                <span>contact@nrknews24.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: News Sections */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-l-2 border-red-600 pl-2">
              News Categories
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-slate-400 hover:text-white transition-colors block py-0.5"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Editorial Standards */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-l-2 border-red-600 pl-2">
              Editorial Policy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              We adhere to strict verification standards, attribution integrity, and fact-checking protocols. Automated wire summaries and AI-assisted reports undergo human editorial clearance before final publishing.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>• Code of Ethics Compliant</p>
              <p>• Verified Wire Partnerships</p>
              <p>• Transparent Corrections Policy</p>
            </div>
          </div>

          {/* Col 4: Quick Links & Connect */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-l-2 border-red-600 pl-2">
              Connect With Us
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <a
                href="https://x.com/nrknews24"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-xs font-bold transition-colors"
                title="Follow on X"
              >
                𝕏
              </a>
              <a
                href="https://facebook.com/nrknews24"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-slate-800 hover:bg-blue-600 flex items-center justify-center text-white text-xs font-bold transition-colors"
                title="Follow on Facebook"
              >
                f
              </a>
              <a
                href="https://t.me/nrknews24"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-slate-800 hover:bg-sky-500 flex items-center justify-center text-white text-xs font-bold transition-colors"
                title="Join Telegram Channel"
              >
                ✈
              </a>
              <a
                href="https://youtube.com/@nrknews24"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-slate-800 hover:bg-red-600 flex items-center justify-center text-white text-xs font-bold transition-colors"
                title="Subscribe on YouTube"
              >
                ▶
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/admin/login"
                className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Editorial Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright Bar */}
      <div className="border-t border-slate-800 bg-[#040e1b] py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © 2026 NRK News24 Media Network. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/latest" className="hover:text-slate-300">Latest Stories</Link>
            <span>•</span>
            <Link href="/sitemap.xml" className="hover:text-slate-300">Sitemap</Link>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="flex items-center text-slate-400 hover:text-white transition-colors"
              aria-label="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" />
              Back to Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
