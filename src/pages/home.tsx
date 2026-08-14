import { useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { useHeroSlides, useHomepageSections } from '@/hooks/use-data';
import { useSeoMeta } from '@/hooks/use-seo';

import { HeroSection } from '@/components/home/HeroSection';
import { TrustBadgesBar } from '@/components/home/TrustBadgesBar';
import { QuickCategories } from '@/components/home/QuickCategories';
import { TodaysDeals } from '@/components/home/TodaysDeals';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';
import { FeaturedCollections } from '@/components/home/FeaturedCollections';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { ShopByBrand } from '@/components/home/ShopByBrand';
import { RecommendedForYou } from '@/components/home/RecommendedForYou';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { QuickViewModal } from '@/components/home/QuickViewModal';
import type { Product } from '@/lib/types';

export default function Home() {
  useSeoMeta('home');
  const { slides } = useHeroSlides();
  const { sections } = useHomepageSections();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const isSectionVisible = (type: string) => {
    const s = sections.find(sec => sec.section_type === type);
    return !s || s.is_active !== false;
  };

  const heroSectionConfig = sections.find(s => s.section_type === 'hero');
  const slideInterval = heroSectionConfig?.content?.slide_interval || 5000;

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen pb-16 space-y-4">
        
        {/* 4. HERO SECTION */}
        {isSectionVisible('hero') && (
          <HeroSection 
            slides={slides} 
            autoPlayInterval={slideInterval} 
          />
        )}

        {/* TRUST BADGES BAR */}
        <TrustBadgesBar />

        {/* 5. QUICK CATEGORY ICONS */}
        {isSectionVisible('categories') && <QuickCategories />}

        {/* 7. TODAY'S DEALS FLASH SALE */}
        {isSectionVisible('deals') && (
          <TodaysDeals onQuickView={(prod) => setQuickViewProduct(prod)} />
        )}

        {/* 6. FEATURED PRODUCTS */}
        {isSectionVisible('products') && (
          <FeaturedProductsSection onQuickView={(prod) => setQuickViewProduct(prod)} />
        )}

        {/* 8. NEW ARRIVALS */}
        {isSectionVisible('new_arrivals') && (
          <NewArrivalsSection onQuickView={(prod) => setQuickViewProduct(prod)} />
        )}

        {/* 11. FEATURED COLLECTIONS */}
        {isSectionVisible('collections') && <FeaturedCollections />}

        {/* 9. BEST SELLERS */}
        {isSectionVisible('best_sellers') && (
          <BestSellersSection onQuickView={(prod) => setQuickViewProduct(prod)} />
        )}

        {/* 10. SHOP BY BRAND */}
        {isSectionVisible('partners') && <ShopByBrand />}

        {/* 13. RECOMMENDED FOR YOU */}
        {isSectionVisible('recommendations') && (
          <RecommendedForYou onQuickView={(prod) => setQuickViewProduct(prod)} />
        )}

        {/* 12. RECENTLY VIEWED */}
        {isSectionVisible('recently_viewed') && (
          <RecentlyViewed onQuickView={(prod) => setQuickViewProduct(prod)} />
        )}

        {/* 14. CUSTOMER REVIEWS */}
        {isSectionVisible('testimonials') && <CustomerReviews />}

      </div>

      {/* QUICK VIEW MODAL */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </CustomerLayout>
  );
}
