import { useState } from 'react';
import { Link } from 'wouter';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter, Send, CheckCircle2, ShieldCheck, Truck, Headphones, CreditCard } from 'lucide-react';
import { useSiteSettings, useCategories } from '@/hooks/use-data';
import { telHref } from '@/lib/utils';

const DEFAULTS = {
  name: 'MEGGS KITCHEN',
  tagline: 'Culinary Equipment & Kitchenware Specialist',
  description:
    'Kenya & East Africa\'s premier provider of commercial culinary equipment, premium cookware, hotel supplies, and home kitchenware.',
  phone: '+254 700 123 456',
  email: 'orders@meggskitchen.com',
  address: 'Commercial Hub, Industrial Area, Nairobi, Kenya',
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();
  const { categories } = useCategories();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const siteName = settings.site_info?.name || DEFAULTS.name;
  const tagline = settings.site_info?.tagline || DEFAULTS.tagline;
  const description = settings.site_info?.description || DEFAULTS.description;

  const phone = settings.contact?.phone || DEFAULTS.phone;
  const email = settings.contact?.email || DEFAULTS.email;
  const address = settings.contact?.address || DEFAULTS.address;

  const social = settings.social_links || {};
  const socialLinks = [
    { key: 'facebook', url: social.facebook || '#', Icon: Facebook },
    { key: 'instagram', url: social.instagram || '#', Icon: Instagram },
    { key: 'linkedin', url: social.linkedin || '#', Icon: Linkedin },
    { key: 'twitter', url: social.twitter || '#', Icon: Twitter },
  ];

  const copyright =
    settings.footer?.copyright ||
    `© ${currentYear} MEGGS KITCHEN Ltd | All Rights Reserved. Enterprise Culinary Equipment.`;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 3000);
  };

  const topCategories = categories.length > 0 ? categories.slice(0, 6) : [
    { id: '1', name: 'Cookware & Pots', slug: 'cookware' },
    { id: '2', name: 'Kitchen Appliances', slug: 'appliances' },
    { id: '3', name: 'Cutlery & Chef Knives', slug: 'cutlery' },
    { id: '4', name: 'Commercial Equipment', slug: 'commercial' },
    { id: '5', name: 'Bakeware & Moulds', slug: 'bakeware' },
    { id: '6', name: 'Tableware & Glassware', slug: 'tableware' },
  ];

  return (
    <footer className="bg-navy-950 text-white font-sans border-t border-navy-800">
      
      {/* VALUE PROPOSITION BAR */}
      <div className="bg-navy-900 border-b border-navy-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 text-accent-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Same Day Dispatch</p>
              <p className="text-[11px] text-navy-400">Fast region-wide shipping</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 text-accent-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">100% Genuine Quality</p>
              <p className="text-[11px] text-navy-400">Full manufacturer warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 text-accent-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Commercial B2B Support</p>
              <p className="text-[11px] text-navy-400">Dedicated quotes & hotline</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 text-accent-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Secure Local Payments</p>
              <p className="text-[11px] text-navy-400">M-Pesa, Card & Bank Wire</p>
            </div>
          </div>
        </div>
      </div>

      {/* 15. NEWSLETTER SECTION */}
      <div className="bg-gradient-to-r from-primary-950 via-navy-900 to-navy-950 py-10 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-accent-400 bg-accent-500/10 px-2.5 py-1 rounded-full border border-accent-500/20">
              Exclusive VIP Culinary Offers
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-bold mt-2 text-white">
              Subscribe & Get <span className="text-accent-400">10% OFF</span> Your First Order
            </h3>
            <p className="text-xs text-navy-300 mt-1 leading-relaxed">
              Join thousands of home chefs, hotels, and restaurant owners receiving weekly deals & new arrival alerts.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your business or personal email..."
              required
              className="px-4 py-3 rounded-xl bg-navy-900/90 border border-navy-700 text-xs text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 min-w-[260px]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 shadow-md active:scale-95"
            >
              {subscribed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-accent-400" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Subscribe Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 16. MAIN FOOTER LINKS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-display font-extrabold text-xl shadow-md">
                M
              </div>
              <div>
                <h2 className="font-display font-extrabold text-xl text-white tracking-tight">
                  MEGGS <span className="text-accent-500">KITCHEN</span>
                </h2>
                <p className="text-[11px] text-navy-400 tracking-wider uppercase font-semibold">{tagline}</p>
              </div>
            </div>
            <p className="text-xs text-navy-300 leading-relaxed max-w-sm">
              {description}
            </p>
            
            <div className="pt-2">
              <p className="text-[11px] font-bold text-navy-400 uppercase tracking-wider mb-2">Connect With Us</p>
              <div className="flex items-center gap-2">
                {socialLinks.map(({ key, url, Icon }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-navy-900 border border-navy-800 flex items-center justify-center text-navy-300 hover:bg-primary-600 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4 border-l-2 border-primary-500 pl-2">
              Top Categories
            </h3>
            <ul className="space-y-2.5 text-xs text-navy-300">
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop?category=${cat.slug}`} className="hover:text-accent-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links & Customer Care */}
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4 border-l-2 border-primary-500 pl-2">
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-xs text-navy-300">
              <li><Link href="/shop" className="hover:text-accent-400 transition-colors">Browse Storefront</Link></li>
              <li><Link href="/shop?deals=true" className="hover:text-accent-400 transition-colors">Hot Deals & Clearance</Link></li>
              <li><Link href="/quotation" className="hover:text-accent-400 transition-colors">B2B Wholesale Quotation</Link></li>
              <li><Link href="/about" className="hover:text-accent-400 transition-colors">About MEGGS KITCHEN</Link></li>
              <li><Link href="/contact" className="hover:text-accent-400 transition-colors">Contact Us & Location</Link></li>
              <li><Link href="/track-order" className="hover:text-accent-400 transition-colors">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4 border-l-2 border-primary-500 pl-2">
              Headquarters & Sales
            </h3>
            <div className="space-y-3 text-xs text-navy-300">
              <a href={telHref(phone)} className="flex items-start gap-2.5 hover:text-accent-400 transition-colors">
                <Phone className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <span>{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-start gap-2.5 hover:text-accent-400 transition-colors">
                <Mail className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <span>{email}</span>
              </a>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-xl bg-navy-900 border border-navy-800 text-[11px] text-navy-300">
              <p className="font-bold text-white mb-0.5">Opening Hours</p>
              <p>Mon - Sat: 8:00 AM - 6:00 PM</p>
            </div>
          </div>

        </div>
      </div>

      {/* COPYRIGHT & PAYMENT BADGES */}
      <div className="bg-navy-900 border-t border-navy-800 py-4 px-4 sm:px-6 lg:px-8 text-xs text-navy-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>{copyright}</p>
          
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-navy-500 font-medium">Accepted Payments:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">M-PESA</span>
              <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold text-[10px]">VISA</span>
              <span className="px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold text-[10px]">Mastercard</span>
              <span className="px-2 py-0.5 rounded bg-navy-800 text-navy-300 border border-navy-700 font-bold text-[10px]">Bank Transfer</span>
            </div>
            
            <Link href="/admin/login" className="ml-4 text-navy-500 hover:text-white transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

