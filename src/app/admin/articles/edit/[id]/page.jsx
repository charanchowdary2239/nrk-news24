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
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function EditArticlePage({ params }) {
  const { id } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [status, setStatus] = useState('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch article details & categories
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json())
    ]).then(([articleData, catData]) => {
      if (catData.categories) {
        setCategories(catData.categories);
      }
      if (articleData.article) {
        const a = articleData.article;
        setTitle(a.title || '');
        setSlug(a.slug || '');
        setSummary(a.summary || '');
        setContent(a.content || '');
        setCategoryId(a.category_id ? a.category_id.toString() : '');
        setFeaturedImage(a.featured_image || '');
        setTags(Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || ''));
        setAuthor(a.author || '');
        setSourceName(a.source_name || '');
        setSourceUrl(a.source_url || '');
        setStatus(a.status || 'published');
        setIsFeatured(a.is_featured === 1);
        setIsBreaking(a.is_breaking === 1);
      }
      setLoading(false);
    }).catch((err) => {
      setMessage({ type: 'error', text: 'Failed to load article details.' });
      setLoading(false);
    });
  }, [id]);

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
        setMessage({ type: 'error', text: data.error || 'Upload failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (overrideStatus = null) => {
    setSaving(true);
    setMessage(null);

    const targetStatus = overrideStatus || status;

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
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
      status: targetStatus,
    };

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(targetStatus);
        setMessage({ type: 'success', text: 'Article updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update article.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network communication error.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader title="Edit Article" />
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0b2545] mb-2" />
          Loading article data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Edit Article" />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Link
            href="/admin/articles"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-[#0b2545]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to All Articles
          </Link>

          <div className="flex items-center space-x-3">
            {status === 'published' && (
              <Link
                href={`/news/${slug}`}
                target="_blank"
                className="flex items-center px-3 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Live Story
              </Link>
            )}

            <button
              type="button"
              onClick={() => handleUpdate()}
              disabled={saving}
              className="flex items-center px-5 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Updating...' : 'Save Changes'}
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
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Article Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Canonical URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-2 border border-r-0 border-slate-300 rounded-l font-mono">
                    /news/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="flex-1 p-2 text-xs font-mono text-slate-800 border border-slate-300 rounded-r focus:outline-none focus:border-[#0b2545]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Executive Summary
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-300 rounded focus:outline-none focus:border-[#0b2545]"
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Full Article Content
              </label>
              <RichEditor value={content} onChange={setContent} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                Article Status & Visibility
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Publishing Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-800 font-semibold focus:outline-none focus:border-[#0b2545]"
                >
                  <option value="published">Published (Public)</option>
                  <option value="draft">Draft (Private)</option>
                  <option value="pending_review">Pending AI Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category
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

            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                Featured Cover Image
              </h3>

              {featuredImage && (
                <div className="relative aspect-[16/9] w-full rounded border border-slate-200 overflow-hidden bg-slate-100 mb-2">
                  <img src={featuredImage} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}

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
                  {uploading ? 'Uploading...' : 'Replace Image from Computer'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Or External Image URL
                </label>
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded font-mono text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>
            </div>

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
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
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
