import { useState, useEffect } from 'react';
import { History, Trash2 } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface RecentlyViewedProps {
  onQuickView?: (product: Product) => void;
}

export function RecentlyViewed({ onQuickView }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadRecent = () => {
      try {
        const stored = localStorage.getItem('meggs_recently_viewed');
        if (stored) {
          const list: Product[] = JSON.parse(stored);
          if (Array.isArray(list)) setRecentProducts(list);
        }
      } catch (e) {}
    };

    loadRecent();
    window.addEventListener('storage', loadRecent);
    return () => window.removeEventListener('storage', loadRecent);
  }, []);

  const clearHistory = () => {
    try {
      localStorage.removeItem('meggs_recently_viewed');
      setRecentProducts([]);
    } catch (e) {}
  };

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-100">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600" />
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-950">
            Recently Viewed Items
          </h2>
        </div>

        <button
          onClick={clearHistory}
          className="text-xs font-semibold text-navy-500 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {recentProducts.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}
