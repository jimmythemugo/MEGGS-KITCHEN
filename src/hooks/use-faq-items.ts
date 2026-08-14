import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
}

const defaultFaqs: FaqItem[] = [
  {
    id: "1",
    question: "What types of kitchenware and culinary equipment do you supply?",
    answer: "We supply a comprehensive range of commercial kitchen equipment, stainless steel cookware, heavy-duty cooking pots, blenders & food processors, forged chef knives, dinnerware, bakeware, insulated thermos flasks, glassware, and food storage containers.",
    category: "Products",
  },
  {
    id: "2",
    question: "Do you supply both home kitchenware and commercial restaurant equipment?",
    answer: "Yes! We cater to individual home chefs looking for premium cookware, as well as hotels, restaurants, bakeries, cafes, hospitals, and institutional kitchens requiring heavy-duty commercial equipment.",
    category: "Products",
  },
  {
    id: "3",
    question: "Do you offer delivery across Kenya and East Africa?",
    answer: "Yes, we provide nationwide delivery across all counties in Kenya (including Nairobi, Mombasa, Kisumu, Nakuru, Eldoret) and regional freight delivery to Uganda, Tanzania, and Rwanda.",
    category: "Shipping & Delivery",
  },
  {
    id: "4",
    question: "Can I request a formal quotation or proforma invoice for my business?",
    answer: "Absolutely! You can submit an online Request for Quotation (RFQ) through our website, or contact our commercial sales team directly. We generate official B2B quotations and proforma invoices with full VAT details within 24 hours.",
    category: "Quotations & B2B",
  },
  {
    id: "5",
    question: "Do you provide custom stainless steel fabrication and kitchen design?",
    answer: "Yes, our technical team provides end-to-end commercial kitchen planning, custom stainless steel tabling, prep sinks, extraction hoods, and custom counter fabrication tailored to your kitchen dimensions.",
    category: "Services",
  },
  {
    id: "6",
    question: "Are your commercial appliances and cookware covered by warranty?",
    answer: "Yes, all our commercial equipment and cookware come with manufacturer warranty coverage. We also stock genuine replacement parts and provide routine maintenance services.",
    category: "Warranty & Support",
  },
  {
    id: "7",
    question: "What payment methods do you accept?",
    answer: "We accept Safaricom M-Pesa (Buy Goods Till & Paybill), major credit/debit cards (Visa/Mastercard), bank EFT/RTGS transfers, and corporate purchase orders upon approval.",
    category: "Payment",
  },
  {
    id: "8",
    question: "How do I care for stainless steel cookware and chef knives?",
    answer: "We recommend hand washing chef knives with mild detergent and drying immediately to preserve blade sharpness. For stainless steel cookware, allow pans to cool before washing and use non-abrasive cleaners to maintain the mirror polish.",
    category: "Care & Maintenance",
  },
  {
    id: "9",
    question: "Can I inspect the equipment before purchasing?",
    answer: "Yes, you are welcome to visit our showroom in Nairobi to view our full display of cookware, knives, appliances, and commercial kitchen setups in person.",
    category: "General",
  },
  {
    id: "10",
    question: "How long does delivery take after placing an order?",
    answer: "Same-day or next-day delivery is available within Nairobi and surrounding areas. Upcountry delivery across Kenya typically takes 1-3 business days depending on location.",
    category: "Shipping & Delivery",
  },
];

export function useFaqItems() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setItems(defaultFaqs);
      setLoading(false);
      return;
    }

    const fetchFaqs = async () => {
      try {
        const { data } = await supabase
          .from("faq_items")
          .select("*")
          .order("display_order");

        if (data && data.length > 0) {
          setItems(data as FaqItem[]);
        } else {
          setItems(defaultFaqs);
        }
      } catch {
        setItems(defaultFaqs);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return { items, loading };
}
