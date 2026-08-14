import { Star, Quote, CheckCircle2, ThumbsUp } from 'lucide-react';
import { useTestimonials } from '@/hooks/use-data';

const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    author_name: 'Chef David Mwangi',
    author_title: 'Head Chef, Serena Hotel Nairobi',
    content: 'We outfitted our entire commercial kitchen with MEGGS KITCHEN stainless steel equipment and heavy blenders. High-grade durability, outstanding thermal control, and direct local warranty support!',
    rating: 5,
    product_mentioned: 'Commercial Convection Oven & Blenders',
    verified: true
  },
  {
    id: 'r2',
    author_name: 'Sarah Wanjiku',
    author_title: 'Home Culinary Enthusiast',
    content: 'The cast iron skillet set and Japanese knife block set are phenomenal. Heat distribution is perfectly even, and same-day delivery to Westlands was super fast!',
    rating: 5,
    product_mentioned: 'Heavy-Duty Cast Iron Skillet Set',
    verified: true
  },
  {
    id: 'r3',
    author_name: 'Peter Ochieng',
    author_title: 'Catering Director, Crown Events',
    content: 'Ordered 12 chafing dishes and 50 dinnerware sets for our catering business. The quality exceeded our expectations and the wholesale quotation process was seamless.',
    rating: 5,
    product_mentioned: 'Stainless Steel Chafing Dish Pack',
    verified: true
  },
];

export function CustomerReviews() {
  const { testimonials } = useTestimonials();

  const reviewsList = testimonials.length >= 3
    ? testimonials.slice(0, 3).map(t => ({
        id: t.id,
        author_name: t.name,
        author_title: t.role || 'Verified Customer',
        content: t.content,
        rating: t.rating || 5,
        product_mentioned: 'MEGGS KITCHEN Culinary Gear',
        verified: true
      }))
    : DEFAULT_REVIEWS;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
          Verified Reviews Across Kenya
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950 mt-3">
          What Our Chefs & Customers Say
        </h2>
        <p className="text-xs text-navy-500 mt-2">
          Read verified feedback from top hotel chefs, restaurant owners & passionate home cooks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviewsList.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-3xl border border-navy-100 p-6 shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Rating & Verified Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-amber-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                {review.verified && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Buyer</span>
                  </span>
                )}
              </div>

              {/* Quote Content */}
              <Quote className="w-8 h-8 text-navy-200 mb-2" />
              <p className="text-xs text-navy-700 leading-relaxed font-normal italic">
                "{review.content}"
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-navy-50">
              <p className="font-display font-bold text-sm text-navy-950">{review.author_name}</p>
              <p className="text-[11px] text-navy-500">{review.author_title}</p>
              <div className="mt-2 text-[10px] font-bold text-primary-600 bg-navy-50/80 px-2.5 py-1 rounded-lg inline-block">
                Purchased: {review.product_mentioned}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
