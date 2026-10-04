'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { FolderTree, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function CategoriesManagerPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setDisplayOrder((categories.length + 1).toString());
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setDisplayOrder(cat.display_order?.toString() || '0');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      display_order: parseInt(displayOrder, 10),
    };

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: editingCategory ? 'Category updated.' : 'Category created successfully.',
        });
        setModalOpen(false);
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save category.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Communication error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? Existing articles in this category will be reassigned to India.`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Category deleted.' });
        fetchCategories();
      }
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="News Sections & Categories" onRefresh={fetchCategories} />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Categories Management</h2>
            <p className="text-xs text-slate-500">
              Manage editorial verticals, navigation order, and category descriptions
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Category
          </button>
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

        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16">Order</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">URL Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Published Stories</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0b2545] mb-2" />
                    Loading categories...
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      {cat.display_order}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      /category/{cat.slug}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-[#0b2545]">
                      {cat.article_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science & Environment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  URL Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="auto-generated if empty"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of topics covered in this vertical..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
