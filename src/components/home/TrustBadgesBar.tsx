import { ShieldCheck, Truck, CreditCard, Award, Wrench } from 'lucide-react';

export function TrustBadgesBar() {
  const badges = [
    {
      icon: CreditCard,
      title: 'M-Pesa Payment',
      subtitle: 'Instant Paybill & Till Checkout',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Checkout',
      subtitle: 'Encrypted & Safe Local Gateway',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: Award,
      title: 'Genuine Products',
      subtitle: '100% Original Commercial Grade',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      icon: Truck,
      title: 'Nationwide Delivery',
      subtitle: 'Nairobi Same-Day & Countrywide',
      color: 'text-primary-600 bg-primary-50 border-primary-100',
    },
    {
      icon: Wrench,
      title: 'Manufacturer Warranty',
      subtitle: 'Full Spare Parts & Service Support',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="bg-white rounded-2xl border border-navy-100 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-navy-50/50 border border-navy-100/60 hover:bg-white hover:border-navy-200 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${b.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-xs text-navy-950 truncate leading-snug">
                    {b.title}
                  </h4>
                  <p className="text-[10px] text-navy-500 truncate leading-tight mt-0.5">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
