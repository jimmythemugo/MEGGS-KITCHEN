import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { 
  Filter, 
  Grid3X3, 
  Grid2X2, 
  List, 
  SlidersHorizontal, 
  Search, 
  X, 
  Star, 
  Check, 
  Package, 
  RotateCcw,
  Sparkles,
  ShoppingCart,
  Flame,
  Award,
  Tag
} from 'lucide-react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductCard } from '@/components/home/ProductCard';
import { QuickViewModal } from '@/components/home/QuickViewModal';
import { ComparisonBar } from '@/components/comparison/ComparisonBar';
import { useProducts, useCategories, useBrands } from '@/hooks/use-data';
import type { Product } from '@/lib/types';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';
import { useCart } from '@/hooks/use-cart';

export default function ShopPage() {
  const [location] = useLocation();
  const { addItem } = useCart();

  // Parse initial query parameters from URL
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialBrand = searchParams.get('brand') || '';

  // Data fetching from Database backend
  const { products, loading: loadingProducts } = useProducts({ limit: 300 });
  const { categories } = useCategories();
  const { brands } = useBrands();

  // Filter & Layout States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [priceMax, setPriceMax] = useState<number>(150000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [clearanceOnly, setClearanceOnly] = useState<boolean>(false);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'compact' | 'list'>('grid');
  
  // UI States
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 16;

  // Highest price calculation for dynamic slider max
  const highestProductPrice = useMemo(() => {
    if (products.length === 0) return 150000;
    const maxVal = Math.max(...products.map(p => p.price || 0));
    return Math.max(maxVal, 10000);
  }, [products]);

  // Set default price filter when products finish loading
  useEffect(() => {
    if (highestProductPrice > 0) {
      setPriceMax(highestProductPrice);
    }
  }, [highestProductPrice]);

  // Sync states when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedCategory(params.get('category') || '');
    setSearchQuery(params.get('search') || '');
    setSelectedBrand(params.get('brand') || '');
    setCurrentPage(1);
  }, [location]);

  // Active Category Object
  const currentCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find(c => c.slug === selectedCategory || c.id === selectedCategory) || null;
  }, [selectedCategory, categories]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category Filter
      if (selectedCategory) {
        const matchesCategory = 
          product.category?.slug === selectedCategory || 
          product.category_id === selectedCategory ||
          product.category?.id === selectedCategory;
        if (!matchesCategory) return false;
      }

      // Brand Filter
      if (selectedBrand) {
        const matchesBrand = 
          product.brand?.slug === selectedBrand || 
          product.brand_id === selectedBrand ||
          product.brand?.name.toLowerCase() === selectedBrand.toLowerCase();
        if (!matchesBrand) return false;
      }

      // Search Filter (Name, SKU, Barcode, Brand, Description, Category, Tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCat = product.category?.name.toLowerCase().includes(q);
        const matchesBrandName = product.brand?.name?.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        const matchesSku = product.sku?.toLowerCase().includes(q);
        const matchesBarcode = product.barcode?.toLowerCase().includes(q);
        const matchesTags = Array.isArray(product.tags) && product.tags.some(t => 
          typeof t === 'string' ? (t as string).toLowerCase().includes(q) : (t as any)?.tag_name?.toLowerCase().includes(q)
        );
        
        if (!matchesName && !matchesCat && !matchesBrandName && !matchesDesc && !matchesSku && !matchesBarcode && !matchesTags) {
          return false;
        }
      }

      // Price Filter (KSh)
      if (product.price > priceMax) return false;

      // Stock Status Filter
      if (inStockOnly) {
        const inStock = product.stock_status !== 'out_of_stock' && (product.inventory_quantity === undefined || product.inventory_quantity > 0);
        if (!inStock) return false;
      }

      // Clearance / Deals Filter
      if (clearanceOnly) {
        const isDeal = product.is_clearance || (product.compare_at_price && product.compare_at_price > product.price);
        if (!isDeal) return false;
      }

      // Featured Filter
      if (featuredOnly && !product.featured && !product.is_featured) return false;

      // New Arrivals Filter
      if (newArrivalsOnly && !product.is_new_arrival) return false;

      // Minimum Rating Filter
      if (minRating > 0 && (product.rating || 4.5) < minRating) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'best_seller') return (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0);
      if (sortBy === 'highest_rated') return (b.rating || 4.5) - (a.rating || 4.5);
      if (sortBy === 'biggest_discount') {
        const discA = a.compare_at_price ? a.compare_at_price - a.price : 0;
        const discB = b.compare_at_price ? b.compare_at_price - b.price : 0;
        return discB - discA;
      }
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      // default: newest / display_order
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [
    products, 
    selectedCategory, 
    selectedBrand, 
    searchQuery, 
    priceMax, 
    inStockOnly, 
    clearanceOnly, 
    featuredOnly, 
    newArrivalsOnly, 
    minRating, 
    sortBy
  ]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchQuery('');
    setPriceMax(highestProductPrice);
    setInStockOnly(false);
    setClearanceOnly(false);
    setFeaturedOnly(false);
    setNewArrivalsOnly(false);
    setMinRating(0);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCategory || 
    selectedBrand || 
    searchQuery || 
    inStockOnly || 
    clearanceOnly || 
    featuredOnly || 
    newArrivalsOnly || 
    minRating > 0 || 
    priceMax < highestProductPrice
  );

  // Pagination slicing
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const breadcrumbItems = useMemo(() => {
    const list: { label: string; href?: string }[] = [{ label: 'Shop', href: '/shop' }];
    if (currentCategoryObj) {
      list.push({ label: currentCategoryObj.name });
    }
    return list;
  }, [currentCategoryObj]);

  return (
    <CustomerLayout breadcrumbItems={breadcrumbItems}>
      <div className="min-h-screen bg-navy-50/20 py-6 lg:py-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* CATEGORY HERO BANNER (When Category Selected) */}
          {currentCategoryObj ? (
            <div className="relative rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-primary-950 text-white p-6 sm:p-8 mb-8 overflow-hidden shadow-xl border border-navy-800">
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 text-accent-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Package className="w-4 h-4" />
                  <span>Category Catalog</span>
                </div>

                <h1 className="font-display font-black text-2xl sm:text-4xl text-white mb-2">
                  {currentCategoryObj.name}
                </h1>

                <p className="text-navy-200 text-xs sm:text-sm leading-relaxed mb-4">
                  {currentCategoryObj.description || 'Heavy-duty commercial kitchen equipment, cookery sets, appliances & dinnerware.'}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-semibold backdrop-blur-sm">
                    {filteredProducts.length} Products Available
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    In Stock in Nairobi
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* GENERAL SHOP HEADER */
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-navy-100 shadow-sm">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-black text-navy-950">
                  Kitchenware & Commercial Catalog
                </h1>
                <p className="text-navy-500 text-xs sm:text-sm mt-1">
                  Explore high-performance cookware, blenders, chef cutlery, glassware & hotel kitchen equipment.
                </p>
              </div>

              {/* Quick Search Input */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name, SKU, brand..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-navy-50/80 border border-navy-100 text-xs font-semibold text-navy-900 placeholder-navy-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MAIN TWO-COLUMN DISCOVERY LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* SIDEBAR FILTERS (DESKTOP) */}
            <aside className="hidden lg:block w-72 shrink-0 bg-white rounded-3xl border border-navy-100 p-6 shadow-sm sticky top-24 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-navy-100">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-navy-950">
                  <SlidersHorizontal className="w-4 h-4 text-primary-600" />
                  <span>Catalog Filters</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Category Tree Filter */}
              <div>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-navy-400 mb-3">
                  Categories
                </h4>
                <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      !selectedCategory 
                        ? 'bg-primary-600 text-white shadow-sm' 
                        : 'text-navy-700 hover:bg-navy-50'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className="text-[10px] opacity-80">({products.length})</span>
                  </button>

                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
                    const catCount = products.filter(p => p.category?.slug === cat.slug || p.category_id === cat.id || p.category?.id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(isSelected ? '' : cat.slug);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-primary-600 text-white font-bold shadow-sm' 
                            : 'text-navy-700 hover:bg-navy-50'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-navy-100 text-navy-600'}`}>
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Filter */}
              {brands.length > 0 && (
                <div className="pt-4 border-t border-navy-100">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-navy-400 mb-3">
                    Brands
                  </h4>
                  <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                    <button
                      onClick={() => {
                        setSelectedBrand('');
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        !selectedBrand ? 'bg-navy-100 text-navy-900 font-bold' : 'text-navy-600 hover:bg-navy-50'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => {
                      const isSelected = selectedBrand === b.slug || selectedBrand === b.name;
                      const brandCount = products.filter(p => p.brand?.slug === b.slug || p.brand_id === b.id || p.brand?.name.toLowerCase() === b.name.toLowerCase()).length;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedBrand(isSelected ? '' : b.slug);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                            isSelected ? 'bg-primary-50 text-primary-700 font-bold' : 'text-navy-600 hover:bg-navy-50'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          <span className="text-[10px] text-navy-400">({brandCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Range Filter (Kenyan Shillings KSh) */}
              <div className="pt-4 border-t border-navy-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-navy-400">
                    Max Price
                  </h4>
                  <span className="font-display font-extrabold text-xs text-navy-950">
                    KSh {priceMax.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max={highestProductPrice}
                  step="500"
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-navy-400 mt-1">
                  <span>KSh 100</span>
                  <span>KSh {highestProductPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Minimum Rating Filter */}
              <div className="pt-4 border-t border-navy-100">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-navy-400 mb-2">
                  Customer Rating
                </h4>
                <div className="space-y-1">
                  {[0, 4, 3].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => {
                        setMinRating(stars);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        minRating === stars ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200' : 'text-navy-700 hover:bg-navy-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {stars === 0 ? (
                          <span>All Ratings</span>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{stars}+ Stars & Up</span>
                          </>
                        )}
                      </div>
                      {minRating === stars && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Status Toggles */}
              <div className="pt-4 border-t border-navy-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-navy-700 hover:text-navy-950">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>In Stock Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-navy-700 hover:text-navy-950">
                  <input
                    type="checkbox"
                    checked={clearanceOnly}
                    onChange={(e) => {
                      setClearanceOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded text-accent-600 focus:ring-accent-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-accent-500" />
                    <span>On Sale & Deals</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-navy-700 hover:text-navy-950">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => {
                      setFeaturedOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>Featured Items</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-navy-700 hover:text-navy-950">
                  <input
                    type="checkbox"
                    checked={newArrivalsOnly}
                    onChange={(e) => {
                      setNewArrivalsOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>New Arrivals</span>
                </label>
              </div>

            </aside>

            {/* MAIN CATALOG CONTENT AREA */}
            <main className="flex-1 w-full space-y-6">
              
              {/* TOOLBAR (Item Count, Sort, Layout Switcher) */}
              <div className="bg-white rounded-2xl border border-navy-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Mobile Filter Trigger & Item Count */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                  <button
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    className="lg:hidden px-4 py-2 rounded-xl bg-navy-100 hover:bg-navy-200 text-navy-900 font-bold text-xs flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4 text-primary-600" />
                    <span>Filters {hasActiveFilters && '• Active'}</span>
                  </button>

                  <span className="text-xs font-bold text-navy-600">
                    Showing <strong className="text-navy-950">{filteredProducts.length}</strong> items
                  </span>
                </div>

                {/* Right Controls: Sort & Layout */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                  
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-400 hidden md:inline">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-navy-50 border border-navy-100 text-navy-900 font-semibold text-xs rounded-xl px-3 py-2 outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="newest">Newest & Featured</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="best_seller">Best Sellers</option>
                      <option value="highest_rated">Highest Rated</option>
                      <option value="biggest_discount">Biggest Discount</option>
                      <option value="alphabetical">Name (A-Z)</option>
                    </select>
                  </div>

                  {/* Layout mode switcher */}
                  <div className="flex items-center gap-1 bg-navy-50 p-1 rounded-xl border border-navy-100">
                    <button
                      onClick={() => setLayoutMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${layoutMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
                      title="Grid View"
                    >
                      <Grid2X2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLayoutMode('compact')}
                      className={`p-1.5 rounded-lg transition-all ${layoutMode === 'compact' ? 'bg-white text-primary-600 shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
                      title="Compact Grid"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={`p-1.5 rounded-lg transition-all ${layoutMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>

              {/* ACTIVE FILTER PILLS */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-navy-100 text-xs shadow-sm">
                  <span className="font-bold text-navy-400 mr-1">Active Filters:</span>

                  {selectedCategory && (
                    <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-bold flex items-center gap-1 border border-primary-200">
                      Category: {currentCategoryObj?.name || selectedCategory}
                      <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 hover:text-primary-950" /></button>
                    </span>
                  )}

                  {selectedBrand && (
                    <span className="px-3 py-1 rounded-full bg-navy-100 text-navy-800 font-bold flex items-center gap-1 border border-navy-200">
                      Brand: {selectedBrand}
                      <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3 hover:text-navy-950" /></button>
                    </span>
                  )}

                  {searchQuery && (
                    <span className="px-3 py-1 rounded-full bg-accent-50 text-accent-700 font-bold flex items-center gap-1 border border-accent-200">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 hover:text-accent-950" /></button>
                    </span>
                  )}

                  {priceMax < highestProductPrice && (
                    <span className="px-3 py-1 rounded-full bg-navy-100 text-navy-800 font-bold flex items-center gap-1 border border-navy-200">
                      Under KSh {priceMax.toLocaleString()}
                      <button onClick={() => setPriceMax(highestProductPrice)}><X className="w-3 h-3 hover:text-navy-950" /></button>
                    </span>
                  )}

                  {minRating > 0 && (
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold flex items-center gap-1 border border-amber-200">
                      {minRating}+ Stars
                      <button onClick={() => setMinRating(0)}><X className="w-3 h-3 hover:text-amber-950" /></button>
                    </span>
                  )}

                  {inStockOnly && (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1 border border-emerald-200">
                      In Stock
                      <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3 hover:text-emerald-950" /></button>
                    </span>
                  )}

                  {clearanceOnly && (
                    <span className="px-3 py-1 rounded-full bg-accent-50 text-accent-700 font-bold flex items-center gap-1 border border-accent-200">
                      On Sale
                      <button onClick={() => setClearanceOnly(false)}><X className="w-3 h-3 hover:text-accent-950" /></button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-navy-500 hover:text-red-600 underline ml-auto transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* PRODUCTS CATALOG GRID / LIST */}
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="bg-white rounded-2xl p-4 border border-navy-100 animate-pulse h-72" />
                  ))}
                </div>
              ) : paginatedProducts.length === 0 ? (
                /* Empty state when no products match filters */
                <div className="bg-white rounded-3xl border border-navy-100 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-navy-50 rounded-2xl text-navy-400 flex items-center justify-center mx-auto mb-4 border border-navy-100">
                    <Package className="w-8 h-8 text-navy-400" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-navy-950 mb-2">
                    No products match your search
                  </h3>
                  <p className="text-navy-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
                    We couldn't find any kitchen items matching your current filters. Try resetting search criteria to view all available products.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                /* Product Grid / List rendering */
                <div>
                  {layoutMode === 'list' ? (
                    /* LIST VIEW */
                    <div className="space-y-4">
                      {paginatedProducts.map((product) => {
                        const imageSrc = withFallback(product.image_url, getProductPlaceholder(product.category?.name));
                        const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);
                        return (
                          <div
                            key={product.id}
                            className="bg-white rounded-2xl border border-navy-100 p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-primary-500 transition-all shadow-sm group"
                          >
                            <img
                              src={imageSrc}
                              alt={product.name}
                              className="w-28 h-28 object-contain bg-navy-50/50 rounded-xl p-2 shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                                {product.category?.name || 'Kitchenware'}
                              </span>
                              <h3 className="font-display font-bold text-sm sm:text-base text-navy-950 group-hover:text-primary-600 line-clamp-1 mt-0.5">
                                {product.name}
                              </h3>
                              <p className="text-navy-500 text-xs line-clamp-2 mt-1">
                                {product.description || 'Commercial culinary grade equipment built for Nairobi kitchens.'}
                              </p>
                            </div>
                            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                              <div className="text-right">
                                <div className="font-display font-extrabold text-lg text-navy-950">
                                  KSh {product.price.toLocaleString()}
                                </div>
                                {hasDiscount && (
                                  <div className="text-xs text-navy-400 line-through">
                                    KSh {product.compare_at_price?.toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => addItem(product)}
                                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* GRID OR COMPACT GRID VIEW */
                    <div className={`grid gap-4 sm:gap-6 ${
                      layoutMode === 'compact' 
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' 
                        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    }`}>
                      {paginatedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onQuickView={setQuickViewProduct}
                        />
                      ))}
                    </div>
                  )}

                  {/* PAGINATION */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl border border-navy-200 text-navy-700 font-bold text-xs disabled:opacity-40 hover:bg-navy-50 transition-colors"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                            currentPage === p 
                              ? 'bg-primary-600 text-white shadow-sm' 
                              : 'bg-white border border-navy-100 text-navy-700 hover:bg-navy-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl border border-navy-200 text-navy-700 font-bold text-xs disabled:opacity-40 hover:bg-navy-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}

                </div>
              )}

            </main>

          </div>

        </div>
      </div>

      {/* QUICK VIEW MODAL */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* FLOATING COMPARISON BAR */}
      <ComparisonBar />

    </CustomerLayout>
  );
}
