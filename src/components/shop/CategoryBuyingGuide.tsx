import { useState } from 'react';
import { BookOpen, ChevronDown, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface GuideSection {
  title: string;
  categorySlug: string;
  subtitle: string;
  tips: { question: string; answer: string }[];
}

const CATEGORY_GUIDES: Record<string, GuideSection> = {
  cookware: {
    title: "Chef's Guide to Culinary Cookware & Pots",
    categorySlug: "cookware",
    subtitle: "How to choose between Stainless Steel 18/10, Heavy Cast Iron, and Non-Stick Titanium.",
    tips: [
      {
        question: "What is 18/10 Stainless Steel Cookware?",
        answer: "18/10 stainless steel contains 18% chromium for rust resistance and 10% nickel for a brilliant mirror luster and high durability. Tri-ply encapsulated bottoms ensure uniform heat distribution without hot spots."
      },
      {
        question: "Is Non-Stick ceramic safe for commercial high-heat frying?",
        answer: "Ceramic non-stick is non-toxic (PFOA & PTFE free) and best for light to medium heat. For heavy commercial searing, heavy-gauge stainless steel or pre-seasoned cast iron is recommended."
      },
      {
        question: "Are these pots compatible with Induction cooktops?",
        answer: "All our heavy stainless steel stockpots and cast iron cookware feature magnetic stainless steel base plates designed for modern induction, gas, electric, and radiant stovetops."
      }
    ]
  },
  'kitchen-appliances': {
    title: "Kitchen Appliances & Motor Power Buyer's Guide",
    categorySlug: "kitchen-appliances",
    subtitle: "Wattage, motor RPM, and commercial durability considerations for home & restaurant kitchens.",
    tips: [
      {
        question: "How many Watts do I need in a blender for frozen smoothies and ice crushing?",
        answer: "For smooth frozen blends and tough ingredients, look for a 1200W to 2200W commercial motor with Japanese stainless steel 6-blade assemblies."
      },
      {
        question: "What is the benefit of a Planetary Stand Mixer for dough kneading?",
        answer: "Planetary mixing action rotates the attachment off-center while revolving around the bowl, ensuring 100% dough contact with zero unmixed flour pockets."
      }
    ]
  },
  glassware: {
    title: "Crystal & Glassware Care & Durability Guide",
    categorySlug: "glassware",
    subtitle: "Selecting heat-resistant borosilicate glass and chip-resistant rim tumblers.",
    tips: [
      {
        question: "What makes Borosilicate Glass superior for hot drinkware?",
        answer: "Borosilicate glass has a high thermal shock resistance, meaning it withstands sudden temperature shifts from boiling hot tea to ice water without cracking."
      }
    ]
  }
};

export function CategoryBuyingGuide({ categorySlug }: { categorySlug?: string }) {
  const guide = categorySlug ? CATEGORY_GUIDES[categorySlug.toLowerCase()] : CATEGORY_GUIDES.cookware;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!guide) return null;

  return (
    <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-navy-800 my-8">
      <div className="flex items-center gap-2 text-accent-400 font-bold text-xs uppercase tracking-wider mb-2">
        <BookOpen className="w-4 h-4" />
        <span>Expert Kitchenware Buyer's Guide</span>
      </div>

      <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-2">
        {guide.title}
      </h2>
      <p className="text-navy-200 text-xs sm:text-sm mb-6 max-w-3xl">
        {guide.subtitle}
      </p>

      <div className="space-y-3">
        {guide.tips.map((tip, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-4 flex items-center justify-between font-display font-bold text-sm text-white hover:text-accent-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{tip.question}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-4 pt-0 text-navy-200 text-xs leading-relaxed border-t border-white/5 bg-navy-950/40">
                  {tip.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
