'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import RichEditor from '@/components/RichEditor';
import { slugify } from '@/lib/slugify';
import { 
  Save, 
  Send, 
  Upload, 
  Image as ImageIcon, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';

export default function CreateArticlePage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [customSlug, setCustomSlug] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('NRK Bureau');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  // Categories list
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setCategoryId(data.categories[0].id.toString());
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-generate slug when title changes unless manually altered
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!customSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value));
    setCustomSlug(true);
  };

  // Image upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeaturedImage(data.url);
        setMessage({ type: 'success', text: 'Image uploaded successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Image upload failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload network error.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (targetStatus) => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Headline is required.' });
      return;
    }
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Article content cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      title: title.trim(),
      slug: slug || slugify(title),
      summary: summary.trim(),
      content,
      category_id: parseInt(categoryId, 10),
      featured_image: featuredImage.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: author.trim() || 'NRK Bureau',
      source_name: sourceName.trim(),
      source_url: sourceUrl.trim(),
      is_featured: isFeatured,
      is_breaking: isBreaking,
      status: targetStatus, // 'draft' | 'published'
    };

    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: targetStatus === 'published' ? 'Article published successfully!' : 'Draft saved successfully.',
        });
        setTimeout(() => {
          router.push('/admin/articles');
        }, 1200);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save article.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server communication error.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Author New Article" />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Link
            href="/admin/articles"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-[#0b2545]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to All Articles
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex items-center px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Publishing...' : 'Publish Article Now'}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded text-xs flex items-center ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-red-50 border border-red-300 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Editing Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Headline */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Article Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter compelling journalistic headline..."
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full p-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  SEO Friendly Slug (/news/...)
                </label>
                <div className="flex items-center">
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-2 border border-r-0 border-slate-300 rounded-l font-mono">
                    /news/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    className="flex-1 p-2 text-xs font-mono text-slate-800 border border-slate-300 rounded-r focus:outline-none focus:border-[#0b2545]"
                  />
                </div>
              </div>

              {/* Short Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Executive Summary / Lead Paragraph
                </label>
                <textarea
                  rows={3}
                  placeholder="2-3 sentence summary displayed on homepage cards and social shares..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
              </div>
            </div>

            {/* Rich Article Body Content */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Full Article Content <span className="text-red-500">*</span>
              </label>
              <RichEditor value={content} onChange={setContent} />
            </div>
          </div>

          {/* Publishing Settings Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Category & Status Flags */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                Publishing Details
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0b2545]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Author / Byline
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="NRK Bureau / Correspondent Name"
                  className="w-full p-2 text-xs border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#0b2545] rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Featured Top Story (Hero Section)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-red-600">
                    Breaking News (Show in Ticker)
                  </span>
                </label>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                Featured Cover Image
              </h3>

              {featuredImage ? (
                <div className="relative aspect-[16/9] w-full rounded border border-slate-200 overflow-hidden bg-slate-100 mb-2">
                  <img src={featuredImage} alt="Cover preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage('')}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="aspect-[16/9] w-full rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center bg-slate-50">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">No image selected</span>
                </div>
              )}

              {/* Upload file button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-2 px-3 border border-slate-300 rounded text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload Image from Computer'}
                </button>
              </div>

              {/* Or enter URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Or Paste External Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded font-mono text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>
            </div>

            {/* Tags & Source Attribution */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                Attribution & Tags
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="Andhra, Amaravati, Economy, Transport"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Source Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="PTI / The Hindu / Staff Reporter"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Source URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded font-mono text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
