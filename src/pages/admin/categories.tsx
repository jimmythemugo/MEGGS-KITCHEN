// ============================================================================
// MEGGS KITCHEN — CATEGORIES MANAGEMENT
// File: src/pages/admin/categories.tsx
// Phase: 7 (Supabase Storage & Media Architecture)
// ============================================================================

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useCategories } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from '@/components/ui/image-upload';
import { STORAGE_BUCKETS, deleteFromStorage } from '@/lib/storage';
import type { Category } from '@/lib/types';

export default function AdminCategories() {
  const { categories, loading, refetch } = useCategories();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
  });

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', image_url: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    try {
      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: form.name,
            slug,
            description: form.description || null,
            image_url: form.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Category updated' });
      } else {
        const { error } = await supabase.from('categories').insert({
          name: form.name,
          slug,
          description: form.description || null,
          image_url: form.image_url || null,
        });
        if (error) throw error;
        toast({ title: 'Category created' });
      }
      await refetch();
      resetForm();
    } catch {
      toast({ title: 'Failed to save category', description: 'That slug may already be in use.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm('Delete this category? Products in it will keep showing but lose their category.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      if (cat.image_url) {
        deleteFromStorage(STORAGE_BUCKETS.CATEGORY_IMAGES, cat.image_url).catch(() => {});
      }
      await refetch();
      toast({ title: 'Category deleted' });
    } catch {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  };

  const editCategory = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
    });
    setShowForm(true);
  };

  return (
    <AdminLayout title="Categories">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-sans font-medium mb-1">Taxonomy</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Product Categories</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage catalog hierarchy and imagery in the category-images Supabase Storage bucket.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-navy-500 mb-4">No categories yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add Your First Category</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Image</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Slug</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Description</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-navy-900">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-navy-400 font-mono">{cat.slug}</td>
                  <td className="px-6 py-4 text-xs text-navy-500 max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => editCategory(cat)} className="p-2 text-navy-500 hover:text-primary-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="p-2 text-navy-500 hover:text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={resetForm}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg text-navy-900">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-navy-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" placeholder="Auto-generated if empty" />
              </div>
              <div>
                <ImageUpload
                  label="Category Cover Image"
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  bucket={STORAGE_BUCKETS.CATEGORY_IMAGES}
                  folder="categories"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[60px]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
