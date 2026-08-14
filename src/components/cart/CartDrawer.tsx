import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { withFallback, getProductPlaceholder } from '@/lib/placeholders';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 200; // $200 for free delivery in Nairobi

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const [, setLocation] = useLocation();

  if (!isOpen) return null;

  const freeShippingProgress = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-navy-100 flex items-center justify-between bg-navy-950 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Shopping Cart ({totalItems})
                </h3>
                <p className="text-[11px] text-navy-200">MEGGS Kitchenware Direct</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-navy-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-primary-50 p-3.5 border-b border-primary-100">
            <div className="flex items-center justify-between text-xs font-bold text-primary-950 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary-600" />
                {remainingForFreeShipping > 0 
                  ? `Add $${remainingForFreeShipping.toFixed(2)} more for FREE Delivery!`
                  : '🎉 You unlocked FREE Delivery!'}
              </span>
              <span className="text-primary-700">{Math.round(freeShippingProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-primary-200/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-navy-50">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center text-navy-400 mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-lg text-navy-950 mb-1">
                  Your cart is empty
                </h4>
                <p className="text-navy-500 text-xs mb-6 max-w-xs mx-auto">
                  Explore top-quality stockpots, blenders, chef knives, and chafing dishes to get started.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    setLocation('/shop');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const imageSrc = withFallback(product.image_url, getProductPlaceholder(product.category?.name));
                return (
                  <div key={product.id} className="pt-3 first:pt-0 flex gap-3 group">
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-contain bg-navy-50/50 p-1.5 shrink-0 border border-navy-100"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display font-bold text-xs text-navy-950 group-hover:text-primary-600 line-clamp-2">
                            {product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-navy-300 hover:text-red-500 transition-colors p-0.5"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-medium text-navy-400 mt-0.5">
                          ${product.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Buttons */}
                        <div className="flex items-center bg-navy-50 border border-navy-100 rounded-lg">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 text-navy-600 hover:text-navy-950 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-navy-950">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1 text-navy-600 hover:text-navy-950 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <span className="font-display font-extrabold text-xs text-navy-950">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-navy-100 bg-navy-50/50 space-y-3">
              <div className="space-y-1.5 text-xs font-semibold text-navy-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-navy-950">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-navy-400">Calculated at Checkout</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-navy-100 text-sm font-bold text-navy-950">
                  <span>Estimated Total</span>
                  <span className="font-display text-base font-black text-primary-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    setLocation('/cart');
                  }}
                  className="py-3 rounded-xl border border-navy-200 bg-white hover:bg-navy-50 text-navy-900 font-bold text-xs text-center transition-all"
                >
                  View Full Cart
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    setLocation('/checkout');
                  }}
                  className="py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <span>Checkout Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust Guarantee note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-navy-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted 256-bit M-Pesa & Card Checkout</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
