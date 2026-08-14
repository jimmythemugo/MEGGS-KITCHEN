import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { SlidersHorizontal, X, ArrowRight, Trash2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';

export function ComparisonBar() {
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const loadCompareItems = () => {
    try {
      const stored = localStorage.getItem('meggs_compare');
      if (stored) {
        const parsed: Product[] = JSON.parse(stored);
        if (Array.isArray(parsed)) setCompareItems(parsed);
      } else {
        setCompareItems([]);
      }
    } catch (e) {
      setCompareItems([]);
    }
  };

  useEffect(() => {
    loadCompareItems();
    window.addEventListener('storage', loadCompareItems);
    window.addEventListener('meggs_compare_updated', loadCompareItems);
    return () => {
      window.removeEventListener('storage', loadCompareItems);
      window.removeEventListener('meggs_compare_updated', loadCompareItems);
    };
  }, []);

  const removeItem = (id: string) => {
    try {
      const updated = compareItems.filter(item => item.id !== id);
      setCompareItems(updated);
      localStorage.setItem('meggs_compare', JSON.stringify(updated));
      window.dispatchEvent(new Event('meggs_compare_updated'));
    } catch (e) {}
  };

  const clearAll = () => {
    try {
      localStorage.removeItem('meggs_compare');
      setCompareItems([]);
      window.dispatchEvent(new Event('meggs_compare_updated'));
    } catch (e) {}
  };

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[92%] bg-navy-950 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/20 backdrop-blur-lg font-sans animate-in slide-in-from-bottom duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-accent-500 text-white flex items-center justify-center font-bold shadow-md">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-white">
              Compare Kitchenware ({compareItems.length}/4)
            </h4>
            <p className="text-[11px] text-navy-200">Side-by-side spec comparison table</p>
          </div>
        </div>

        {/* Selected Product Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-md scrollbar-none py-1">
          {compareItems.map((item) => (
            <div
              key={item.id}
              className="relative group bg-white/10 rounded-xl p-1.5 flex items-center gap-2 pr-3 shrink-0 border border-white/10"
            >
              <img
                src={withFallback(item.image_url, getProductPlaceholder(item.category?.name))}
                alt={item.name}
                className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
              />
              <span className="text-[11px] font-semibold text-white max-w-[100px] truncate">
                {item.name}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-navy-300 hover:text-red-400 p-0.5 transition-colors"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearAll}
            className="p-2 text-navy-300 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Clear comparison"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear</span>
          </button>

          <Link
            href="/compare"
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
