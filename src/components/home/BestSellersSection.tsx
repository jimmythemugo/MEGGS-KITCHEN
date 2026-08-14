import { Link } from 'wouter';
import { Award, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/use-data';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface BestSellersSectionProps {
  onQuickView?: (product: Product) => void;
}

export function BestSellersSection({ onQuickView }: BestSellersSectionProps) {
  const { products, loading } = useProducts({ limit: 40 });

  // Filter products explicitly flagged as best sellers or top selling items
  const bestSellers = products.filter(p => p.is_best_seller).slice(0, 5);

  if (!loading && bestSellers.length === 0) {
    return null; // Hide section when no active best sellers exist
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="bg-navy-50/70 border border-navy-100 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-200">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Award className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Customer Top Favorites</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
              Most Popular Best Sellers
            </h2>
          </div>

          <Link 
            href="/shop?sort=popular" 
            className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
          >
            <span>Explore Rankings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white h-72 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
