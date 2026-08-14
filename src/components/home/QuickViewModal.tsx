import { useState } from 'react';
import { X, ShoppingCart, Star, ShieldCheck, Truck, Check, Heart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const imageSrc = withFallback(product.image_url, getProductPlaceholder(product.category?.name));
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-navy-100 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-navy-50 hover:bg-navy-100 text-navy-700 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          
          {/* Image */}
          <div className="bg-navy-50/50 rounded-2xl p-4 flex items-center justify-center aspect-square border border-navy-100">
            <img
              src={imageSrc}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Details */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600 bg-accent-50 px-2.5 py-1 rounded-md">
              {product.category?.name || 'Kitchenware'}
            </span>

            <h3 className="font-display text-xl font-bold text-navy-950 mt-2 leading-snug">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <span className="text-xs font-bold text-navy-600">(4.9 / 5.0)</span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-display font-extrabold text-2xl text-navy-950">
                KSh {product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-navy-400 line-through">
                  KSh {product.compare_at_price?.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-navy-600 mt-3 line-clamp-3 leading-relaxed">
              {product.description || 'Premium kitchenware crafted from heavy-duty food-grade materials. Engineered for commercial durability and home performance.'}
            </p>

            {/* Guarantees */}
            <div className="space-y-1.5 mt-4 text-[11px] text-navy-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Original Manufacturer Warranty Included</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-600" />
                <span>Express Region-wide Dispatch Available</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-navy-100 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  added ? 'bg-emerald-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
