import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';

export interface CrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: CrumbItem[];
  className?: string;
}

// Route mapping for auto-inferring breadcrumbs when items prop is not explicitly provided
function inferBreadcrumbsFromLocation(location: string): CrumbItem[] {
  const path = location.split('?')[0].split('#')[0];
  
  if (!path || path === '/' || path === '/home' || path.startsWith('/admin')) {
    return [];
  }

  // Help Center & Customer Support
  if (path === '/faq') {
    return [
      { label: 'Help Center', href: '/faq' },
      { label: 'Frequently Asked Questions' },
    ];
  }

  if (path === '/contact') {
    return [
      { label: 'Help Center', href: '/faq' },
      { label: 'Contact Us' },
    ];
  }

  if (path === '/track-order') {
    return [
      { label: 'Help Center', href: '/faq' },
      { label: 'Track Order Status' },
    ];
  }

  // CMS Pages / Legal & Policy Docs
  if (path.startsWith('/page/')) {
    const slug = path.replace('/page/', '');
    
    if (slug === 'privacy-policy' || slug === 'privacy') {
      return [
        { label: 'Legal & Policies', href: '/page/privacy-policy' },
        { label: 'Privacy Policy' },
      ];
    }
    if (slug === 'terms' || slug === 'terms-and-conditions') {
      return [
        { label: 'Legal & Policies', href: '/page/terms' },
        { label: 'Terms & Conditions' },
      ];
    }
    if (slug === 'shipping-policy' || slug === 'shipping') {
      return [
        { label: 'Help Center', href: '/faq' },
        { label: 'Shipping & Delivery Policy' },
      ];
    }
    if (slug === 'return-policy' || slug === 'returns') {
      return [
        { label: 'Help Center', href: '/faq' },
        { label: 'Return & Exchange Policy' },
      ];
    }
    if (slug === 'warranty-info' || slug === 'warranty') {
      return [
        { label: 'Help Center', href: '/faq' },
        { label: 'Commercial Equipment Warranty' },
      ];
    }
    if (slug === 'about') {
      return [
        { label: 'Company', href: '/about' },
        { label: 'About MEGGS KITCHEN' },
      ];
    }

    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    return [
      { label: 'Help Center', href: '/faq' },
      { label: formattedTitle },
    ];
  }

  // Company Information
  if (path === '/about') {
    return [
      { label: 'Company', href: '/about' },
      { label: 'About MEGGS KITCHEN' },
    ];
  }

  if (path === '/portfolio') {
    return [
      { label: 'Company', href: '/about' },
      { label: 'Turnkey Projects & Portfolio' },
    ];
  }

  if (path === '/industries') {
    return [
      { label: 'Company', href: '/about' },
      { label: 'Commercial Industries Served' },
    ];
  }

  if (path === '/market') {
    return [
      { label: 'Company', href: '/about' },
      { label: 'Marketplace & Partners' },
    ];
  }

  // E-Commerce Storefront
  if (path === '/shop') {
    return [{ label: 'Shop Catalog' }];
  }

  if (path.startsWith('/category/')) {
    const catSlug = path.replace('/category/', '');
    const catName = catSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return [
      { label: 'Shop Catalog', href: '/shop' },
      { label: catName },
    ];
  }

  if (path.startsWith('/product/')) {
    return [
      { label: 'Shop Catalog', href: '/shop' },
      { label: 'Product Details' },
    ];
  }

  if (path === '/cart') {
    return [{ label: 'Shopping Cart' }];
  }

  if (path === '/checkout') {
    return [
      { label: 'Shopping Cart', href: '/cart' },
      { label: 'Checkout' },
    ];
  }

  if (path === '/checkout-success' || path.startsWith('/order-confirmation')) {
    return [
      { label: 'Shopping Cart', href: '/cart' },
      { label: 'Order Confirmation' },
    ];
  }

  if (path === '/account' || path === '/my-account') {
    return [{ label: 'My Account Portal' }];
  }

  if (path === '/wishlist') {
    return [
      { label: 'Shop Catalog', href: '/shop' },
      { label: 'My Wishlist' },
    ];
  }

  if (path === '/compare') {
    return [
      { label: 'Shop Catalog', href: '/shop' },
      { label: 'Compare Products' },
    ];
  }

  if (path === '/quotation') {
    return [
      { label: 'Services', href: '/services' },
      { label: 'Request Quotation' },
    ];
  }

  // Technical Services
  if (path === '/services') {
    return [{ label: 'Technical & Engineering Services' }];
  }

  if (path.startsWith('/service/')) {
    const serviceSlug = path.replace('/service/', '');
    const serviceTitle = serviceSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return [
      { label: 'Technical Services', href: '/services' },
      { label: serviceTitle },
    ];
  }

  // Generic fallback split by slashes
  const segments = path.split('/').filter(Boolean);
  return segments.map((seg, idx) => {
    const label = seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    const isLast = idx === segments.length - 1;
    const href = '/' + segments.slice(0, idx + 1).join('/');
    return isLast ? { label } : { label, href };
  });
}

export function Breadcrumbs({ items: customItems, className = '' }: BreadcrumbsProps) {
  const [location] = useLocation();

  // If location is home or admin route, don't show breadcrumbs
  const isHomeOrAdmin = !location || location === '/' || location === '/home' || location.startsWith('/admin');

  const resolvedItems = useMemo(() => {
    if (isHomeOrAdmin) return [];

    let rawList: CrumbItem[] = [];

    if (customItems && customItems.length > 0) {
      rawList = customItems;
    } else {
      rawList = inferBreadcrumbsFromLocation(location);
    }

    if (rawList.length === 0) return [];

    // Ensure 'Home' is the very first breadcrumb
    const firstIsHome = rawList[0].label.toLowerCase() === 'home';
    const list = firstIsHome ? rawList : [{ label: 'Home', href: '/' }, ...rawList];

    return list;
  }, [location, customItems, isHomeOrAdmin]);

  if (isHomeOrAdmin || resolvedItems.length === 0) {
    return null;
  }

  // Generate Schema.org JSON-LD BreadcrumbList structured data for SEO
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://meggskitchen.co.ke';
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: resolvedItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${siteUrl}${item.href}` : `${siteUrl}${location}`,
    })),
  };

  return (
    <>
      {/* Search Engine SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* Visual Breadcrumb Navigation Trail Bar */}
      <nav
        aria-label="Breadcrumb navigation"
        className={`bg-navy-900/5 dark:bg-navy-950/40 border-b border-navy-100/80 dark:border-navy-800/60 py-3 text-xs font-sans transition-colors ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-navy-600 dark:text-navy-300">
            {resolvedItems.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === resolvedItems.length - 1;

              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  {index > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-navy-400 dark:text-navy-500 shrink-0" aria-hidden="true" />
                  )}

                  {isLast ? (
                    <span
                      aria-current="page"
                      className="font-bold text-navy-950 dark:text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md bg-amber-400/15 dark:bg-amber-400/20 text-navy-950 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-300/30"
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-primary-600 dark:hover:text-amber-400 font-medium transition-colors flex items-center gap-1 group truncate max-w-[150px] sm:max-w-xs"
                    >
                      {isFirst && <Home className="w-3.5 h-3.5 text-navy-500 group-hover:text-primary-600 dark:group-hover:text-amber-400 shrink-0" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className="font-medium text-navy-700 dark:text-navy-200 truncate max-w-[150px] sm:max-w-xs">
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
