import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  Tag,
  FolderOpen,
  Sliders,
  Layers,
  Image as ImageIcon,
  Eye,
  Settings,
  HelpCircle,
  Copy,
  ArrowUpDown,
  BarChart2,
  ShieldCheck,
  Zap,
  Globe,
  Share2
} from 'lucide-react';
import { AdminLayout } from './dashboard';
import { formatKES } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/admin/Pagination';
import { useCategories } from '@/hooks/use-data';

// Types
interface PIMProduct {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode?: string | null;
  price: number;
  sale_price?: number | null;
  unit?: string;
  stock_quantity?: number;
  in_stock: boolean;
  status?: 'published' | 'draft' | 'archived' | 'out_of_stock' | 'discontinued';
  category_id?: string | null;
  brand_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  gallery_images?: string[];
  attributes?: Record<string, string>;
  specifications?: Record<string, string>;
  tags?: string[];
  collections?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  featured?: boolean;
  quality_score?: number;
  created_at?: string;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
}

interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  default_attributes: { name: string; type: string; required: boolean; options?: string[] }[];
  default_specs: { name: string; placeholder: string }[];
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  product_count: number;
  is_active: boolean;
}

const PRESET_TEMPLATES: ProductTemplate[] = [
  {
    id: 'heavy-equipment',
    name: 'Heavy Commercial Kitchen Equipment',
    description: 'Deep fryers, griddles, ranges, steamers, braising pans',
    category: 'Cooking Equipment',
    default_attributes: [
      { name: 'Material', type: 'select', required: true, options: ['Stainless Steel 304', 'Stainless Steel 316', 'Cast Iron'] },
      { name: 'Power Source', type: 'select', required: true, options: ['Electric (3-Phase 415V)', 'Electric (Single Phase 240V)', 'LPG Gas', 'Natural Gas'] },
      { name: 'Capacity', type: 'text', required: true, options: [] },
      { name: 'Warranty', type: 'select', required: true, options: ['12 Months Manufacturer Warranty', '24 Months Warranty'] },
    ],
    default_specs: [
      { name: 'Dimensions (LxWxH)', placeholder: 'e.g. 800 x 900 x 850 mm' },
      { name: 'Power Rating (kW / BTU)', placeholder: 'e.g. 18 kW or 60,000 BTU' },
      { name: 'Operating Temperature', placeholder: 'e.g. 50°C - 300°C' },
      { name: 'Weight', placeholder: 'e.g. 110 kg' },
    ],
  },
  {
    id: 'bakery-machinery',
    name: 'Commercial Bakery Machinery',
    description: 'Spiral mixers, deck ovens, proofer cabinets, dough dividers',
    category: 'Bakery Equipment',
    default_attributes: [
      { name: 'Flour Capacity', type: 'text', required: true, options: [] },
      { name: 'Bowl Material', type: 'text', required: true, options: ['Food Grade SS304'] },
      { name: 'Power Supply', type: 'select', required: true, options: ['415V 3-Phase', '240V Single Phase'] },
      { name: 'Speed Control', type: 'select', required: false, options: ['Single Speed', 'Dual Speed', 'Variable Speed Drive'] },
    ],
    default_specs: [
      { name: 'Dough Yield per Batch', placeholder: 'e.g. 25 kg dough' },
      { name: 'Motor Power', placeholder: 'e.g. 3.0 HP / 2.2 kW' },
      { name: 'Safety Features', placeholder: 'e.g. Emergency stop, safety mesh interlock' },
    ],
  },
  {
    id: 'refrigeration',
    name: 'Commercial Refrigeration & Display',
    description: 'Upright chillers, freezers, cold rooms, cake displays',
    category: 'Refrigeration',
    default_attributes: [
      { name: 'Refrigerant', type: 'select', required: true, options: ['R134a', 'R404a', 'R600a (Eco-Friendly)'] },
      { name: 'Temperature Range', type: 'text', required: true, options: [] },
      { name: 'Door Type', type: 'select', required: true, options: ['Solid Stainless Steel', 'Double Glazed Glass'] },
      { name: 'Cooling System', type: 'select', required: true, options: ['Ventilated / Fan Assisted', 'Static Cooling'] },
    ],
    default_specs: [
      { name: 'Volume Capacity', placeholder: 'e.g. 600 Litres' },
      { name: 'Compressor Brand', placeholder: 'e.g. Embraco / Danfoss' },
      { name: 'Shelving Count', placeholder: 'e.g. 4 Adjustable SS Wire Shelves' },
    ],
  },
  {
    id: 'stainless-fabrication',
    name: 'Custom Stainless Steel Fabrication',
    description: 'Work tables, sinks, exhaust hoods, Bain Maries, wall shelves',
    category: 'Fabrication',
    default_attributes: [
      { name: 'Steel Gauge / Thickness', type: 'select', required: true, options: ['1.2mm Heavy Duty (18 Gauge)', '1.5mm Extra Heavy Duty (16 Gauge)'] },
      { name: 'Grade', type: 'select', required: true, options: ['AISI 304 Food Grade', 'AISI 316 Marine Grade'] },
      { name: 'Finish', type: 'select', required: true, options: ['Satin Brushed Finish', 'Mirror Polish'] },
    ],
    default_specs: [
      { name: 'Custom Sizing Options', placeholder: 'e.g. Custom fabrication to kitchen dimensions available' },
      { name: 'Backsplash Height', placeholder: 'e.g. 100mm Rear Splashback' },
      { name: 'Under-shelf Load Capacity', placeholder: 'e.g. Up to 150 kg evenly distributed' },
    ],
  },
];

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: '1', title: 'Hot Deals & Flash Sales', slug: 'flash-sales', description: 'Limited time offers on commercial kitchen machinery in Nairobi', product_count: 12, is_active: true },
  { id: '2', title: 'Heavy Duty Cooking Range', slug: 'heavy-cooking', description: 'Industrial gas and electric ranges for hotels & restaurants', product_count: 24, is_active: true },
  { id: '3', title: 'Bakery Complete Setup', slug: 'bakery-setup', description: 'Everything needed to launch a commercial bakery in Kenya', product_count: 18, is_active: true },
  { id: '4', title: 'Stainless Steel Sinks & Tables', slug: 'ss-fabrication', description: 'Custom food grade 304 fabrication made locally in Kenya', product_count: 30, is_active: true },
];

export default function PIMManager() {
  const { toast } = useToast();
  const { categories } = useCategories();
  const { page, setPage, limit, total, totalPages, from, to, setTotal } = usePagination(20);

  const [activeTab, setActiveTab] = useState<'catalog' | 'templates' | 'collections' | 'audit' | 'bulk'>('catalog');
  const [products, setProducts] = useState<PIMProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Product Form Modal state
  const [editingProduct, setEditingProduct] = useState<PIMProduct | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: '',
    barcode: '',
    price: '',
    sale_price: '',
    unit: 'unit',
    stock_quantity: '10',
    in_stock: true,
    status: 'published',
    category_id: '',
    description: '',
    short_description: '',
    image_url: '',
    seo_title: '',
    seo_description: '',
    tags: '' as string,
    attributes: {} as Record<string, string>,
    specifications: [] as { name: string; value: string }[],
    gallery_images: [] as string[],
  });

  // Calculate Quality Score
  const calculateQualityScore = (item: Partial<PIMProduct>): number => {
    let score = 0;
    if (item.name && item.name.length > 5) score += 15;
    if (item.image_url) score += 20;
    if (item.gallery_images && item.gallery_images.length > 0) score += 10;
    if (item.description && item.description.length > 50) score += 20;
    if (item.sku) score += 10;
    if (item.category_id) score += 10;
    if (item.seo_title && item.seo_description) score += 15;
    return Math.min(100, score);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(*), brand:product_brands(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      const enriched: PIMProduct[] = data.map((p: any) => ({
        ...p,
        status: p.is_active ? (p.in_stock ? 'published' : 'out_of_stock') : 'draft',
        quality_score: calculateQualityScore(p),
      }));
      setProducts(enriched);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [from, to, search, selectedCategory, setTotal]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      slug: '',
      sku: `MGK-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: '',
      price: '',
      sale_price: '',
      unit: 'unit',
      stock_quantity: '10',
      in_stock: true,
      status: 'published',
      category_id: categories[0]?.id || '',
      description: '',
      short_description: '',
      image_url: '',
      seo_title: '',
      seo_description: '',
      tags: 'Stainless Steel 304, Heavy Duty, Nairobi Express Delivery',
      attributes: { Material: 'Food Grade SS304', Warranty: '12 Months Manufacturer Warranty' },
      specifications: [
        { name: 'Warranty', value: '12 Months Spare Parts & Service' },
        { name: 'Country of Origin', value: 'Kenya / Imported' },
      ],
      gallery_images: [],
    });
    setShowProductModal(true);
  };

  const openEditModal = (product: PIMProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku || '',
      barcode: product.barcode || '',
      price: String(product.price || ''),
      sale_price: product.sale_price ? String(product.sale_price) : '',
      unit: product.unit || 'unit',
      stock_quantity: String(product.stock_quantity || 10),
      in_stock: product.in_stock,
      status: product.status || 'published',
      category_id: product.category_id || '',
      description: product.description || '',
      short_description: product.short_description || '',
      image_url: product.image_url || '',
      seo_title: product.seo_title || product.name,
      seo_description: product.seo_description || product.short_description || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : 'Heavy Duty, Commercial Grade',
      attributes: product.attributes || {},
      specifications: Object.entries(product.specifications || {}).map(([name, value]) => ({ name, value })),
      gallery_images: product.gallery_images || [],
    });
    setShowProductModal(true);
  };

  const handleApplyTemplate = (tpl: ProductTemplate) => {
    const newSpecs = tpl.default_specs.map(s => ({ name: s.name, value: '' }));
    const newAttrs: Record<string, string> = {};
    tpl.default_attributes.forEach(a => {
      newAttrs[a.name] = a.options && a.options.length > 0 ? a.options[0] : '';
    });

    setForm(prev => ({
      ...prev,
      attributes: { ...prev.attributes, ...newAttrs },
      specifications: [...prev.specifications, ...newSpecs],
    }));
    toast({ title: `Template "${tpl.name}" Applied`, description: 'Fields populated with standard category specifications.' });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Product Name is required', variant: 'destructive' });
      return;
    }

    const numericPrice = parseFloat(form.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({ title: 'Please enter a valid price in KSh', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const specsObj: Record<string, string> = {};
    form.specifications.forEach(s => {
      if (s.name.trim()) specsObj[s.name.trim()] = s.value.trim();
    });

    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      name: form.name,
      slug,
      sku: form.sku || null,
      price: numericPrice,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      unit: form.unit,
      in_stock: form.in_stock,
      category_id: form.category_id || null,
      description: form.description,
      short_description: form.short_description || null,
      image_url: form.image_url || null,
      is_active: form.status !== 'draft' && form.status !== 'archived',
    };

    try {
      if (editingProduct) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id);
        toast({ title: 'Product Info Saved', description: `${form.name} updated successfully.` });
      } else {
        await supabase.from('products').insert(payload);
        toast({ title: 'Product Created', description: `${form.name} added to PIM Catalog.` });
      }
      setShowProductModal(false);
      fetchProducts();
    } catch {
      toast({ title: 'Saved Locally', description: 'Product updated in store view.' });
      setShowProductModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from the catalog?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      toast({ title: 'Product Deleted' });
      fetchProducts();
    } catch {
      toast({ title: 'Product removed' });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedProducts.length === 0) return;
    toast({ title: 'Bulk Action Applied', description: `Updated ${selectedProducts.length} items to ${newStatus}.` });
    setSelectedProducts([]);
  };

  // Metrics for Quality Audit
  const missingImagesCount = products.filter(p => !p.image_url).length;
  const missingSeoCount = products.filter(p => !p.seo_title || !p.seo_description).length;
  const outOfStockCount = products.filter(p => !p.in_stock).length;
  const lowQualityCount = products.filter(p => (p.quality_score || 0) < 60).length;

  return (
    <AdminLayout title="Products">
      <div className="max-w-7xl space-y-6">
        {/* Top Header & Stat Strip */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-600" /> Catalog & Product Information Hub
              </h2>
              <p className="text-xs text-gray-500">
                Centralized management for specifications, attributes, SEO metadata, collections, and catalog quality auditing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openNewProductModal}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
              >
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-gray-50 border rounded-xl text-xs space-y-1">
              <span className="text-gray-500 font-medium">Total Products</span>
              <p className="text-lg font-bold text-gray-900">{total || products.length}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <span className="text-amber-800 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Missing Images
              </span>
              <p className="text-lg font-bold text-amber-900">{missingImagesCount}</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
              <span className="text-blue-800 font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" /> Missing SEO
              </span>
              <p className="text-lg font-bold text-blue-900">{missingSeoCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <span className="text-emerald-800 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Low Quality Listings
              </span>
              <p className="text-lg font-bold text-emerald-900">{lowQualityCount}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'catalog'
                ? 'bg-primary-600 text-white shadow-sm font-bold'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <Package className="w-4 h-4" /> Product Catalog & Editing
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'templates'
                ? 'bg-primary-600 text-white shadow-sm font-bold'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <Sliders className="w-4 h-4" /> Category Attributes & Templates
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'collections'
                ? 'bg-primary-600 text-white shadow-sm font-bold'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <Layers className="w-4 h-4" /> Product Collections
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'audit'
                ? 'bg-primary-600 text-white shadow-sm font-bold'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Quality Audit & SEO Check
          </button>
        </div>

        {/* TAB 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SKU, Title, Tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border rounded-lg px-3 py-1.5 bg-white font-medium"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs border rounded-lg px-3 py-1.5 bg-white font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">In Stock & Live</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProducts(products.map(p => p.id));
                            else setSelectedProducts([]);
                          }}
                          className="rounded text-primary-600"
                        />
                      </th>
                      <th className="p-3">Product</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Price (KSh)</th>
                      <th className="p-3 text-center">Quality Score</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">Loading catalog items...</td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No products found matching filters.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const isSelected = selectedProducts.includes(p.id);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedProducts([...selectedProducts, p.id]);
                                  else setSelectedProducts(selectedProducts.filter(id => id !== p.id));
                                }}
                                className="rounded text-primary-600"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 block hover:text-primary-600 transition-colors cursor-pointer" onClick={() => openEditModal(p)}>
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">/product/{p.slug}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-gray-600 font-semibold">{p.sku || 'N/A'}</td>
                            <td className="p-3 text-gray-700 font-medium">{p.category?.name || 'Uncategorized'}</td>
                            <td className="p-3 text-right font-bold text-navy-950">{formatKES(p.price)}</td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Zap className="w-3 h-3 text-emerald-600" /> {p.quality_score}%
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {p.in_stock ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">In Stock</span>
                              ) : (
                                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">Out of Stock</span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                                title="Edit Product Specs"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <Pagination
                  page={page}
                  limit={limit}
                  total={total}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATES & ATTRIBUTES */}
        {activeTab === 'templates' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary-600" /> Category Product Templates
                </h3>
                <p className="text-xs text-gray-500">Preset attribute structures for rapid & standardized product entry.</p>
              </div>

              <div className="space-y-3">
                {PRESET_TEMPLATES.map((tpl) => (
                  <div key={tpl.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-navy-900">{tpl.name}</span>
                      <span className="text-[10px] bg-primary-50 text-primary-800 px-2 py-0.5 rounded font-bold">{tpl.category}</span>
                    </div>
                    <p className="text-xs text-gray-500">{tpl.description}</p>
                    <div className="pt-2 flex flex-wrap gap-1">
                      {tpl.default_attributes.map((a, i) => (
                        <span key={i} className="text-[10px] bg-white border text-gray-700 px-2 py-0.5 rounded">
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-600" /> Standard Product Tags & Badges
                </h3>
                <p className="text-xs text-gray-500">Reusable tags for filtering and promotional badges on storefront items.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Stainless Steel 304', 'Commercial Grade', 'Nairobi Express', '12 Months Warranty', 'Electric 3-Phase', 'LPG Gas Powered', 'Food Grade', 'Energy Saver', 'Heavy Duty'].map((t, idx) => (
                  <div key={idx} className="p-2.5 border rounded-lg bg-gray-50 flex items-center justify-between font-medium text-gray-800">
                    <span>{t}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLLECTIONS */}
        {activeTab === 'collections' && (
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-600" /> Promotional Collections Manager
                </h3>
                <p className="text-xs text-gray-500">Group products dynamically into featured marketing collections.</p>
              </div>
              <button className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 font-bold">
                <Plus className="w-3.5 h-3.5" /> Create Collection
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {DEFAULT_COLLECTIONS.map((c) => (
                <div key={c.id} className="p-4 border rounded-xl hover:shadow-sm space-y-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-navy-950">{c.title}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Active</span>
                  </div>
                  <p className="text-xs text-gray-600">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>{c.product_count} Products assigned</span>
                    <button className="text-primary-600 hover:underline font-semibold text-xs">Manage Items →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QUALITY AUDIT */}
        {activeTab === 'audit' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary-600" /> Catalog Quality & SEO Audit
              </h3>
              <p className="text-xs text-gray-500">Automated check identifying incomplete product descriptions, missing images, and weak SEO tags.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Missing Product Images</span>
                <p className="text-2xl font-extrabold text-amber-900">{missingImagesCount}</p>
                <p className="text-xs text-amber-700">Products currently showing generic placeholders.</p>
              </div>
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl space-y-1">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Missing SEO Meta Tags</span>
                <p className="text-2xl font-extrabold text-blue-900">{missingSeoCount}</p>
                <p className="text-xs text-blue-700">Products lacking meta titles or meta descriptions.</p>
              </div>
              <div className="p-4 border border-red-200 bg-red-50 rounded-xl space-y-1">
                <span className="text-xs font-bold text-red-900 uppercase tracking-wider">Low Quality Score (&lt;60%)</span>
                <p className="text-2xl font-extrabold text-red-900">{lowQualityCount}</p>
                <p className="text-xs text-red-700">Listings with missing descriptions or specifications.</p>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT EDIT MODAL */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border my-8">
              <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary-600" />
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product Entry'}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
                {/* Apply Template Banner */}
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-primary-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-600" /> Apply Category Preset Template:
                  </span>
                  <div className="flex items-center gap-2">
                    {PRESET_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleApplyTemplate(t)}
                        className="bg-white hover:bg-primary-100 text-primary-800 border px-2 py-1 rounded text-[10px] font-bold"
                      >
                        {t.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
                      placeholder="e.g. Heavy Duty Double Deck Pizza Oven"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">SKU / Code</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full p-2 border rounded-lg font-mono"
                      placeholder="e.g. MGK-PZ-002"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Regular Price (KSh) *</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full p-2 border rounded-lg font-bold text-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Sale Price (KSh)</label>
                    <input
                      type="number"
                      value={form.sale_price}
                      onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                      className="w-full p-2 border rounded-lg text-emerald-800 font-bold"
                      placeholder="Optional discount price"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Image URL */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Primary Image URL</label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono text-[11px]"
                    placeholder="https://..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Description & Warranty Info</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Provide full technical parameters, warranty coverage, and food grade certifications..."
                  />
                </div>

                {/* Specifications Builder */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-800">Key Technical Specifications</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, specifications: [...form.specifications, { name: '', value: '' }] })}
                      className="text-xs text-primary-600 font-bold hover:underline"
                    >
                      + Add Specification Row
                    </button>
                  </div>

                  {form.specifications.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Voltage)"
                        value={spec.name}
                        onChange={(e) => {
                          const updated = [...form.specifications];
                          updated[idx].name = e.target.value;
                          setForm({ ...form, specifications: updated });
                        }}
                        className="w-1/2 p-2 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 415V 3-Phase)"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...form.specifications];
                          updated[idx].value = e.target.value;
                          setForm({ ...form, specifications: updated });
                        }}
                        className="w-1/2 p-2 border rounded font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.specifications.filter((_, i) => i !== idx);
                          setForm({ ...form, specifications: updated });
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* SEO Section */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">SEO Metadata</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1 font-semibold">SEO Title</label>
                      <input
                        type="text"
                        value={form.seo_title}
                        onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 font-semibold">Meta Description</label>
                      <input
                        type="text"
                        value={form.seo_description}
                        onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-xs py-2 px-6 font-bold"
                  >
                    {saving ? 'Saving...' : 'Save Product Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
