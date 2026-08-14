import { Link } from 'wouter';
import { Layers, ArrowRight, Sparkles } from 'lucide-react';

const COLLECTIONS = [
  {
    title: 'The Master Chef Kitchen',
    description: 'Commercial-grade stainless steel pots, heavy copper pans & gas burners for pro chefs.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=cookware',
    badge: 'Pro Grade'
  },
  {
    title: 'Restaurant & Hotel Essentials',
    description: 'Bulk chafing dishes, food warmers, commercial blenders & wholesale dining sets.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=commercial',
    badge: 'B2B Wholesale'
  },
  {
    title: 'Wedding & Housewarming Gifts',
    description: 'Luxury 24-piece cutlery sets, elegant glassware & premium gift-boxed dinnerware.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=tableware',
    badge: 'Popular Gift'
  },
  {
    title: 'Baking & Pastry Masterclass',
    description: 'Non-stick cake moulds, silicone spatulas, measuring cups & digital kitchen scales.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=bakeware',
    badge: 'Pastry Hub'
  },
];

export function FeaturedCollections() {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-1.5 text-accent-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-accent-500" />
            <span>Curated Lifestyle Bundles</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
            Featured Kitchen Collections
          </h2>
        </div>

        <Link
          href="/shop"
          className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
        >
          <span>All Bundles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {COLLECTIONS.map((col, idx) => (
          <Link
            key={idx}
            href={col.link}
            className="group relative rounded-3xl overflow-hidden shadow-md border border-navy-100 bg-navy-950 flex flex-col justify-end h-[320px] hover:shadow-premium transition-all duration-300"
          >
            <img
              src={col.image}
              alt={col.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />

            <div className="relative z-10 p-6 text-white">
              <span className="inline-block bg-accent-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md mb-2 shadow-sm">
                {col.badge}
              </span>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-accent-300 transition-colors leading-snug">
                {col.title}
              </h3>
              <p className="text-xs text-navy-200 mt-1 line-clamp-2 leading-relaxed">
                {col.description}
              </p>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent-400 group-hover:translate-x-1 transition-transform">
                <span>Explore Bundle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
