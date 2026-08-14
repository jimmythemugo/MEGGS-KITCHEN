import { Link } from 'wouter';
import { Utensils, Flame, Sparkles, Coffee, Wine, Box, ChefHat, Zap, UtensilsCrossed, Package } from 'lucide-react';
import { useCategories } from '@/hooks/use-data';

const DEFAULT_CIRCULAR_CATEGORIES = [
  { name: 'Cooking Pots', slug: 'cookware', icon: Flame, image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80' },
  { name: 'Blenders & Mixers', slug: 'appliances', icon: Zap, image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=300&q=80' },
  { name: 'Chef Knives', slug: 'cutlery', icon: UtensilsCrossed, image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=300&q=80' },
  { name: 'Dinnerware Sets', slug: 'tableware', icon: Utensils, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80' },
  { name: 'Thermos & Flasks', slug: 'drinkware', icon: Coffee, image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=300&q=80' },
  { name: 'Glassware & Crystal', slug: 'glassware', icon: Wine, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80' },
  { name: 'Storage & Jars', slug: 'storage', icon: Package, image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80' },
  { name: 'Bakeware & Moulds', slug: 'bakeware', icon: Sparkles, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80' },
  { name: 'Commercial Equipment', slug: 'commercial', icon: ChefHat, image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80' },
];

export function QuickCategories() {
  const { categories } = useCategories();

  const categoryList = categories.length >= 6 
    ? categories.slice(0, 9).map((cat, i) => ({
        name: cat.name,
        slug: cat.slug,
        IconComponent: DEFAULT_CIRCULAR_CATEGORIES[i % DEFAULT_CIRCULAR_CATEGORIES.length].icon,
        image: cat.image_url || DEFAULT_CIRCULAR_CATEGORIES[i % DEFAULT_CIRCULAR_CATEGORIES.length].image
      }))
    : DEFAULT_CIRCULAR_CATEGORIES.map(c => ({
        name: c.name,
        slug: c.slug,
        IconComponent: c.icon,
        image: c.image
      }));

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-950 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-accent-500" />
            <span>Explore Kitchen Categories</span>
          </h2>
          <p className="text-xs text-navy-500 mt-0.5">Quick access to essential cookware, appliances & commercial gear</p>
        </div>
        <Link 
          href="/shop" 
          className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
        {categoryList.map((cat) => {
          const Icon = cat.IconComponent;
          return (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-2 rounded-2xl hover:bg-navy-50/80 transition-all cursor-pointer"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-accent-400 to-primary-600 shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white relative flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-navy-950/30 group-hover:bg-navy-950/10 transition-colors flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-navy-950 shadow-sm">
                      <Icon className="w-4 h-4 text-primary-700" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-navy-900 group-hover:text-primary-600 mt-2 line-clamp-1 transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
