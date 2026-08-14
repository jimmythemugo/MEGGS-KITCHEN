import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Flame, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/use-data';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface TodaysDealsProps {
  onQuickView?: (product: Product) => void;
}

export function TodaysDeals({ onQuickView }: TodaysDealsProps) {
  const { products } = useProducts({ limit: 40 });
  
  // Filter products with deals/compare_at_price
  const dealProducts = products.filter(p => p.compare_at_price && p.compare_at_price > p.price).slice(0, 5);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (dealProducts.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        
        {/* Decorative Background Accent */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Section Header with Countdown Timer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/20 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider mb-2 backdrop-blur-md">
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
              <span>Limited Time Flash Sales</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Today's Special Kitchenware Deals
            </h2>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 bg-navy-950/40 p-3 rounded-2xl border border-white/20 backdrop-blur-md">
            <Clock className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200 hidden sm:inline">
              Offers End In:
            </span>
            <div className="flex items-center gap-1 font-mono font-extrabold text-sm sm:text-base">
              <span className="bg-white text-navy-950 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-inner">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white text-navy-950 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-inner">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white text-navy-950 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-inner text-red-600">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Deal Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {dealProducts.map((product) => (
            <div key={product.id} className="bg-white text-navy-950 rounded-2xl overflow-hidden shadow-md">
              <ProductCard product={product} onQuickView={onQuickView} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
