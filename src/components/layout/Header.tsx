import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  Heart, 
  User, 
  ChevronDown, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Flame, 
  Package, 
  Utensils, 
  Layers, 
  Clock, 
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useSiteSettings, useCategories, useProducts } from '@/hooks/use-data';
import { telHref } from '@/lib/utils';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';

const DEFAULT_PHONE = '+254 700 123 456';
const DEFAULT_EMAIL = 'orders@meggskitchen.com';
const DEFAULT_ADDRESS = 'Nairobi, Kenya • Commercial & Home Culinary Hub';

const ANNOUNCEMENTS = [
  "⚡ Free Delivery on Kitchenware orders above KSh 10,000 across Nairobi",
  "🔥 Commercial Culinary Equipment — Direct Factory Prices & B2B Wholesale",
  "🚚 Same Day Express Dispatch Available across Nairobi & Surrounding Regions",
  "💬 WhatsApp Orders & Fast Quotations: +254 700 123 456",
];

const POPULAR_SEARCHES = [
  "Cookware Sets",
  "Stand Mixers",
  "Cast Iron Skillets",
  "Air Fryer 8L",
  "Chef Knife Set",
  "Chafing Dishes",
  "Commercial Convection Oven"
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [location, setLocation] = useLocation();
  const { totalItems, totalPrice } = useCart();
  const { settings } = useSiteSettings();
  const { categories } = useCategories();
  const { products } = useProducts({ limit: 80 });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const phone = settings.contact?.phone || DEFAULT_PHONE;
  const email = settings.contact?.email || DEFAULT_EMAIL;

  // Auto rotate announcements
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Sync wishlist count & recent searches from localStorage
  useEffect(() => {
    const updateWishlist = () => {
      try {
        const stored = localStorage.getItem('meggs_wishlist');
        if (stored) {
          const parsed = JSON.parse(stored);
          setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
        }
      } catch (e) {
        setWishlistCount(0);
      }
    };
    updateWishlist();
    window.addEventListener('storage', updateWishlist);

    try {
      const searches = localStorage.getItem('meggs_recent_searches');
      if (searches) setRecentSearches(JSON.parse(searches).slice(0, 5));
    } catch (e) {}

    return () => window.removeEventListener('storage', updateWishlist);
  }, []);

  // Filter search matches
  const searchResults = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Save recent search
    const updated = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('meggs_recent_searches', JSON.stringify(updated));
    } catch (e) {}

    setIsSearchFocused(false);
    setLocation(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleQuickSearchClick = (term: string) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    setLocation(`/shop?search=${encodeURIComponent(term)}`);
  };

  // Close search overlay on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topCategories = categories.length > 0 ? categories.slice(0, 8) : [
    { id: '1', name: 'Cookware & Pots', slug: 'cookware' },
    { id: '2', name: 'Kitchen Appliances', slug: 'appliances' },
    { id: '3', name: 'Cutlery & Knives', slug: 'cutlery' },
    { id: '4', name: 'Commercial Equipment', slug: 'commercial' },
    { id: '5', name: 'Bakeware & Moulds', slug: 'bakeware' },
    { id: '6', name: 'Tableware & Glass', slug: 'tableware' },
    { id: '7', name: 'Barware & Beverage', slug: 'barware' },
    { id: '8', name: 'Refrigeration', slug: 'refrigeration' },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 shadow-sm bg-white font-sans">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-navy-950 text-white text-xs py-1.5 px-4 overflow-hidden border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-navy-200 font-medium animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-accent-400 shrink-0" />
            <span className="truncate">{ANNOUNCEMENTS[announcementIdx]}</span>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-navy-300 text-[11px]">
            <a href={telHref(phone)} className="hover:text-white transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3 text-accent-400" />
              <span>Call / WhatsApp: {phone}</span>
            </a>
            <span className="text-navy-700">|</span>
            <Link href="/track-order" className="hover:text-white transition-colors flex items-center gap-1">
              <Truck className="w-3 h-3 text-primary-400" />
              <span>Track Order</span>
            </Link>
            <span className="text-navy-700">|</span>
            <Link href="/quotation" className="hover:text-white transition-colors flex items-center gap-1 font-semibold text-accent-400">
              <FileText className="w-3 h-3" />
              <span>B2B Quote Request</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION HEADER */}
      <div className="border-b border-navy-100 bg-white py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center font-display font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-extrabold text-lg md:text-xl text-navy-950 tracking-tight leading-none">
                  MEGGS
                </span>
                <span className="font-display font-extrabold text-lg md:text-xl text-accent-600 tracking-tight leading-none">
                  KITCHEN
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-navy-400 mt-0.5">
                Culinary Equipment & Kitchenware
              </p>
            </div>
          </Link>

          {/* Intelligent Search Bar (Center) */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search cookware, mixers, knives, commercial ovens, SKU..."
                className="w-full pl-4 pr-24 py-2.5 rounded-full bg-navy-50/80 border border-navy-200 text-sm text-navy-900 placeholder-navy-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-5 rounded-full bg-primary-600 text-white hover:bg-primary-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            {/* Live Search Suggestion Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-premium-lg border border-navy-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-navy-400 px-1">
                      Matching Products
                    </p>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/shop/${product.slug}`}
                        onClick={() => setIsSearchFocused(false)}
                        className="flex items-center gap-3 p-2 hover:bg-navy-50 rounded-xl transition-colors"
                      >
                        <img
                          src={withFallback(product.image_url, getProductPlaceholder(product.category?.name))}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded-lg bg-white border border-navy-100 p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-navy-900 truncate">{product.name}</p>
                          <p className="text-[11px] text-navy-500">KSh {product.price.toLocaleString()}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-navy-400" />
                      </Link>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <p className="text-xs text-navy-500 text-center py-3">No matching products found for "{searchQuery}"</p>
                ) : (
                  <div className="space-y-4">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-navy-400 mb-2">
                          <Clock className="w-3 h-3" />
                          <span>Recent Searches</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleQuickSearchClick(term)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-navy-50 text-navy-700 hover:bg-navy-100 transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Searches */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-navy-400 mb-2">
                        <TrendingUp className="w-3 h-3 text-accent-500" />
                        <span>Popular Kitchenware Searches</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuickSearchClick(term)}
                            className="text-xs px-3 py-1 rounded-full border border-navy-200 text-navy-800 hover:border-primary-600 hover:text-primary-600 transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-2 text-navy-700 hover:text-primary-600 transition-colors flex flex-col items-center"
              title="Saved Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5 md:w-6 md:h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-navy-600 hidden lg:inline mt-0.5">Wishlist</span>
            </Link>

            {/* Account / Portal */}
            <Link
              href="/account"
              className="p-2 text-navy-700 hover:text-primary-600 transition-colors flex flex-col items-center"
              title="Customer Account & Orders"
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[10px] font-medium text-navy-600 hidden lg:inline mt-0.5">Account</span>
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="flex items-center gap-2.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-primary-600">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] leading-tight text-primary-100 font-medium uppercase">My Cart</p>
                <p className="text-xs font-bold leading-tight">KSh {totalPrice.toLocaleString()}</p>
              </div>
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-navy-800 hover:text-primary-600"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cookware, mixers, appliances..."
              className="w-full pl-3.5 pr-10 py-2 rounded-lg bg-navy-50 border border-navy-200 text-xs text-navy-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
            <button type="submit" className="absolute right-2 top-2 text-navy-500">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. DYNAMIC CATEGORY & NAVIGATION BAR */}
      <div className="hidden md:block bg-navy-50/80 border-b border-navy-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Main Navigation Items */}
          <nav className="flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className="px-3 py-2.5 text-xs font-bold text-navy-800 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>

            {/* Shop Link with Dynamic Mega Menu Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <Link
                href="/shop"
                className="px-3 py-2.5 text-xs font-bold text-navy-900 hover:text-primary-600 transition-colors flex items-center gap-1 group"
              >
                <span>Shop</span>
                <ChevronDown className={`w-3.5 h-3.5 text-navy-400 group-hover:text-primary-600 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </Link>

              {/* Dynamic Mega Menu Drawer Dropdown */}
              {megaMenuOpen && (
                <div 
                  className="absolute top-full left-0 w-[840px] bg-white rounded-2xl shadow-premium-lg border border-navy-100 p-6 z-50 grid grid-cols-4 gap-6 animate-in fade-in"
                >
                  <div className="col-span-3 grid grid-cols-3 gap-3">
                    <div className="col-span-3 border-b border-navy-100 pb-2 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-600">
                        Product Categories
                      </span>
                      <Link href="/shop" className="text-[11px] font-bold text-navy-500 hover:text-primary-600 flex items-center gap-1">
                        View Full Shop Catalog <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {topCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setMegaMenuOpen(false)}
                        className="group p-2.5 rounded-xl hover:bg-navy-50 border border-transparent hover:border-navy-100 transition-all"
                      >
                        <p className="text-xs font-bold text-navy-900 group-hover:text-primary-600 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-accent-500 shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </p>
                        <p className="text-[10px] text-navy-400 mt-0.5">Commercial & Home Grade</p>
                      </Link>
                    ))}
                  </div>

                  {/* Featured Commercial Promotion Banner in Mega Menu */}
                  <div className="bg-gradient-to-br from-navy-900 to-primary-950 p-5 rounded-2xl text-white flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-widest uppercase text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-full border border-accent-500/20">
                        B2B Commercial
                      </span>
                      <h4 className="font-display text-sm font-bold mt-2 leading-snug">
                        Restaurant & Hotel Supply
                      </h4>
                      <p className="text-[11px] text-navy-200 mt-1 leading-relaxed">
                        Bulk wholesale quotes for hotels, catering & commercial kitchens in Kenya.
                      </p>
                    </div>
                    <Link
                      href="/quotation"
                      onClick={() => setMegaMenuOpen(false)}
                      className="mt-4 inline-flex items-center justify-center py-2 px-3 bg-accent-500 text-white rounded-xl text-xs font-bold hover:bg-accent-600 transition-colors shadow-sm"
                    >
                      Request Quotation
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/shop"
              className="px-3 py-2.5 text-xs font-semibold text-navy-700 hover:text-primary-600 transition-colors"
            >
              Categories
            </Link>

            <Link
              href="/shop?sort=newest"
              className="px-3 py-2.5 text-xs font-semibold text-navy-700 hover:text-primary-600 transition-colors"
            >
              New Arrivals
            </Link>

            <Link
              href="/shop?deals=true"
              className="px-3 py-2.5 text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 fill-accent-500" />
              <span>Special Offers</span>
            </Link>

            <Link
              href="/shop"
              className="px-3 py-2.5 text-xs font-semibold text-navy-700 hover:text-primary-600 transition-colors"
            >
              Brands
            </Link>

            <Link
              href="/about"
              className="px-3 py-2.5 text-xs font-semibold text-navy-700 hover:text-primary-600 transition-colors"
            >
              About Us
            </Link>

            <Link
              href="/contact"
              className="px-3 py-2.5 text-xs font-semibold text-navy-700 hover:text-primary-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Click-to-Call & Click-to-WhatsApp Contact Actions */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <a 
              href={telHref(phone)}
              className="text-navy-800 hover:text-primary-600 flex items-center gap-1.5 transition-colors"
              title="Call Store Hotline"
            >
              <Phone className="w-3.5 h-3.5 text-primary-600" />
              <span>{phone}</span>
            </a>

            <a
              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello%20MEGGS%20KITCHEN%20team,%20I%20have%20an%20inquiry`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
              title="Chat on WhatsApp"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* MOBILE MENU SLIDE OVER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-navy-100 p-4 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          
          {/* Main Mobile Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-navy-400 px-2 mb-1">
              Main Menu
            </p>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-bold text-navy-900 hover:bg-navy-50 rounded-xl"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-bold text-navy-900 hover:bg-navy-50 rounded-xl"
            >
              Shop Catalog
            </Link>
            <Link
              href="/shop?sort=newest"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50 rounded-xl"
            >
              New Arrivals
            </Link>
            <Link
              href="/shop?deals=true"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-bold text-accent-600 bg-accent-50/60 rounded-xl flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 fill-accent-500" />
                <span>Special Offers</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent-500 text-white">Hot</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50 rounded-xl"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50 rounded-xl"
            >
              Contact
            </Link>
          </div>

          {/* Kitchen Categories Submenu */}
          <div className="pt-3 border-t border-navy-100 space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary-600 px-2 mb-1">
              Explore Kitchen Categories
            </p>
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-navy-800 hover:bg-navy-50 rounded-lg flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-3 h-3 text-navy-400" />
              </Link>
            ))}
          </div>

          {/* Contact Actions for Mobile */}
          <div className="pt-3 border-t border-navy-100 space-y-2">
            <Link
              href="/quotation"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 text-xs font-bold text-primary-700 bg-primary-50 rounded-xl border border-primary-200 text-center"
            >
              📄 Request Commercial B2B Quotation
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={telHref(phone)}
                className="py-2.5 px-3 rounded-xl bg-navy-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-accent-400" />
                <span>Call Hotline</span>
              </a>

              <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello%20MEGGS%20KITCHEN%20team,%20I%20have%20an%20inquiry`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
