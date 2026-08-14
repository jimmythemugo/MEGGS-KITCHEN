import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Package, Images, Star, Search } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { formatKES } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/admin/Pagination';
import { ImageUpload } from '@/components/ui/image-upload';
import { ProductImageGalleryManager } from '@/components/admin/ProductImageGalleryManager';
import { STORAGE_BUCKETS } from '@/lib/storage';
import { getProductPlaceholder, withFallback } from '@/lib/placeholders';
import { useCategories } from '@/hooks/use-data';
import type { Product } from '@/lib/types';

export default function AdminProducts() {
  const { toast } = useToast();
  const { categories } = useCategories();
  const { page, setPage, limit, total, totalPages, from, to, setTotal } = usePagination(20);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    short_description: '',
    sku: '',
    price: '',
    unit: 'piece',
    image_url: '',
    featured: false,
    in_stock: true,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(*), brand:product_brands(*)', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(from, to);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (!error) {
      setProducts(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [from, to, search, setTotal]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const resetForm = () => {
    setForm({
      name: '', slug: '', category_id: '', description: '', short_description: '',
      sku: '', price: '', unit: 'piece', image_url: '', featured: false, in_stock: true,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast({ title: 'Enter a valid price', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const data = {
      name: form.name,
      slug,
      category_id: form.category_id || null,
      description: form.description,
      short_description: form.short_description || null,
      sku: form.sku || null,
      price,
      unit: form.unit,
      image_url: form.image_url || null,
      featured: form.featured,
      in_stock: form.in_stock,
      is_active: true,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('products')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Product updated' });
      } else {
        const { error } = await supabase.from('products').insert(data);
        if (error) throw error;
        toast({ title: 'Product created' });
      }
      await fetchProducts();
      resetForm();
    } catch {
      toast({ title: 'Failed to save product', description: 'That slug or SKU may already be in use.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
      toast({ title: 'Product deleted' });
    } catch {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const editProduct = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      category_id: product.category_id || '',
      description: product.description || '',
      short_description: product.short_description || '',
      sku: product.sku || '',
      price: product.price.toString(),
      unit: product.unit,
      image_url: product.image_url || '',
      featured: product.featured,
      in_stock: product.in_stock,
    });
    setShowForm(true);
  };

  return (
    <AdminLayout title="Products">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input pl-9"
            />
          </div>
        </div>
        <p className="text-sm text-navy-400">{total} product{total !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-navy-500 mb-4">No products yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add Your First Product</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-navy-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          <img
                            src={withFallback(product.image_url, getProductPlaceholder(product.category?.slug || product.category?.name))}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">{product.name}</p>
                          <p className="text-xs text-navy-400">{product.slug}{product.sku ? ` · ${product.sku}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-500">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">{formatKES(product.price)}/{product.unit}</td>
                    <td className="px-6 py-4">
                      {product.in_stock ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">In Stock</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Out of Stock</span>
                      )}
                      {product.featured && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded ml-1">Featured</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setGalleryProduct(product)} className="p-2 text-navy-500 hover:text-primary-600" title="Manage Photos">
                        <Images className="w-4 h-4" />
                      </button>
                      <button onClick={() => editProduct(product)} className="p-2 text-navy-500 hover:text-primary-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-navy-500 hover:text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={limit} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg text-navy-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-navy-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
                    <option value="">Select category</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">SKU (optional)</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input" placeholder="e.g. TOP-107" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Price (KES) *</label>
                  <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input">
                    <option value="piece">piece</option>
                    <option value="set">set</option>
                    <option value="pack">pack</option>
                    <option value="unit">unit</option>
                    <option value="box">box</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  className="input"
                  placeholder="One line shown on product cards"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Full Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" />
              </div>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Main Product Image"
                folder="products"
                bucket={STORAGE_BUCKETS.PRODUCT_IMAGES}
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                  <span className="text-sm text-navy-700">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} />
                  <span className="text-sm text-navy-700">In Stock</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
              {editing && (
                <p className="text-xs text-navy-400 text-center">
                  Need to add more photos or captions? Close this and use the gallery icon on the product row.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {galleryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setGalleryProduct(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-lg text-navy-900">Product Media Gallery — {galleryProduct.name}</h2>
                <p className="text-xs text-navy-400">Upload to Supabase Storage, choose cover image, reorder, preview high-res, replace, or remove.</p>
              </div>
              <button onClick={() => setGalleryProduct(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <ProductImageGalleryManager
              productId={galleryProduct.id}
              productName={galleryProduct.name}
              onGalleryUpdated={fetchProducts}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
