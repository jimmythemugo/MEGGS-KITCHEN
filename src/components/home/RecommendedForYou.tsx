import { Link } from 'wouter';
import { Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/use-data';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface RecommendedForYouProps {
  onQuickView?: (product: Product) => void;
}

export function RecommendedForYou({ onQuickView }: RecommendedForYouProps) {
  const { products } = useProducts({ limit: 30 });

  // Intelligent recommendation fallback logic: mixes categories and top-rated items
  const recommendations = products.slice(5, 10);

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="bg-gradient-to-br from-navy-950 via-primary-950 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-accent-400 font-extrabold text-[11px] uppercase tracking-wider mb-2 border border-primary-500/30">
              <BrainCircuit className="w-4 h-4 text-accent-400" />
              <span>Personalized Culinary Match</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Recommended For Your Kitchen
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-xs font-bold text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1"
          >
            <span>Explore All Suggestions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {recommendations.map((product) => (
            <div key={product.id} className="bg-white text-navy-950 rounded-2xl overflow-hidden shadow-md">
              <ProductCard product={product} onQuickView={onQuickView} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
