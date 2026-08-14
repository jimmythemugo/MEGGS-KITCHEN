import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Truck, 
  CreditCard, 
  User, 
  MapPin, 
  ArrowLeft, 
  ShoppingBag, 
  Phone, 
  Mail, 
  Building, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { useCart } from '@/hooks/use-cart';
import { useDeliveryZones } from '@/hooks/use-data';
import { formatKES } from '@/lib/utils';
import { getProductPlaceholder, withFallback } from '@/lib/placeholders';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const COUNTIES_KENYA = [
  'Nairobi',
  'Kiambu',
  'Mombasa',
  'Nakuru',
  'Eldoret / Uasin Gishu',
  'Machakos',
  'Kajiado',
  'Kisumu',
  'Meru',
  'Nyeri',
  'Other County'
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { zones } = useDeliveryZones();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Multi-step index: 1: Details, 2: Address, 3: Shipping, 4: Payment, 5: Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Customer Details Form
  const [customer, setCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
    accountOption: 'guest', // 'guest' | 'create'
    password: ''
  });

  // Delivery Address Form
  const [address, setAddress] = useState({
    county: 'Nairobi',
    town: 'Westlands / CBD',
    streetAddress: '',
    buildingName: '',
    pickupPoint: 'Direct Delivery to Address',
    deliveryInstructions: ''
  });

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'pickup'>('standard');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'bank' | 'cod'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Shipping cost calculation
  const shippingCost = useMemo(() => {
    if (shippingMethod === 'pickup') return 0;
    if (shippingMethod === 'express') return 15; // $15 express
    if (address.county === 'Nairobi') return 5;  // $5 standard in Nairobi
    return 12; // $12 upcountry
  }, [shippingMethod, address.county]);

  const grandTotal = Math.max(0, totalPrice + shippingCost - discountAmount);

  // Form Validation per step
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!customer.fullName.trim() || !customer.email.trim() || !customer.phone.trim()) {
        toast({ title: 'Missing Information', description: 'Please fill in your name, email and phone number.', variant: 'destructive' });
        return;
      }
      if (!mpesaPhone) setMpesaPhone(customer.phone);
    }

    if (currentStep === 2) {
      if (!address.streetAddress.trim()) {
        toast({ title: 'Delivery Address Required', description: 'Please enter your street address or building landmark.', variant: 'destructive' });
        return;
      }
    }

    setCurrentStep(prev => Math.min(5, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Order Submission
  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const fullDeliveryString = `${address.streetAddress}, ${address.buildingName ? address.buildingName + ', ' : ''}${address.town}, ${address.county} (${address.pickupPoint})`;

      const { data: orderId, error } = await supabase.rpc('create_customer_order', {
        p_name: customer.fullName,
        p_email: customer.email,
        p_phone: customer.phone,
        p_notes: `[Payment: ${paymentMethod.toUpperCase()}] ${address.deliveryInstructions}`,
        p_total_amount: grandTotal,
        p_items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
        })),
        p_coupon_id: null,
        p_delivery_zone_id: null,
        p_delivery_address: fullDeliveryString,
        p_delivery_charge: shippingCost,
        p_discount_amount: discountAmount,
      });

      if (error) throw error;

      // Stash summary for order confirmation page
      try {
        sessionStorage.setItem(
          `order_summary_${orderId}`,
          JSON.stringify({
            items: items.map((item) => ({ name: item.product.name, quantity: item.quantity, price: item.product.price })),
            subtotal: totalPrice,
            deliveryCharge: shippingCost,
            discountAmount,
            total: grandTotal,
            deliveryZoneName: `${address.county} - ${shippingMethod.toUpperCase()}`,
            deliveryAddress: fullDeliveryString,
            paymentMethod: paymentMethod.toUpperCase(),
            customerName: customer.fullName
          })
        );
      } catch (e) {}

      clearCart();
      setLocation(`/order-confirmation/${orderId}`);
    } catch (e: any) {
      toast({
        title: 'Checkout Error',
        description: e.message || 'Unable to place order. Please check your network connection.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-navy-50/30 py-16 flex items-center justify-center font-sans">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-navy-100 shadow-md">
            <ShoppingBag className="w-12 h-12 text-navy-400 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-navy-950 mb-2">Your Cart is Empty</h2>
            <p className="text-navy-500 text-xs mb-6">You need items in your cart to proceed with checkout.</p>
            <Link href="/shop" className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs inline-block">
              Browse Products
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-navy-50/20 py-8 lg:py-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Checkout Header Steps Bar */}
          <div className="bg-white rounded-3xl border border-navy-100 p-4 sm:p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Link href="/cart" className="flex items-center gap-1.5 text-xs font-bold text-navy-600 hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Cart</span>
              </Link>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                256-bit Encrypted Checkout
              </span>
            </div>

            {/* Stepper Progress */}
            <div className="grid grid-cols-5 gap-2 border-t border-navy-100 pt-4 text-center">
              {[
                { step: 1, name: 'Details' },
                { step: 2, name: 'Address' },
                { step: 3, name: 'Shipping' },
                { step: 4, name: 'Payment' },
                { step: 5, name: 'Review' }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <div key={s.step} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed 
                        ? 'bg-emerald-600 text-white' 
                        : isActive 
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100' 
                        : 'bg-navy-100 text-navy-400'
                    }`}>
                      {isPassed ? <Check className="w-4 h-4" /> : s.step}
                    </div>
                    <span className={`text-[11px] font-bold hidden sm:inline ${
                      isActive ? 'text-navy-950' : 'text-navy-400'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT FORM STEP PANELS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* STEP 1: CUSTOMER DETAILS */}
              {currentStep === 1 && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950">
                        1. Customer Contact Information
                      </h3>
                      <p className="text-navy-400 text-xs">Enter your contact info for order updates and SMS dispatch tracking.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={customer.fullName}
                        onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                        placeholder="e.g. John Kamau"
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        Phone Number (SMS & M-Pesa) *
                      </label>
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="+254 700 123 456"
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-navy-100 flex justify-end">
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Continue to Address →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DELIVERY ADDRESS */}
              {currentStep === 2 && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950">
                        2. Delivery & Location Address
                      </h3>
                      <p className="text-navy-400 text-xs">Select your county and precise delivery address or office landmark.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        County *
                      </label>
                      <select
                        value={address.county}
                        onChange={(e) => setAddress({ ...address, county: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all cursor-pointer"
                      >
                        {COUNTIES_KENYA.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        Town / Zone / Estate *
                      </label>
                      <input
                        type="text"
                        value={address.town}
                        onChange={(e) => setAddress({ ...address, town: e.target.value })}
                        placeholder="e.g. Westlands, Kilimani, Thika Road"
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        Street Address / Landmark *
                      </label>
                      <input
                        type="text"
                        value={address.streetAddress}
                        onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                        placeholder="e.g. Ring Road Westlands, Opposite Sarit Centre"
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                        Building Name / Hotel / Restaurant (Optional)
                      </label>
                      <input
                        type="text"
                        value={address.buildingName}
                        onChange={(e) => setAddress({ ...address, buildingName: e.target.value })}
                        placeholder="e.g. Delta Towers, 3rd Floor, Commercial Kitchen"
                        className="w-full px-4 py-3 rounded-xl bg-navy-50/50 border border-navy-200 text-xs font-semibold text-navy-950 outline-none focus:border-primary-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-navy-100 flex justify-between">
                    <button onClick={handlePrevStep} className="px-5 py-2.5 rounded-xl border border-navy-200 font-bold text-xs text-navy-700">
                      ← Back
                    </button>
                    <button onClick={handleNextStep} className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md">
                      Continue to Shipping →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SHIPPING METHOD */}
              {currentStep === 3 && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950">
                        3. Choose Shipping Method
                      </h3>
                      <p className="text-navy-400 text-xs">Select your preferred courier speed or store pickup.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'standard',
                        title: 'Standard Ground Dispatch',
                        time: '1 - 2 Business Days',
                        price: address.county === 'Nairobi' ? '$5.00' : '$12.00',
                        desc: 'Reliable doorstep delivery in Nairobi & major Kenyan towns.'
                      },
                      {
                        id: 'express',
                        title: 'Express Same-Day Priority Courier',
                        time: 'Same-Day (Order before 2 PM)',
                        price: '$15.00',
                        desc: 'Dedicated rider dispatch for urgent kitchenware needs.'
                      },
                      {
                        id: 'pickup',
                        title: 'Free Store Pick-Up (MEGGS Hub)',
                        time: 'Ready in 2 Hours',
                        price: 'FREE',
                        desc: 'Collect directly from our main Nairobi showroom.'
                      }
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          shippingMethod === opt.id
                            ? 'border-primary-600 bg-primary-50/30 shadow-sm'
                            : 'border-navy-100 hover:border-navy-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === opt.id}
                            onChange={() => setShippingMethod(opt.id as any)}
                            className="accent-primary-600 w-4 h-4"
                          />
                          <div>
                            <h4 className="font-display font-bold text-sm text-navy-950">{opt.title}</h4>
                            <p className="text-xs text-navy-500">{opt.desc}</p>
                            <span className="text-[10px] font-bold text-primary-600 uppercase mt-0.5 inline-block">{opt.time}</span>
                          </div>
                        </div>
                        <span className="font-display font-extrabold text-sm text-navy-950">{opt.price}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-navy-100 flex justify-between">
                    <button onClick={handlePrevStep} className="px-5 py-2.5 rounded-xl border border-navy-200 font-bold text-xs text-navy-700">
                      ← Back
                    </button>
                    <button onClick={handleNextStep} className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md">
                      Continue to Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: PAYMENT METHOD */}
              {currentStep === 4 && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950">
                        4. Payment Method Selection
                      </h3>
                      <p className="text-navy-400 text-xs">Choose secure M-Pesa Express, Credit Card, Bank Transfer, or Cash on Delivery.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* M-Pesa Option */}
                    <div className={`p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'mpesa' ? 'border-emerald-600 bg-emerald-50/20' : 'border-navy-100'
                    }`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'mpesa'}
                            onChange={() => setPaymentMethod('mpesa')}
                            className="accent-emerald-600 w-4 h-4"
                          />
                          <div>
                            <span className="font-display font-bold text-sm text-navy-950">M-Pesa Express (Lipa na M-Pesa)</span>
                            <p className="text-xs text-navy-500">Instant STK Push prompt to your Safaricom mobile phone.</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                          Recommended
                        </span>
                      </label>

                      {paymentMethod === 'mpesa' && (
                        <div className="mt-4 pt-4 border-t border-emerald-100 pl-7 space-y-2">
                          <label className="block text-xs font-bold text-navy-700">Confirm M-Pesa Phone Number:</label>
                          <input
                            type="tel"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                            placeholder="07XX XXX XXX"
                            className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-white border border-navy-200 text-xs font-bold text-navy-950"
                          />
                          <p className="text-[11px] text-navy-400">You will receive a prompt on this phone to enter your PIN upon confirmation.</p>
                        </div>
                      )}
                    </div>

                    {/* Credit Card Option */}
                    <div className={`p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'card' ? 'border-primary-600 bg-primary-50/20' : 'border-navy-100'
                    }`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                            className="accent-primary-600 w-4 h-4"
                          />
                          <div>
                            <span className="font-display font-bold text-sm text-navy-950">Credit / Debit Card (Visa, MasterCard)</span>
                            <p className="text-xs text-navy-500">Secure card processing powered by international gateway.</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Bank Wire Option */}
                    <div className={`p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'bank' ? 'border-primary-600 bg-primary-50/20' : 'border-navy-100'
                    }`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'bank'}
                            onChange={() => setPaymentMethod('bank')}
                            className="accent-primary-600 w-4 h-4"
                          />
                          <div>
                            <span className="font-display font-bold text-sm text-navy-950">Direct Bank Transfer (EFT/RTGS)</span>
                            <p className="text-xs text-navy-500">Ideal for corporate proforma invoices & bulk orders.</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Cash on Delivery Option */}
                    <div className={`p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50/20' : 'border-navy-100'
                    }`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="accent-primary-600 w-4 h-4"
                          />
                          <div>
                            <span className="font-display font-bold text-sm text-navy-950">Cash on Delivery (COD)</span>
                            <p className="text-xs text-navy-500">Pay cash or M-Pesa upon rider arrival in Nairobi zones.</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-navy-100 flex justify-between">
                    <button onClick={handlePrevStep} className="px-5 py-2.5 rounded-xl border border-navy-200 font-bold text-xs text-navy-700">
                      ← Back
                    </button>
                    <button onClick={handleNextStep} className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md">
                      Review Final Order →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW ORDER */}
              {currentStep === 5 && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950">
                        5. Final Order Review
                      </h3>
                      <p className="text-navy-400 text-xs">Verify your shipping address and items before completing order.</p>
                    </div>
                  </div>

                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-navy-50/50 p-4 rounded-2xl border border-navy-100">
                    <div>
                      <span className="font-bold text-navy-400 uppercase">Customer Contact</span>
                      <p className="font-bold text-navy-950 mt-0.5">{customer.fullName}</p>
                      <p className="text-navy-600">{customer.email}</p>
                      <p className="text-navy-600">{customer.phone}</p>
                    </div>

                    <div>
                      <span className="font-bold text-navy-400 uppercase">Delivery Address</span>
                      <p className="font-bold text-navy-950 mt-0.5">{address.county}, {address.town}</p>
                      <p className="text-navy-600">{address.streetAddress}</p>
                      <p className="text-primary-600 font-semibold">{shippingMethod.toUpperCase()} Delivery (${shippingCost.toFixed(2)})</p>
                    </div>
                  </div>

                  {/* Payment Choice Badge */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary-50 border border-primary-100 text-xs font-bold text-primary-950">
                    <span>Payment Method: {paymentMethod.toUpperCase()}</span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Guaranteed Secure
                    </span>
                  </div>

                  {/* Action */}
                  <div className="pt-4 border-t border-navy-100 flex justify-between items-center">
                    <button onClick={handlePrevStep} className="px-5 py-2.5 rounded-xl border border-navy-200 font-bold text-xs text-navy-700">
                      ← Edit Order
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                      className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? 'Processing Order...' : `Complete Order • $${grandTotal.toFixed(2)}`}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT ORDER SUMMARY SIDEBAR */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-navy-100 p-6 shadow-sm sticky top-24 space-y-4">
                <h3 className="font-display font-bold text-base text-navy-950 pb-3 border-b border-navy-100 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs text-primary-600 font-bold">{items.length} Items</span>
                </h3>

                {/* Items Thumbnails */}
                <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                  {items.map(({ product, quantity }) => {
                    const imageSrc = withFallback(product.image_url, getProductPlaceholder(product.category?.name));
                    return (
                      <div key={product.id} className="flex items-center gap-3">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-contain bg-navy-50/50 p-1 shrink-0 border border-navy-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-xs text-navy-950 truncate">{product.name}</h4>
                          <p className="text-[11px] text-navy-400">Qty: {quantity} × ${product.price.toFixed(2)}</p>
                        </div>
                        <span className="font-display font-extrabold text-xs text-navy-950">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Calculation */}
                <div className="pt-3 border-t border-navy-100 space-y-2 text-xs font-semibold text-navy-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-navy-950">${totalPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-navy-950">${shippingCost.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-navy-100 text-sm font-bold text-navy-950">
                    <span>Grand Total</span>
                    <span className="font-display text-lg font-black text-primary-600">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="p-3 bg-navy-50 rounded-2xl text-[11px] text-navy-500 space-y-1.5 pt-3">
                  <div className="flex items-center gap-1.5 font-bold text-navy-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    MEGGS Kitchenware Guarantee
                  </div>
                  <p>All items backed by 1-Year Manufacturer Warranty & 7-Day Replacement Policy.</p>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </CustomerLayout>
  );
}
