import { useState } from 'react';
import { Link } from 'wouter';
import { Sparkles, Utensils, ArrowRight } from 'lucide-react';
import { useProducts, useCategories } from '@/hooks/use-data';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface FeaturedProductsSectionProps {
  onQuickView?: (product: Product) => void;
}

export function FeaturedProductsSection({ onQuickView }: FeaturedProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories } = useCategories();
  
  const { products, loading } = useProducts({
    featured: true,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    limit: 10
  });

  const filterTabs = [
    { id: 'all', label: 'All Featured' },
    ...categories.slice(0, 5).map(c => ({ id: c.id, label: c.name }))
  ];

  if (!loading && selectedCategory === 'all' && products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2 text-accent-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Handpicked Culinary Quality</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
            Featured Kitchenware & Equipment
          </h2>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === tab.id
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-navy-50 h-72 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-navy-50/50 rounded-2xl border border-dashed border-navy-200">
          <Utensils className="w-8 h-8 text-navy-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-navy-800">No featured products in this category yet.</p>
          <p className="text-xs text-navy-500 mt-1">Explore our full storefront catalog for all items.</p>
        </div>
      )}

      {/* Footer Link */}
      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all hover:gap-3"
        >
          <span>Explore All Kitchenware Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </section>
  );
}
