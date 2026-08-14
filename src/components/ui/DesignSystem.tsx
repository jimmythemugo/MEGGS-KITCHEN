import React from 'react';
import { 
  ShoppingBag, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './card';

/**
 * MEGGS KITCHEN DESIGN SYSTEM
 * Complete, unified UI specifications and reusable architectural primitives.
 */

// 1. TYPOGRAPHY TOKENS
export const Typography = {
  h1: "font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-navy-950",
  h2: "font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-navy-950",
  h3: "font-display text-xl md:text-2xl font-bold tracking-snug text-navy-900",
  h4: "font-display text-lg font-semibold text-navy-900",
  bodyLarge: "text-base text-navy-700 leading-relaxed",
  body: "text-sm text-navy-600 leading-relaxed",
  bodySmall: "text-xs text-navy-500 leading-normal",
  label: "text-xs font-bold uppercase tracking-wider text-navy-500",
  eyebrow: "text-xs font-extrabold tracking-[0.2em] uppercase text-accent-600",
};

// 2. STATUS BADGES
export function StatusBadge({ status }: { status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pending' | 'delivered' | 'processing' | 'b2b' }) {
  const configs = {
    in_stock: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'In Stock' },
    low_stock: { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Low Stock' },
    out_of_stock: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Out of Stock' },
    pending: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Pending' },
    delivered: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Delivered' },
    processing: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Processing' },
    b2b: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Commercial Bulk' },
  };
  const config = configs[status] || configs.in_stock;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}

// 3. PRODUCT SPEC CARD
export function ProductGridCard({
  id,
  name,
  price,
  originalPrice,
  rating = 4.8,
  reviewCount = 36,
  imageUrl,
  category,
  isCommercial,
  inStock = true,
  onAddToCart,
}: {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl: string;
  category?: string;
  isCommercial?: boolean;
  inStock?: boolean;
  onAddToCart?: () => void;
}) {
  return (
    <div className="group relative bg-white rounded-xl border border-navy-100/90 shadow-sm hover:shadow-premium hover:border-navy-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Category & Badges Header */}
      <div className="relative aspect-square w-full bg-navy-50 overflow-hidden flex items-center justify-center p-4">
        {isCommercial && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-navy-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Commercial Grade
          </span>
        )}
        {originalPrice && originalPrice > price && (
          <span className="absolute top-2.5 right-2.5 z-10 bg-accent-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Save {Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </span>
        )}
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {category && (
            <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wider mb-1">
              {category}
            </p>
          )}
          <h3 className="font-semibold text-navy-900 text-sm md:text-base line-clamp-2 hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-navy-200'}`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-navy-700">{rating}</span>
            <span className="text-[11px] text-navy-400">({reviewCount})</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base md:text-lg font-bold text-navy-950">
                ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-navy-400 line-through">
                  ${originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">In Stock • Fast Delivery</p>
          </div>

          <button
            onClick={onAddToCart}
            disabled={!inStock}
            className="btn-primary py-2 px-3 text-xs gap-1.5 rounded-lg active:scale-95"
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. LOADING STATE
export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-navy-100 p-4 space-y-3">
          <div className="w-full aspect-square bg-navy-100 rounded-lg" />
          <div className="h-4 bg-navy-100 rounded w-3/4" />
          <div className="h-3 bg-navy-100 rounded w-1/2" />
          <div className="h-8 bg-navy-100 rounded w-full mt-2" />
        </div>
      ))}
    </div>
  );
}

// 5. EMPTY STATE
export function EmptyState({
  title = "No products found",
  description = "Try adjusting your filters or search keywords.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-navy-100 p-8 md:p-12 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600 mb-4">
        <Package className="w-8 h-8" />
      </div>
      <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
      <p className="text-sm text-navy-500 mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-6 text-sm px-5 py-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 6. ALERT STATES
export function AlertBox({
  type = 'info',
  title,
  message,
}: {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}) {
  const styles = {
    info: { bg: 'bg-blue-50 border-blue-200 text-blue-900', icon: Info, iconColor: 'text-blue-600' },
    success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: CheckCircle2, iconColor: 'text-emerald-600' },
    warning: { bg: 'bg-amber-50 border-amber-200 text-amber-900', icon: AlertTriangle, iconColor: 'text-amber-600' },
    error: { bg: 'bg-rose-50 border-rose-200 text-rose-900', icon: XCircle, iconColor: 'text-rose-600' },
  };

  const curr = styles[type];
  const IconComp = curr.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${curr.bg}`}>
      <IconComp className={`w-5 h-5 mt-0.5 shrink-0 ${curr.iconColor}`} />
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

// 7. SHOWCASE PREVIEW COMPONENT
export default function DesignSystemShowcase() {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
      {/* System Intro */}
      <div className="border-b border-navy-200 pb-6">
        <span className={Typography.eyebrow}>Design Tokens & Specification</span>
        <h1 className={Typography.h1 + " mt-1"}>MEGGS KITCHEN Design System</h1>
        <p className={Typography.bodyLarge + " mt-2 max-w-3xl"}>
          Unified enterprise component primitives combining Amazon density, Apple clean typography, IKEA layout, and Jumia high-conversion patterns.
        </p>
      </div>

      {/* Palette & Typography */}
      <section className="space-y-4">
        <h2 className={Typography.h3}>Color Palette</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-primary-600 text-white rounded-xl shadow-sm">
            <p className="text-xs font-bold">Royal Cobalt</p>
            <p className="text-[10px] opacity-80">#0F52BA (Primary)</p>
          </div>
          <div className="p-3 bg-accent-500 text-white rounded-xl shadow-sm">
            <p className="text-xs font-bold">Kitchen Flame</p>
            <p className="text-[10px] opacity-80">#F97316 (Accent)</p>
          </div>
          <div className="p-3 bg-navy-900 text-white rounded-xl shadow-sm">
            <p className="text-xs font-bold">Deep Navy</p>
            <p className="text-[10px] opacity-80">#0F172A (Text/Dark)</p>
          </div>
          <div className="p-3 bg-cream-100 border border-navy-200 text-navy-900 rounded-xl shadow-sm">
            <p className="text-xs font-bold">Warm White</p>
            <p className="text-[10px] text-navy-500">#FAFAF9 (Canvas)</p>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <p className="text-xs font-bold">In-Stock Green</p>
            <p className="text-[10px] opacity-80">#059669 (Success)</p>
          </div>
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm">
            <p className="text-xs font-bold">Culinary Gold</p>
            <p className="text-[10px] opacity-80">#EAB308 (Ratings)</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className={Typography.h3}>Button Styles</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="btn-primary">Primary Action</button>
          <button className="btn-accent">Hot Deal Action</button>
          <button className="btn-secondary">Secondary Action</button>
          <button className="btn-navy">Dark ERP Action</button>
          <button className="btn-outline-primary">Outline Primary</button>
          <button className="btn-ghost">Ghost Link</button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className={Typography.h3}>Status & Inventory Badges</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="in_stock" />
          <StatusBadge status="low_stock" />
          <StatusBadge status="out_of_stock" />
          <StatusBadge status="pending" />
          <StatusBadge status="delivered" />
          <StatusBadge status="b2b" />
        </div>
      </section>

      {/* Product Cards */}
      <section className="space-y-4">
        <h2 className={Typography.h3}>Responsive Product Card Standard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          <ProductGridCard
            id="1"
            name="MEGGS Professional 10-Piece Stainless Steel Heavy Cookware Set"
            price={349.99}
            originalPrice={449.99}
            rating={4.9}
            reviewCount={128}
            imageUrl="https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80"
            category="Cookware & Pots"
            isCommercial={true}
          />
          <ProductGridCard
            id="2"
            name="MEGGS MasterChef Commercial 1200W Kitchen Stand Mixer"
            price={189.50}
            rating={4.7}
            reviewCount={84}
            imageUrl="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
            category="Small Appliances"
          />
        </div>
      </section>

      {/* Alert Boxes */}
      <section className="space-y-4 max-w-3xl">
        <h2 className={Typography.h3}>System Notification Alerts</h2>
        <AlertBox
          type="success"
          title="Order Confirmed #MGG-88421"
          message="Your commercial kitchenware shipment is being processed by Warehouse Alpha."
        />
        <AlertBox
          type="warning"
          title="B2B Bulk Discount Threshold"
          message="Add 2 more commercial convection ovens to unlock an extra 15% trade discount."
        />
      </section>
    </div>
  );
}
