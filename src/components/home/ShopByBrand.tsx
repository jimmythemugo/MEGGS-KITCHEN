import { Link } from 'wouter';
import { Award, ShieldCheck, Sparkles } from 'lucide-react';
import { useBrands, usePartners } from '@/hooks/use-data';

const DEFAULT_BRANDS = [
  { id: 'b1', name: 'Citronic', logo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80', tagline: 'Professional Blenders' },
  { id: 'b2', name: 'Blinkmax', logo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80', tagline: 'Crystal & Glassware' },
  { id: 'b3', name: 'KAL', logo: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=200&q=80', tagline: 'Stainless Steel Cookware' },
  { id: 'b4', name: 'Royal Kitchen', logo: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=200&q=80', tagline: 'Commercial Dinnerware' },
  { id: 'b5', name: 'Tefal', logo: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=200&q=80', tagline: 'Non-Stick Technology' },
  { id: 'b6', name: 'MasterChef', logo: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=200&q=80', tagline: 'Precision Knives' },
];

export function ShopByBrand() {
  const { brands } = useBrands();
  const { partners } = usePartners();

  const brandList = brands.length > 0 
    ? brands.map(b => ({ id: b.id, name: b.name, logo: b.logo_url || DEFAULT_BRANDS[0].logo, tagline: 'Authorized Distributor' }))
    : partners.length > 0
    ? partners.map(p => ({ id: p.id, name: p.name, logo: p.logo_url || DEFAULT_BRANDS[0].logo, tagline: p.description || 'Global Brand Partner' }))
    : DEFAULT_BRANDS;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-1.5 text-accent-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-accent-500" />
            <span>Authorized Global Manufacturers</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
            Shop By Top Brands
          </h2>
        </div>
        <p className="text-xs text-navy-500 max-w-xs">Direct factory warranties & original replacement parts guaranteed.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {brandList.map((brand) => (
          <Link
            key={brand.id}
            href={`/shop?search=${encodeURIComponent(brand.name)}`}
            className="group bg-white rounded-2xl border border-navy-100 p-4 flex flex-col items-center text-center hover:border-primary-500 hover:shadow-premium transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-xl bg-navy-50/60 p-2 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <h3 className="font-display font-bold text-sm text-navy-900 group-hover:text-primary-600 transition-colors">
              {brand.name}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5 line-clamp-1">{brand.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
