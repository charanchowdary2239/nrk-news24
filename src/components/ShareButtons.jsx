'use client';

import { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Mail, 
  Send,
  MessageCircle, 
  ExternalLink
} from 'lucide-react';

export default function ShareButtons({ article, compact = false }) {
  const [copied, setCopied] = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const url = `${origin}/news/${article.slug}`;
      setCanonicalUrl(url);
      if (navigator.share) {
        setCanWebShare(true);
      }
    }
  }, [article.slug]);

  const recordShareEvent = async (platform) => {
    try {
      await fetch(`/api/articles/${article.slug}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
    } catch (e) {
      // Non-blocking
    }
  };

  const shareTitle = `${article.title} — NRK News24`;

  // Handlers
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      recordShareEvent('copy');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: article.summary,
          url: canonicalUrl,
        });
        recordShareEvent('native');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Native share error:', err);
        }
      }
    }
  };

  const handleWhatsAppShare = () => {
    recordShareEvent('whatsapp');
    const text = encodeURIComponent(`${shareTitle}\n\n${canonicalUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    recordShareEvent('facebook');
    const url = encodeURIComponent(canonicalUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    recordShareEvent('x');
    const text = encodeURIComponent(shareTitle);
    const url = encodeURIComponent(canonicalUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    recordShareEvent('telegram');
    const text = encodeURIComponent(shareTitle);
    const url = encodeURIComponent(canonicalUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    recordShareEvent('email');
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`Read this article on NRK News24:\n\n${article.title}\n\n${article.summary}\n\nLink: ${canonicalUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleWhatsAppShare}
          className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          title={copied ? "Copied!" : "Copy Link"}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full my-6 p-4 bg-slate-50 border border-slate-200 rounded-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-[#0b2545]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Share this story:
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Mobile Web Share Button if supported */}
          {canWebShare && (
            <button
              onClick={handleNativeShare}
              className="md:hidden flex items-center px-3 py-1.5 bg-[#0b2545] text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Share
            </button>
          )}

          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center px-3 py-1.5 bg-[#25D366] text-white rounded text-xs font-semibold hover:brightness-95 transition-all shadow-sm"
            title="Share via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5 fill-white" />
            WhatsApp
          </button>

          {/* X / Twitter */}
          <button
            onClick={handleTwitterShare}
            className="flex items-center px-3 py-1.5 bg-black text-white rounded text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
            title="Share on X"
          >
            <span className="font-bold text-xs mr-1.5">𝕏</span>
            Post
          </button>

          {/* Facebook */}
          <button
            onClick={handleFacebookShare}
            className="flex items-center px-3 py-1.5 bg-[#1877F2] text-white rounded text-xs font-semibold hover:brightness-95 transition-all shadow-sm"
            title="Share on Facebook"
          >
            <span className="font-bold text-xs mr-1.5">f</span>
            Facebook
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegramShare}
            className="flex items-center px-3 py-1.5 bg-[#229ED9] text-white rounded text-xs font-semibold hover:brightness-95 transition-all shadow-sm"
            title="Share on Telegram"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Telegram
          </button>

          {/* Email */}
          <button
            onClick={handleEmailShare}
            className="flex items-center px-3 py-1.5 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
            title="Share via Email"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Email
          </button>

          {/* Copy Canonical Link */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center px-3 py-1.5 border rounded text-xs font-semibold transition-all shadow-sm ${
              copied
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Copy exact canonical link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
