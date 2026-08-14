import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Heart, ShoppingCart, Trash2, ArrowRight, ShieldCheck, Sparkles, Package } from 'lucide-react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { useProducts } from '@/hooks/use-data';
import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';
import { ComparisonBar } from '@/components/comparison/ComparisonBar';

export default function WishlistPage() {
  const { products: allProducts, loading } = useProducts({ limit: 100 });
  const { addItem } = useCart();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);

  const loadWishlist = () => {
    try {
      const stored = localStorage.getItem('meggs_wishlist');
      if (stored) {
        setWishlistIds(JSON.parse(stored));
      } else {
        setWishlistIds([]);
      }
    } catch (e) {
      setWishlistIds([]);
    }
  };

  useEffect(() => {
    loadWishlist();
    window.addEventListener('storage', loadWishlist);
    return () => window.removeEventListener('storage', loadWishlist);
  }, []);

  const wishlistedProducts = allProducts.filter(p => wishlistIds.includes(p.id));

  const removeFromWishlist = (id: string) => {
    try {
      const updated = wishlistIds.filter(wId => wId !== id);
      setWishlistIds(updated);
      localStorage.setItem('meggs_wishlist', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const clearWishlist = () => {
    try {
      setWishlistIds([]);
      localStorage.removeItem('meggs_wishlist');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const handleAddAllToCart = () => {
    wishlistedProducts.forEach(product => {
      addItem(product);
    });
    setAddedAllSuccess(true);
    setTimeout(() => setAddedAllSuccess(false), 3000);
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-navy-50/30 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-navy-100 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-accent-500 font-bold text-xs uppercase tracking-wider mb-1">
                <Heart className="w-4 h-4 fill-accent-500" />
                <span>Saved Kitchen Essentials</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
                My Wishlist ({wishlistedProducts.length})
              </h1>
              <p className="text-navy-500 text-xs sm:text-sm mt-1">
                Keep track of kitchen items, cookware, and commercial equipment for future purchases.
              </p>
            </div>

            {wishlistedProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={clearWishlist}
                  className="px-4 py-2.5 rounded-xl border border-navy-200 hover:border-red-300 hover:bg-red-50 text-navy-600 hover:text-red-600 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>

                <button
                  onClick={handleAddAllToCart}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                    addedAllSuccess ? 'bg-emerald-600' : 'bg-primary-600 hover:bg-primary-500'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{addedAllSuccess ? 'All Items Added!' : 'Add All to Cart'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 border border-navy-100 animate-pulse h-80" />
              ))}
            </div>
          ) : wishlistedProducts.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-navy-100 p-12 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-navy-50 rounded-2xl text-navy-400 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-xl text-navy-900 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-navy-500 text-sm mb-6 max-w-md mx-auto">
                Explore our catalog of pots, blenders, chef knives, chafing dishes, and glassware to save your favorites.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <span>Discover Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Wishlist Products Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistedProducts.map((product) => {
                const imageSrc = withFallback(product.image_url, getProductPlaceholder(product.category?.name));
                const productUrl = `/product/${product.slug}`;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-navy-100 p-4 flex flex-col justify-between hover:shadow-md transition-all relative group"
                  >
                    {/* Delete button */}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 text-navy-400 hover:text-red-500 hover:bg-red-50 border border-navy-100 shadow-sm transition-all"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {/* Image */}
                      <Link href={productUrl} className="block aspect-square rounded-xl bg-navy-50/50 p-2 mb-3 overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Category */}
                      <p className="text-[11px] font-bold text-primary-600 uppercase tracking-wider mb-1">
                        {product.category?.name || 'Kitchenware'}
                      </p>

                      {/* Title */}
                      <Link href={productUrl}>
                        <h3 className="font-display font-bold text-sm text-navy-900 group-hover:text-primary-600 line-clamp-2 mb-2">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="font-display font-extrabold text-base text-navy-950">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-xs text-navy-400 line-through">
                            ${product.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addItem(product)}
                      className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
      <ComparisonBar />
    </CustomerLayout>
  );
}
