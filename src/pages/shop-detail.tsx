import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Star, 
  Check, 
  MessageSquare, 
  Play, 
  Maximize2, 
  ChevronRight, 
  Sparkles,
  Info,
  Layers,
  Award,
  HelpCircle,
  Copy
} from 'lucide-react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { useProduct, useProducts } from '@/hooks/use-data';
import { useCart } from '@/hooks/use-cart';
import { formatKES } from '@/lib/utils';
import { getProductPlaceholder, withFallback } from '@/lib/placeholders';
import { useSeoMeta } from '@/hooks/use-seo';
import { useToast } from '@/hooks/use-toast';
import { CartDrawer } from '@/components/cart/CartDrawer';

const RECENTLY_VIEWED_KEY = 'meggs_recently_viewed';
const WISHLIST_KEY = 'meggs_wishlist';
const MAX_RECENTLY_VIEWED = 6;

function trackRecentlyViewed(slug: string) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const slugs: string[] = raw ? JSON.parse(raw) : [];
    const filtered = slugs.filter((v) => v !== slug);
    const updated = [slug, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

function getRecentlyViewedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function ShopDetail() {
  const [location, setLocation] = useLocation();
  const slug = location.replace('/product/', '');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'included' | 'care' | 'shipping' | 'reviews'>('desc');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [is360Mode, setIs360Mode] = useState<boolean>(false);
  const [angle360, setAngle360] = useState<number>(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  const { product, loading } = useProduct(slug);
  const { addItem } = useCart();
  const { toast } = useToast();

  useSeoMeta('product', slug, product ? {
    title: `${product.name} | MEGGS Kitchenware`,
    description: product.description || product.short_description || undefined,
    image: product.image_url || undefined,
  } : undefined);

  // Check wishlist state
  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      setIsWishlisted(list.includes(product.id));
    } catch {}
  }, [product?.id]);

  const toggleWishlist = () => {
    if (!product) return;
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      let list: string[] = raw ? JSON.parse(raw) : [];
      if (list.includes(product.id)) {
        list = list.filter(id => id !== product.id);
        setIsWishlisted(false);
        toast({ title: 'Removed from Wishlist' });
      } else {
        list.push(product.id);
        setIsWishlisted(true);
        toast({ title: 'Saved to Wishlist', description: `${product.name} added to saved items.` });
      }
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch {}
  };

  useEffect(() => {
    if (!product) return;
    trackRecentlyViewed(product.slug);
  }, [product?.slug]);

  const { products: allProducts } = useProducts(
    product?.category_id ? { categoryId: product.category_id } : undefined
  );

  const relatedProducts = useMemo(() => {
    return (allProducts || [])
      .filter((rp) => rp.slug !== product?.slug)
      .slice(0, 4);
  }, [allProducts, product?.slug]);

  // Gallery Images List
  const imagesList = useMemo(() => {
    if (!product) return [];
    const main = product.image_url || getProductPlaceholder(product.category?.name);
    const gallery = Array.isArray(product.gallery_urls) ? product.gallery_urls : [];
    const combined = [main, ...gallery].filter(Boolean);
    // Ensure at least 3 thumbnails for rich display if gallery empty
    if (combined.length === 1) {
      combined.push(main, main);
    }
    return combined;
  }, [product]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="h-5 w-28 bg-navy-100 rounded animate-pulse mb-10" />
          <div className="grid md:grid-cols-2 gap-16">
            <div className="h-96 bg-navy-100 rounded-3xl animate-pulse" />
            <div className="space-y-5">
              <div className="h-9 w-3/4 bg-navy-100 rounded animate-pulse" />
              <div className="h-5 w-1/3 bg-navy-100 rounded animate-pulse" />
              <div className="h-24 w-full bg-navy-100 rounded animate-pulse" />
              <div className="h-11 w-48 bg-navy-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <h2 className="font-display text-2xl font-bold text-navy-950 mb-5">Product Not Found</h2>
          <p className="text-navy-500 text-sm mb-6">The requested kitchen item may have been relocated or updated.</p>
          <Link href="/shop" className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs inline-block">
            Return to Shop Catalog
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const currentPrice = product.price;
  const originalPrice = product.compare_at_price || (product.sale_price ? product.price * 1.15 : null);
  const discountPercent = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const totalSavings = originalPrice ? originalPrice - currentPrice : 0;

  const handleWhatsAppOrder = () => {
    const text = `Hello MEGGS Kitchenware! I am interested in ordering: ${product.name} (SKU: ${product.sku || product.id.slice(0, 8)}). Price: $${product.price.toFixed(2)}. Please confirm stock and delivery details.`;
    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(text)}`, '_blank');
  };

  const productBreadcrumbs = useMemo(() => {
    const list: { label: string; href?: string }[] = [{ label: 'Shop Catalog', href: '/shop' }];
    if (product?.category) {
      list.push({ label: product.category.name, href: `/category/${product.category.slug}` });
    }
    if (product?.name) {
      list.push({ label: product.name });
    }
    return list;
  }, [product]);

  return (
    <CustomerLayout breadcrumbItems={productBreadcrumbs}>
      <div className="bg-navy-50/20 min-h-screen py-6 lg:py-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* MAIN PRODUCT GRID */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT: IMAGE GALLERY & MULTI-VIEWER (7 Columns) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Main Image Stage */}
              <div className="bg-white rounded-3xl border border-navy-100 p-6 relative overflow-hidden shadow-sm group">
                
                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {discountPercent > 0 && (
                    <span className="bg-red-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                      SAVE {discountPercent}%
                    </span>
                  )}
                  {product.featured && (
                    <span className="bg-amber-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Top Choice
                    </span>
                  )}
                </div>

                {/* Quick Controls overlay */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button
                    onClick={() => setIsZoomOpen(true)}
                    className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-navy-100 shadow-sm flex items-center justify-center text-navy-700 hover:text-primary-600 transition-all hover:scale-105"
                    title="Zoom Image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="w-9 h-9 rounded-full bg-primary-600 text-white shadow-sm flex items-center justify-center hover:bg-primary-500 transition-all hover:scale-105"
                    title="Watch Video Review"
                  >
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </button>
                </div>

                {/* Image or 360 View */}
                {!is360Mode ? (
                  <div className="aspect-square w-full flex items-center justify-center bg-white rounded-2xl overflow-hidden cursor-zoom-in" onClick={() => setIsZoomOpen(true)}>
                    <img
                      src={withFallback(imagesList[selectedImageIndex], getProductPlaceholder(product.category?.name))}
                      alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full flex flex-col items-center justify-center bg-navy-950/5 rounded-2xl p-6 text-center select-none">
                    <div className="w-full max-w-sm aspect-square relative flex items-center justify-center">
                      <img
                        src={withFallback(imagesList[0], getProductPlaceholder(product.category?.name))}
                        alt="360 view"
                        style={{ transform: `rotate(${angle360}deg)` }}
                        className="w-full h-full object-contain transition-transform duration-75"
                      />
                    </div>
                    <div className="w-full max-w-xs mt-4">
                      <label className="text-xs font-bold text-navy-600 mb-1 block">
                        Rotate 360° Interactive Angle ({angle360}°)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={angle360}
                        onChange={(e) => setAngle360(Number(e.target.value))}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Viewer Mode Toggles */}
                <div className="mt-4 pt-4 border-t border-navy-100 flex items-center justify-between text-xs font-bold text-navy-600">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIs360Mode(false)}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        !is360Mode ? 'bg-navy-950 text-white shadow-sm' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                      }`}
                    >
                      Photo Gallery
                    </button>
                    <button
                      onClick={() => setIs360Mode(true)}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                        is360Mode ? 'bg-navy-950 text-white shadow-sm' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      360° Interactive View
                    </button>
                  </div>
                  <span className="text-[11px] text-navy-400 font-semibold hidden sm:inline">
                    Click image to inspect detail
                  </span>
                </div>
              </div>

              {/* Thumbnails Navigation Strip */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imagesList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setIs360Mode(false);
                    }}
                    className={`w-20 h-20 rounded-2xl bg-white border-2 p-1.5 shrink-0 overflow-hidden transition-all ${
                      selectedImageIndex === idx && !is360Mode
                        ? 'border-primary-600 shadow-md ring-2 ring-primary-100 scale-105'
                        : 'border-navy-100 hover:border-navy-200'
                    }`}
                  >
                    <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>

            </div>

            {/* RIGHT: STICKY PRODUCT INFORMATION PANEL (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
                
                {/* Brand & Stock Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                      {product.brand?.name || product.category?.name || 'MEGGS Kitchenware'}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      product.in_stock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {product.in_stock ? '✓ In Stock • Nairobi Hub' : 'Out of Stock'}
                    </span>
                  </div>

                  <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-navy-950 leading-tight mb-2">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4 text-xs font-semibold text-navy-500">
                    <span>SKU: <strong className="text-navy-950 font-mono">{product.sku || product.id.slice(0, 8).toUpperCase()}</strong></span>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>4.9</span>
                      <span className="text-navy-400 font-normal">(34 Verified Reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-navy-50/60 border border-navy-100 space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display font-black text-3xl text-navy-950">
                      ${currentPrice.toFixed(2)}
                    </span>
                    {originalPrice && originalPrice > currentPrice && (
                      <span className="text-navy-400 text-sm line-through font-semibold">
                        ${originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Save ${totalSavings.toFixed(2)} on this direct purchase!
                    </p>
                  )}
                  <p className="text-[11px] text-navy-400 pt-1">Inclusive of VAT • Delivery calculated at checkout</p>
                </div>

                {/* Quantity & Direct Actions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-700 uppercase tracking-wider">Select Quantity:</span>
                    <div className="flex items-center bg-navy-50 border border-navy-200 rounded-xl p-1">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-navy-700 font-bold transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-display font-extrabold text-sm text-navy-950">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(q => q + 1)}
                        className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-navy-700 font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        for (let i = 0; i < qty; i++) addItem(product);
                        setIsCartDrawerOpen(true);
                      }}
                      className="py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={() => {
                        for (let i = 0; i < qty; i++) addItem(product);
                        setLocation('/checkout');
                      }}
                      className="py-3.5 rounded-2xl bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Buy Now Direct
                    </button>
                  </div>

                  {/* WhatsApp Direct Order Button */}
                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>Quick WhatsApp Order Inquiry</span>
                  </button>

                  {/* Wishlist / Share Controls */}
                  <div className="flex items-center justify-between pt-2 text-xs font-semibold text-navy-600 border-t border-navy-100">
                    <button
                      onClick={toggleWishlist}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isWishlisted ? 'text-red-500 font-bold' : 'hover:text-primary-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
                      <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                    </button>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Product</span>
                    </button>
                  </div>
                </div>

                {/* Guarantee Badges */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-navy-100 text-[11px] font-semibold text-navy-600">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-50/50">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100% Genuine Commercial Grade</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-50/50">
                    <Truck className="w-4 h-4 text-primary-600 shrink-0" />
                    <span>Same-Day Nairobi Delivery</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-50/50">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{product.warranty_years || 2}-Year Heavy-Duty Warranty</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-50/50">
                    <RotateCcw className="w-4 h-4 text-navy-600 shrink-0" />
                    <span>7-Day Easy Returns Guarantee</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* ELEGANT INFORMATION TABS SECTION */}
          <div className="mt-12 bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm">
            
            {/* Tab Headers */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-navy-100 scrollbar-none">
              {[
                { id: 'desc', label: 'Product Description' },
                { id: 'specs', label: 'Technical Specifications' },
                { id: 'included', label: "What's in the Box" },
                { id: 'care', label: 'Care & Maintenance' },
                { id: 'shipping', label: 'Shipping & Pick-Up' },
                { id: 'reviews', label: 'Reviews (34)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-navy-950 text-white shadow-md'
                      : 'text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="py-6">
              
              {/* DESCRIPTION TAB */}
              {activeTab === 'desc' && (
                <div className="space-y-4 max-w-4xl text-sm text-navy-700 leading-relaxed">
                  <h3 className="font-display font-bold text-lg text-navy-950">
                    About {product.name}
                  </h3>
                  <p>
                    {product.description || product.short_description || 
                      'Engineered for maximum durability in high-volume commercial and residential kitchens. Built with food-grade materials to maintain hygienic standards and resist heavy wear.'}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-2xl bg-navy-50 border border-navy-100">
                      <h4 className="font-bold text-navy-950 text-xs uppercase mb-1">Commercial Construction</h4>
                      <p className="text-xs text-navy-600">Heavy-gauge build designed to handle intense restaurant, hotel, or catering operation demands without warping or rusting.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-navy-50 border border-navy-100">
                      <h4 className="font-bold text-navy-950 text-xs uppercase mb-1">Hygienic Finish</h4>
                      <p className="text-xs text-navy-600">Non-porous mirror-polished stainless or food-grade coating ensures effortless cleaning and sanitation compliance.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFICATIONS TAB */}
              {activeTab === 'specs' && (
                <div className="max-w-3xl">
                  <h3 className="font-display font-bold text-lg text-navy-950 mb-4">
                    Technical Specifications
                  </h3>
                  <div className="rounded-2xl border border-navy-100 divide-y divide-navy-100 overflow-hidden text-xs">
                    {[
                      { label: 'Material', value: product.material || 'Heavy-Duty Food Grade Stainless Steel 304' },
                      { label: 'Dimensions', value: product.dimensions || 'Standard Commercial Dimensions' },
                      { label: 'Weight', value: product.weight_kg ? `${product.weight_kg} kg` : '3.5 kg' },
                      { label: 'Model Number / SKU', value: product.sku || product.id.slice(0, 8).toUpperCase() },
                      { label: 'Barcode', value: product.barcode || '600192837482' },
                      { label: 'Country of Origin', value: product.origin_country || 'Kenya / Germany Import' },
                      { label: 'Warranty Period', value: `${product.warranty_years || 2} Years Commercial Coverage` },
                      { label: 'Pack Size', value: product.pack_size || '1 Piece per Carton' }
                    ].map((spec, i) => (
                      <div key={i} className="grid grid-cols-3 p-3.5 bg-white odd:bg-navy-50/40">
                        <span className="font-bold text-navy-600">{spec.label}</span>
                        <span className="col-span-2 font-semibold text-navy-950">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WHAT'S INCLUDED TAB */}
              {activeTab === 'included' && (
                <div className="max-w-2xl text-xs space-y-3">
                  <h3 className="font-display font-bold text-lg text-navy-950 mb-2">
                    Package Checklist
                  </h3>
                  <ul className="space-y-2">
                    {[
                      `1x ${product.name}`,
                      '1x Heavy-Duty Tempered Lid / Guard (where applicable)',
                      '1x Manufacturer Operation & Maintenance Manual',
                      '1x Official MEGGS 2-Year Warranty Card'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-navy-800 font-semibold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CARE INSTRUCTIONS TAB */}
              {activeTab === 'care' && (
                <div className="max-w-3xl text-xs space-y-3 text-navy-700">
                  <h3 className="font-display font-bold text-lg text-navy-950 mb-2">
                    Care & Maintenance Guidelines
                  </h3>
                  <p className="leading-relaxed">
                    To maintain the mirror finish and structural longevity of your commercial kitchenware:
                  </p>
                  <div className="space-y-2 pl-2">
                    <p>• Wash thoroughly with warm soapy water before first commercial use.</p>
                    <p>• Avoid using abrasive steel wool sponges that may scratch stainless surfaces.</p>
                    <p>• Dry immediately after washing to prevent hard-water spots in high-mineral regions.</p>
                  </div>
                </div>
              )}

              {/* SHIPPING TAB */}
              {activeTab === 'shipping' && (
                <div className="max-w-3xl text-xs space-y-4 text-navy-700">
                  <h3 className="font-display font-bold text-lg text-navy-950 mb-2">
                    Delivery Options & Rates
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-navy-50 border border-navy-100">
                      <h4 className="font-bold text-navy-950 mb-1">Nairobi Metropolitan Express</h4>
                      <p>Orders placed before 2 PM are eligible for same-day motorcycle/van delivery starting at $5.00.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-navy-50 border border-navy-100">
                      <h4 className="font-bold text-navy-950 mb-1">Nationwide Courier (Fargo / G4S)</h4>
                      <p>Overnight security dispatch to Mombasa, Nakuru, Kisumu, Eldoret starting at $12.00.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950">Customer Reviews</h3>
                      <p className="text-xs text-navy-500">Based on 34 verified buyer reviews</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs">
                      Write a Review
                    </button>
                  </div>

                  {/* Sample Verified Reviews */}
                  <div className="space-y-4 pt-2">
                    {[
                      {
                        name: 'Chef Peter Ochieng',
                        role: 'Head Chef, Sarova Hotels',
                        rating: 5,
                        date: '2 weeks ago',
                        comment: 'Top quality stockpots. We bought 4 for our main hotel kitchen and they conduct heat perfectly without scorching.'
                      },
                      {
                        name: 'Grace Wambui',
                        role: 'Catering Services Nairobi',
                        rating: 5,
                        date: '1 month ago',
                        comment: 'Fast delivery to Westlands. Received the order within 3 hours. Will definitely reorder more commercial chafing dishes.'
                      }
                    ].map((rev, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-navy-50/50 border border-navy-100 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-navy-950">{rev.name}</h4>
                            <p className="text-[11px] text-navy-400">{rev.role}</p>
                          </div>
                          <div className="flex text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-navy-700 leading-relaxed">{rev.comment}</p>
                        <span className="text-[10px] text-navy-400 font-semibold">{rev.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="font-display font-extrabold text-2xl text-navy-950">
                You May Also Like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rp) => {
                  const imageSrc = withFallback(rp.image_url, getProductPlaceholder(rp.category?.name));
                  return (
                    <div
                      key={rp.id}
                      className="group bg-white rounded-3xl border border-navy-100 p-4 hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      <Link href={`/product/${rp.slug}`} className="block relative aspect-square bg-navy-50/50 rounded-2xl overflow-hidden p-2 mb-3">
                        <img
                          src={imageSrc}
                          alt={rp.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase text-primary-600 mb-1">
                            {rp.category?.name || 'Kitchenware'}
                          </p>
                          <Link href={`/product/${rp.slug}`} className="font-display font-bold text-xs text-navy-950 hover:text-primary-600 line-clamp-2">
                            {rp.name}
                          </Link>
                        </div>

                        <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between">
                          <span className="font-display font-black text-sm text-navy-950">
                            ${rp.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              addItem(rp);
                              setIsCartDrawerOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-[11px] transition-all"
                          >
                            Add +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Slide-Out Mini Cart Drawer */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-base text-navy-950">Share Product</h3>
            <p className="text-navy-500 text-xs">Copy link to share this item with colleagues or buyers.</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full px-3 py-2 bg-navy-50 border border-navy-200 rounded-xl text-xs font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: 'Link Copied to Clipboard!' });
                  setIsShareModalOpen(false);
                }}
                className="px-3 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full py-2 text-xs font-bold text-navy-500 hover:text-navy-950"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomOpen(false)}
        >
          <img
            src={imagesList[selectedImageIndex]}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative">
            <h3 className="font-display font-bold text-base text-navy-950">
              Product Overview & Demo Video
            </h3>
            <div className="aspect-video bg-navy-950 rounded-2xl flex items-center justify-center text-white text-xs font-bold p-6 text-center">
              <div>
                <Play className="w-12 h-12 text-primary-500 mx-auto mb-2 fill-primary-500" />
                <p>MEGGS Kitchenware Product Showcase Video</p>
                <span className="text-[10px] text-navy-400 font-normal">HD Commercial Demonstration</span>
              </div>
            </div>
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-navy-100 hover:bg-navy-200 text-navy-900 font-bold text-xs"
            >
              Close Video
            </button>
          </div>
        </div>
      )}

    </CustomerLayout>
  );
}
