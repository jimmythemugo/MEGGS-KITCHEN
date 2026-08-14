import { Link } from 'wouter';
import { ArrowRight, PackagePlus } from 'lucide-react';
import { useProducts } from '@/hooks/use-data';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface NewArrivalsSectionProps {
  onQuickView?: (product: Product) => void;
}

export function NewArrivalsSection({ onQuickView }: NewArrivalsSectionProps) {
  // Query newest inventory and filter products marked as is_new_arrival
  const { products, loading } = useProducts({ limit: 40 });

  const newArrivals = products.filter(p => p.is_new_arrival).slice(0, 5);

  if (!loading && newArrivals.length === 0) {
    return null; // Hide section when no active new arrivals exist
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-1.5 text-primary-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <PackagePlus className="w-4 h-4 text-accent-500" />
            <span>Fresh Off Factory Line</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
            New Arrivals in Kitchenware
          </h2>
        </div>
        
        <Link 
          href="/shop?sort=newest" 
          className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
        >
          <span>View All New</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-navy-50 h-72 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      )}
    </section>
  );
}
