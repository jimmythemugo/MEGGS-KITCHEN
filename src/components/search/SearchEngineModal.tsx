import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, X, Clock, TrendingUp, Sparkles, ArrowRight, Package, Tag, Layers } from 'lucide-react';
import { useProducts, useCategories, useBrands } from '@/hooks/use-data';
import type { Product, Category } from '@/lib/types';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';

interface SearchEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Cooking Pots',
  'Commercial Blender',
  'Chef Knife Set',
  'Chafing Dishes',
  'Non-Stick Pan',
  'Thermos Flask',
  'Dinner Plates',
  'Air Fryer'
];

const SYNONYMS: Record<string, string> = {
  pot: 'cookware',
  pots: 'cookware',
  pan: 'cookware',
  pans: 'cookware',
  frypan: 'cookware',
  skillet: 'cookware',
  kettle: 'appliances',
  blender: 'appliances',
  juicer: 'appliances',
  oven: 'appliances',
  fryer: 'appliances',
  plate: 'dinnerware',
  bowl: 'dinnerware',
  fork: 'cutlery',
  knife: 'cutlery',
  glass: 'glassware',
  mug: 'drinkware',
  thermos: 'drinkware',
  flask: 'drinkware',
  chafing: 'restaurant',
  buffet: 'restaurant'
};

export function SearchEngineModal({ isOpen, onClose }: SearchEngineModalProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { products } = useProducts({ limit: 120 });
  const { categories } = useCategories();
  const { brands } = useBrands();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      try {
        const stored = localStorage.getItem('meggs_recent_searches');
        if (stored) setRecentSearches(JSON.parse(stored).slice(0, 6));
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveRecentSearch = (searchTerm: string) => {
    try {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('meggs_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const cleanQuery = query.trim().toLowerCase();
  const mappedTerm = SYNONYMS[cleanQuery] || cleanQuery;

  // Filter matched products
  const matchedProducts = cleanQuery
    ? products.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(cleanQuery);
        const catMatch = p.category?.name.toLowerCase().includes(cleanQuery) || p.category?.name.toLowerCase().includes(mappedTerm);
        const skuMatch = p.sku?.toLowerCase().includes(cleanQuery);
        const descMatch = p.description?.toLowerCase().includes(cleanQuery);
        return nameMatch || catMatch || skuMatch || descMatch;
      }).slice(0, 6)
    : [];

  // Filter matched categories
  const matchedCategories = cleanQuery
    ? categories.filter(c => c.name.toLowerCase().includes(cleanQuery) || c.name.toLowerCase().includes(mappedTerm)).slice(0, 4)
    : [];

  const handleSelectSearch = (term: string) => {
    saveRecentSearch(term);
    onClose();
    setLocation(`/shop?search=${encodeURIComponent(term)}`);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('meggs_recent_searches');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-navy-950/70 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Search Modal Card */}
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-navy-100 overflow-hidden flex flex-col font-sans max-h-[85vh]">
        
        {/* Search Input Bar Header */}
        <div className="p-4 sm:p-5 border-b border-navy-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-primary-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleSelectSearch(query.trim());
              }
            }}
            placeholder="Search kitchenware, cookware, blenders, chef knives, SKU..."
            className="w-full text-sm sm:text-base font-semibold text-navy-950 placeholder-navy-300 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-navy-50 text-navy-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-navy-100 hover:bg-navy-200 text-navy-700 font-bold text-xs transition-colors shrink-0"
          >
            Esc
          </button>
        </div>

        {/* Modal Results Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-navy-50">
          
          {/* Default Suggestions (when query is empty) */}
          {!cleanQuery && (
            <div className="space-y-6">
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-navy-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Recent Searches
                    </span>
                    <button
                      onClick={handleClearRecent}
                      className="text-[11px] font-semibold text-navy-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSearch(term)}
                        className="px-3 py-1.5 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <span className="text-xs font-bold text-navy-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-accent-500" />
                  Popular Kitchen Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSearch(term)}
                      className="px-3.5 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-all border border-primary-100/50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Quick Links */}
              <div>
                <span className="text-xs font-bold text-navy-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Layers className="w-3.5 h-3.5" />
                  Explore Categories
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.slice(0, 8).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${cat.slug}`}
                      onClick={onClose}
                      className="p-3 rounded-2xl bg-white border border-navy-100 hover:border-primary-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-1 group"
                    >
                      <span className="text-xs font-bold text-navy-900 group-hover:text-primary-600 line-clamp-1">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Active Search Results */}
          {cleanQuery && (
            <div className="space-y-6 pt-2">
              
              {/* Matched Categories */}
              {matchedCategories.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-navy-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    Categories ({matchedCategories.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {matchedCategories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/shop?category=${c.slug}`}
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-700 text-xs font-bold border border-accent-100 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Products */}
              <div>
                <span className="text-xs font-bold text-navy-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Package className="w-3.5 h-3.5" />
                  Products ({matchedProducts.length})
                </span>

                {matchedProducts.length === 0 ? (
                  <div className="text-center py-8 bg-navy-50/50 rounded-2xl">
                    <p className="text-navy-600 font-bold text-sm">No exact products found for "{query}"</p>
                    <p className="text-navy-400 text-xs mt-1">Try searching by broader category like cookware, appliances, or glassware</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchedProducts.map((p) => {
                      const imageSrc = withFallback(p.image_url, getProductPlaceholder(p.category?.name));
                      return (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            onClose();
                          }}
                          className="p-2.5 rounded-2xl border border-navy-100 hover:border-primary-500 hover:shadow-md transition-all flex items-center gap-3 bg-white group"
                        >
                          <img
                            src={imageSrc}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-contain bg-navy-50/50 p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider truncate">
                              {p.category?.name || 'Kitchenware'}
                            </p>
                            <h4 className="font-display font-bold text-xs text-navy-950 group-hover:text-primary-600 truncate">
                              {p.name}
                            </h4>
                            <p className="font-display font-extrabold text-xs text-navy-900 mt-0.5">
                              ${p.price.toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View All Search Button */}
              {matchedProducts.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => handleSelectSearch(query)}
                    className="w-full py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <span>View all results for "{query}"</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
