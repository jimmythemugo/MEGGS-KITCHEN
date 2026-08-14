import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Heart, Eye, ShoppingCart, Star, Check, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Check wishlist & compare status from localStorage
  useEffect(() => {
    const checkStatus = () => {
      try {
        const storedWishlist = localStorage.getItem('meggs_wishlist');
        if (storedWishlist) {
          const list: string[] = JSON.parse(storedWishlist);
          setIsWishlisted(list.includes(product.id));
        }

        const storedCompare = localStorage.getItem('meggs_compare');
        if (storedCompare) {
          const list: Product[] = JSON.parse(storedCompare);
          setIsCompared(list.some(p => p.id === product.id));
        }
      } catch (e) {}
    };

    checkStatus();
    window.addEventListener('storage', checkStatus);
    window.addEventListener('meggs_compare_updated', checkStatus);
    return () => {
      window.removeEventListener('storage', checkStatus);
      window.removeEventListener('meggs_compare_updated', checkStatus);
    };
  }, [product.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('meggs_wishlist');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (list.includes(product.id)) {
        list = list.filter(id => id !== product.id);
        setIsWishlisted(false);
      } else {
        list.push(product.id);
        setIsWishlisted(true);
      }
      localStorage.setItem('meggs_wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('meggs_compare');
      let list: Product[] = stored ? JSON.parse(stored) : [];
      if (list.some(p => p.id === product.id)) {
        list = list.filter(p => p.id !== product.id);
        setIsCompared(false);
      } else {
        if (list.length >= 4) {
          alert('You can compare up to 4 products at a time.');
          return;
        }
        list.push(product);
        setIsCompared(true);
      }
      localStorage.setItem('meggs_compare', JSON.stringify(list));
      window.dispatchEvent(new Event('meggs_compare_updated'));
    } catch (e) {}
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);

    // Save to recently viewed
    try {
      const stored = localStorage.getItem('meggs_recently_viewed');
      let list: Product[] = stored ? JSON.parse(stored) : [];
      list = [product, ...list.filter(p => p.id !== product.id)].slice(0, 10);
      localStorage.setItem('meggs_recently_viewed', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const inStock = product.stock_status !== 'out_of_stock' && (product.inventory_quantity === undefined || product.inventory_quantity > 0);
  const isLowStock = product.inventory_quantity !== undefined && product.inventory_quantity > 0 && product.inventory_quantity <= 5;

  const imageSrc = withFallback(product.image_url, getProductPlaceholder(product.category?.name));
  const productDetailUrl = `/product/${product.slug}`;

  return (
    <div className="group relative bg-white rounded-2xl border border-navy-100 p-3 sm:p-4 flex flex-col justify-between hover:border-primary-500/50 hover:shadow-premium transition-all duration-300">
      
      {/* Top Badges & Actions */}
      <div className="relative w-full aspect-square bg-navy-50/50 rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center">
        
        {/* Badges Left */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-accent-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
              -{discountPercent}% OFF
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-primary-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm">
              NEW
            </span>
          )}
          {product.is_best_seller && (
            <span className="bg-amber-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm">
              TOP
            </span>
          )}
        </div>

        {/* Action Buttons Right */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isWishlisted 
                ? 'bg-accent-500 text-white shadow-sm' 
                : 'bg-white/90 hover:bg-white text-navy-600 shadow-sm hover:text-accent-500'
            }`}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Compare Button */}
          <button
            type="button"
            onClick={toggleCompare}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isCompared 
                ? 'bg-navy-900 text-white shadow-sm' 
                : 'bg-white/90 hover:bg-white text-navy-600 shadow-sm hover:text-navy-900'
            }`}
            title={isCompared ? "Remove from Compare" : "Compare Product"}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick View Trigger on Hover */}
        {onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-navy-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-md"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        )}

        {/* Product Image */}
        <Link href={productDetailUrl} className="w-full h-full flex items-center justify-center">
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Product Content Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Stock */}
          <div className="flex items-center justify-between text-[11px] text-navy-400 mb-1">
            <span className="font-medium truncate">{product.category?.name || 'Kitchenware'}</span>
            {isLowStock ? (
              <span className="text-amber-600 font-bold text-[10px] flex items-center gap-0.5">
                <ShieldAlert className="w-3 h-3" />
                Only {product.inventory_quantity} left
              </span>
            ) : inStock ? (
              <span className="text-emerald-600 font-bold text-[10px]">In Stock</span>
            ) : (
              <span className="text-rose-500 font-bold text-[10px]">Backorder</span>
            )}
          </div>

          {/* Product Title */}
          <Link href={productDetailUrl}>
            <h3 className="font-display font-bold text-xs sm:text-sm text-navy-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Ratings */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-navy-600">(4.9)</span>
          </div>
        </div>

        {/* Pricing & Add To Cart Button */}
        <div className="mt-3 pt-2 border-t border-navy-50 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-display font-extrabold text-sm sm:text-base text-navy-950">
                KSh {product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-navy-400 line-through">
                  KSh {product.compare_at_price?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              addedAnimation 
                ? 'bg-emerald-600 text-white' 
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
