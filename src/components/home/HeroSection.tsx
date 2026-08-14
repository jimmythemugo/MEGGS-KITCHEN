import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight, Flame, Sparkles, Utensils, Zap, Percent } from "lucide-react";
import { usePromotions } from "@/hooks/use-data";
import { withFallback, getProductPlaceholder } from "@/lib/placeholders";

type Slide = {
  id: string | number;
  title: string;
  subtitle?: string | null;
  image_url: string;
  button_text?: string | null;
  button_link?: string | null;
};

interface HeroSectionProps {
  slides: Slide[];
  autoPlayInterval?: number;
}

const DEFAULT_PROMO_CARDS = [
  {
    title: "New Cookware Sets",
    subtitle: "Heavy-duty cast iron & stainless steel",
    tag: "Just Arrived",
    color: "from-amber-500/20 to-orange-600/20 text-amber-700 border-amber-200",
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-100/60",
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80",
    link: "/shop?category=cookware"
  },
  {
    title: "Kitchen Appliances",
    subtitle: "Commercial blenders & stand mixers",
    tag: "Up to 30% Off",
    color: "from-blue-500/20 to-indigo-600/20 text-blue-700 border-blue-200",
    bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100/60",
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80",
    link: "/shop?category=appliances"
  },
  {
    title: "Weekly Flash Deals",
    subtitle: "Limited time culinary clearance",
    tag: "Hot Price",
    color: "from-red-500/20 to-rose-600/20 text-red-700 border-red-200",
    bgClass: "bg-gradient-to-br from-red-50 to-rose-100/60",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    link: "/shop?deals=true"
  },
  {
    title: "Trending Chef Knives",
    subtitle: "Precision forged Japanese steel",
    tag: "Top Rated",
    color: "from-emerald-500/20 to-teal-600/20 text-emerald-700 border-emerald-200",
    bgClass: "bg-gradient-to-br from-emerald-50 to-teal-100/60",
    image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80",
    link: "/shop?category=cutlery"
  },
];

export function HeroSection({ slides, autoPlayInterval = 5000 }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { promotions } = usePromotions("hero_grid");

  const promoCards = promotions.length >= 4 
    ? promotions.slice(0, 4).map(p => ({
        title: p.title,
        subtitle: p.subtitle || "Featured Collection",
        tag: "Special Promo",
        color: "from-amber-500/20 to-orange-600/20 text-amber-700 border-amber-200",
        bgClass: "bg-gradient-to-br from-amber-50 to-orange-100/60",
        image: p.image_url,
        link: p.button_link || "/shop"
      }))
    : DEFAULT_PROMO_CARDS;

  const goToPrev = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, goToNext, autoPlayInterval]);

  const activeSlide = slides[currentSlide] || {
    id: 'default',
    title: 'Professional Kitchenware & Culinary Equipment',
    subtitle: 'Upgrade your commercial or home kitchen with factory-grade cookware, appliances & utensils.',
    image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    button_text: 'Explore Storefront',
    button_link: '/shop'
  };

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT: Rotating Promotions Hero Banner (7 cols on lg) */}
        <div 
          className="lg:col-span-7 relative min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] rounded-3xl overflow-hidden shadow-md group border border-navy-100 bg-navy-950 flex flex-col justify-end"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Background Image with smooth transition */}
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={withFallback(slide.image_url, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80')}
                alt={slide.title}
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/65 to-transparent" />
            </div>
          ))}

          {/* Hero Slide Content */}
          <div className="relative z-20 p-6 sm:p-10 text-white max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/90 text-white text-[11px] font-extrabold uppercase tracking-wider mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeSlide.subtitle || "Premium Culinary Collection"}</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              {activeSlide.title}
            </h2>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={activeSlide.button_link || '/shop'}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 hover:shadow-lg"
              >
                <span>{activeSlide.button_text || 'Shop Collection'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop?deals=true"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all"
              >
                <Flame className="w-4 h-4 text-accent-400" />
                <span>Today's Deals</span>
              </Link>
            </div>
          </div>

          {/* Slider Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 right-6 z-30 flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlide ? 'w-6 bg-accent-400' : 'w-2 bg-white/50 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Four Promotional Cards Grid (5 cols on lg) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          {promoCards.map((card, idx) => (
            <Link
              key={idx}
              href={card.link}
              className={`group relative overflow-hidden rounded-2xl p-4 border border-navy-100 ${card.bgClass} flex flex-col justify-between hover:shadow-md transition-all h-[185px] sm:h-[210px] lg:h-[232px]`}
            >
              <div className="relative z-10">
                <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${card.color} bg-white/80 mb-2`}>
                  {card.tag}
                </span>
                <h3 className="font-display font-bold text-sm sm:text-base text-navy-950 group-hover:text-primary-600 transition-colors leading-tight">
                  {card.title}
                </h3>
                <p className="text-[11px] text-navy-600 mt-1 line-clamp-2 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              {/* Product Card Image */}
              <div className="absolute right-2 bottom-2 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden opacity-95 group-hover:scale-105 transition-transform duration-500 shadow-sm border border-white">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 mt-auto pt-2 flex items-center gap-1 text-[11px] font-bold text-primary-700 group-hover:translate-x-1 transition-transform">
                <span>Shop Now</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
