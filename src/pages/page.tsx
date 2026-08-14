import { useState, useEffect, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  BookOpen, 
  Tag, 
  ArrowRight, 
  ChevronRight,
  List
} from 'lucide-react';
import Markdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

export interface CMSPageData {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  category?: string;
  tags?: string[];
  meta_description?: string;
  is_published?: boolean;
}

const DUMMY_CMS_PAGES: Record<string, CMSPageData> = {
  about: {
    slug: 'about',
    title: 'About MEGGS KITCHEN',
    subtitle: 'Leading Commercial & Industrial Kitchen Equipment Supplier in East Africa',
    category: 'Company',
    tags: ['about', 'company', 'equipment', 'nairobi', 'warranty'],
    meta_description: 'East Africa premier commercial catering equipment supplier & stainless steel fabricator.',
    content: `### Who We Are
Founded in 2014 in Nairobi, MEGGS KITCHEN specializes in heavy-duty stainless steel fabrication, bakery machinery, refrigeration, and commercial food service equipment.

### Our Mission
To empower restaurants, hotels, bakeries, institutions, and catering businesses with durable, food-grade, high-performance equipment.

### Quality Assurance
All items are constructed using food-grade Stainless Steel 304/316 with 12-month manufacturer warranties and full spare parts backup.`,
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'How MEGGS KITCHEN protects customer data and order details',
    category: 'Legal',
    tags: ['privacy', 'legal', 'data', 'security', 'terms'],
    meta_description: 'MEGGS KITCHEN Privacy Policy and Data Protection standards for customers.',
    content: `### Data Protection Commitment
MEGGS KITCHEN respects customer confidentiality. We collect order data strictly for delivery, invoicing, warranty tracking, and customer support.

### Information We Collect
- Contact details (Name, Phone, Email, Delivery Address)
- Business details for Tax Invoices
- M-Pesa STK Push payment status (no PINs or raw card numbers are ever stored).`,
  },
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    subtitle: 'Commercial equipment sales and warranty terms',
    category: 'Legal',
    tags: ['terms', 'legal', 'warranty', 'sales', 'privacy'],
    meta_description: 'Terms of service, warranty details, and commercial sales policy at MEGGS KITCHEN.',
    content: `### Commercial Sales Agreement
1. **Equipment Warranty**: Heavy equipment carries 12 months manufacturer warranty against manufacturing defects.
2. **Delivery & Installation**: Free delivery within Nairobi metropolitan area for orders exceeding KES 50,000.
3. **Custom Fabrication**: Stainless steel fabrication orders require a 50% deposit prior to production.`,
  },
  'shipping-policy': {
    slug: 'shipping-policy',
    title: 'Shipping & Delivery Policy',
    subtitle: 'Nairobi metro and nationwide East Africa logistics',
    category: 'Logistics',
    tags: ['shipping', 'delivery', 'logistics', 'nairobi', 'returns'],
    meta_description: 'Delivery timelines and freight information across Kenya and East Africa.',
    content: `### Local Nairobi Metro Delivery
Same-day or next-day delivery via MEGGS KITCHEN dispatch vehicles.

### Countrywide Logistics
For Mombasa, Kisumu, Nakuru, Eldoret, and regional East Africa, we partner with Wells Fargo, G4S, and vetted freight transporters.`,
  },
  'return-policy': {
    slug: 'return-policy',
    title: 'Return & Exchange Policy',
    subtitle: '7-day hassle-free equipment exchange policy',
    category: 'Logistics',
    tags: ['returns', 'exchange', 'warranty', 'shipping', 'policy'],
    meta_description: 'Equipment exchange and return terms at MEGGS KITCHEN.',
    content: `### 7-Day Exchange Window
If equipment is received damaged or defective, notify MEGGS KITCHEN within 7 days for an immediate unit replacement or repair under warranty.`,
  },
  'warranty-info': {
    slug: 'warranty-info',
    title: 'Commercial Equipment Warranty',
    subtitle: '12-month manufacturer warranty terms and spare parts backup',
    category: 'Support',
    tags: ['warranty', 'support', 'terms', 'equipment', 'service'],
    meta_description: 'Comprehensive warranty guidelines for heavy-duty commercial kitchen equipment.',
    content: `### 12-Month Warranty Coverage
All heavy commercial kitchen and bakery equipment purchased from MEGGS KITCHEN comes with a 12-month comprehensive warranty covering manufacturing defects and electrical component failure.`,
  },
};

function inferCategory(p: CMSPageData): string {
  if (p.category) return p.category;
  const s = p.slug.toLowerCase();
  if (s.includes('privacy') || s.includes('terms') || s.includes('legal')) return 'Legal';
  if (s.includes('shipping') || s.includes('return') || s.includes('delivery')) return 'Logistics';
  if (s.includes('about') || s.includes('company') || s.includes('contact')) return 'Company';
  return 'Guide';
}

function getPageTags(p: CMSPageData): string[] {
  if (Array.isArray(p.tags) && p.tags.length > 0) {
    return p.tags.map((t) => t.toLowerCase());
  }
  const raw = `${p.slug} ${p.title} ${p.subtitle || ''}`.toLowerCase();
  const words = raw.replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w.length > 3);
  return Array.from(new Set(words));
}

function stripMarkdown(markdown: string): string {
  if (!markdown) return '';
  return markdown
    .replace(/#+\s+/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/>\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function extractFAQFromMarkdown(markdown: string, pageTitle?: string): FAQItem[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const faqs: FAQItem[] = [];

  let currentQuestion = '';
  let currentAnswerLines: string[] = [];

  const QUESTION_STARTERS = [
    'what', 'how', 'why', 'when', 'where', 'who', 'can', 'do', 'does', 'is', 'are', 'which', 'will', 'should', 'would', 'could'
  ];

  const flushFAQ = () => {
    if (currentQuestion && currentAnswerLines.length > 0) {
      const rawAnswer = currentAnswerLines.join('\n');
      const cleanAnswer = stripMarkdown(rawAnswer);
      const cleanQuestion = stripMarkdown(currentQuestion).replace(/^Q:\s*/i, '').trim();

      if (cleanQuestion.length >= 5 && cleanAnswer.length >= 10) {
        faqs.push({
          question: cleanQuestion,
          answer: cleanAnswer,
        });
      }
    }
    currentQuestion = '';
    currentAnswerLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    const boldQMatch = line.match(/^\*\*(?:Q:\s*|Question:\s*|)(.+?)\*\*$/i);
    const qPrefixMatch = line.match(/^(?:Q|Question)\s*\d*[:\.-]\s*(.+)$/i);

    let detectedQuestion = '';

    if (headingMatch) {
      const headingText = headingMatch[2].trim();
      const lowerHeading = headingText.toLowerCase();

      const isExplicitQuestion =
        headingText.endsWith('?') ||
        lowerHeading.startsWith('q:') ||
        lowerHeading.startsWith('question:') ||
        QUESTION_STARTERS.some((qs) => lowerHeading.startsWith(qs));

      if (isExplicitQuestion) {
        detectedQuestion = headingText;
      } else if (headingMatch[1].length >= 2) {
        detectedQuestion = headingText;
      }
    } else if (boldQMatch) {
      detectedQuestion = boldQMatch[1].trim();
    } else if (qPrefixMatch) {
      detectedQuestion = qPrefixMatch[1].trim();
    }

    if (detectedQuestion) {
      flushFAQ();
      let formattedQ = detectedQuestion.replace(/^Q:\s*/i, '').trim();
      const lowerQ = formattedQ.toLowerCase();
      if (!formattedQ.endsWith('?') && QUESTION_STARTERS.some((qs) => lowerQ.startsWith(qs))) {
        formattedQ += '?';
      }
      currentQuestion = formattedQ;
    } else if (currentQuestion) {
      currentAnswerLines.push(line);
    }
  }

  flushFAQ();

  return faqs;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractTOC(markdown: string): TOCItem[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const items: TOCItem[] = [];
  const usedIds = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    // match ## or ### (H2 or H3)
    const match = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length; // 2 or 3
      let rawText = match[2];
      // strip inline markdown symbols like **, *, `, [text](url), etc.
      rawText = rawText
        .replace(/[*_~`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

      if (!rawText) continue;

      let baseId = slugifyHeading(rawText);
      if (!baseId) baseId = `heading-${items.length + 1}`;

      let id = baseId;
      let counter = 1;
      while (usedIds.has(id)) {
        id = `${baseId}-${counter++}`;
      }
      usedIds.add(id);

      items.push({ id, text: rawText, level });
    }
  }

  return items;
}

function extractTextFromNode(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (typeof node === 'object' && 'props' in node && (node as any).props?.children) {
    return extractTextFromNode((node as any).props.children);
  }
  return '';
}

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codeText = extractTextFromNode(children);
    if (codeText) {
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-5 rounded-xl overflow-hidden border border-navy-800 bg-navy-950 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-navy-900/90 border-b border-navy-800 text-[10px] text-gray-400 font-mono font-medium tracking-wider uppercase">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Code Block
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 text-[11px] font-sans font-semibold text-gray-300 hover:text-white bg-navy-800 hover:bg-navy-700 px-2.5 py-1 rounded-md transition-colors border border-navy-700/80 active:scale-95 shadow-sm"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-gray-400" />
                <span>Copy</span>
              </>
            )}
          </button>
          <span className="text-primary-400 font-mono text-[10px]">MEGGS CMS</span>
        </div>
      </div>
      <pre className="p-4 sm:p-5 font-mono text-xs sm:text-sm text-gray-100 overflow-x-auto leading-relaxed whitespace-pre font-normal">
        {children}
      </pre>
    </div>
  );
}

export default function CMSPublicPage() {
  const [, params] = useRoute<{ slug: string }>('/page/:slug');
  const slug = params?.slug || 'about';

  const [page, setPage] = useState<CMSPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPages, setRelatedPages] = useState<CMSPageData[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  const tocItems = useMemo(() => {
    return page?.content ? extractTOC(page.content) : [];
  }, [page?.content]);

  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -50% 0px' }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  // Dynamic SEO Title memoization
  const seoTitle = useMemo(() => {
    const pageTitle = page?.title || slug.replace(/-/g, ' ').toUpperCase();
    return `${pageTitle} | MEGGS KITCHEN Kenya`;
  }, [page?.title, slug]);

  // Extract FAQ items from markdown content for Schema.org FAQPage structured data
  const faqList = useMemo(() => {
    return page?.content ? extractFAQFromMarkdown(page.content, page.title) : [];
  }, [page?.content, page?.title]);

  // Generate Schema.org FAQPage JSON-LD payload
  const faqSchema = useMemo(() => {
    if (!faqList || faqList.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqList.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }, [faqList]);

  // Comprehensive SEO Metadata Initialization & FAQPage Schema Sync Effect
  useEffect(() => {
    if (!page) return;

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://meggskitchen.co.ke';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/page/${page.slug}`;

    // 1. Synchronize Document Title
    document.title = seoTitle;

    // 2. Derive Meta Description
    let metaDesc = page.meta_description || page.subtitle;
    if (!metaDesc && page.content) {
      const plainText = stripMarkdown(page.content);
      metaDesc = plainText.length > 160 ? `${plainText.substring(0, 157)}...` : plainText;
    }
    if (!metaDesc) {
      metaDesc = 'MEGGS KITCHEN - Commercial & Industrial Kitchen Equipment Supplier in Nairobi, Kenya.';
    }

    const setMeta = (attr: 'name' | 'property', key: string, val: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.content = val;
    };

    // Standard & OpenGraph & Twitter Meta Tags Initialization
    setMeta('name', 'description', metaDesc);
    setMeta('property', 'og:title', seoTitle);
    setMeta('property', 'og:description', metaDesc);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:site_name', 'MEGGS KITCHEN Kenya');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', seoTitle);
    setMeta('name', 'twitter:description', metaDesc);

    // Canonical link tag
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // 3. Inject / Synchronize Schema.org FAQPage JSON-LD <script id="cms-faq-schema"> in document.head
    let faqScript = document.getElementById('cms-faq-schema') as HTMLScriptElement | null;
    if (faqSchema) {
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.id = 'cms-faq-schema';
        faqScript.type = 'application/ld+json';
        document.head.appendChild(faqScript);
      }
      faqScript.textContent = JSON.stringify(faqSchema);
    } else if (faqScript) {
      faqScript.remove();
    }

    // Cleanup script on page change or component unmount
    return () => {
      const existingScript = document.getElementById('cms-faq-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [page, seoTitle, faqSchema]);

  const fetchPage = async () => {
    setLoading(true);
    let currentPageData: CMSPageData | null = null;
    try {
      const { data } = await supabase.from('cms_pages').select('*').eq('slug', slug).single();
      if (data && data.content) {
        currentPageData = { ...data, slug: data.slug || slug };
      } else if (DUMMY_CMS_PAGES[slug]) {
        currentPageData = DUMMY_CMS_PAGES[slug];
      } else {
        currentPageData = {
          slug,
          title: slug.replace(/-/g, ' ').toUpperCase(),
          subtitle: 'Official MEGGS KITCHEN Information Page',
          category: 'Document',
          tags: [slug],
          content: 'This page content is managed via the MEGGS Admin CMS Panel.',
        };
      }
    } catch {
      if (DUMMY_CMS_PAGES[slug]) {
        currentPageData = DUMMY_CMS_PAGES[slug];
      } else {
        currentPageData = {
          slug,
          title: slug.replace(/-/g, ' ').toUpperCase(),
          subtitle: 'Official MEGGS KITCHEN Information Page',
          category: 'Document',
          tags: [slug],
          content: 'This page content is managed via the MEGGS Admin CMS Panel.',
        };
      }
    } finally {
      setPage(currentPageData);
      setLoading(false);
      if (currentPageData) {
        fetchRelatedPages(currentPageData);
      }
    }
  };

  const fetchRelatedPages = async (currentPage: CMSPageData) => {
    try {
      const { data } = await supabase
        .from('cms_pages')
        .select('*')
        .neq('slug', currentPage.slug);

      let candidates: CMSPageData[] = [];

      if (data && data.length > 0) {
        candidates = data
          .filter((p: any) => p.is_published !== false)
          .map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            subtitle: p.subtitle,
            content: p.content,
            category: p.category,
            tags: Array.isArray(p.tags) ? p.tags : undefined,
            meta_description: p.meta_description,
          }));
      }

      // Merge dummy pages into candidates list if not already present
      Object.values(DUMMY_CMS_PAGES).forEach((dummy) => {
        if (
          dummy.slug !== currentPage.slug &&
          !candidates.some((c) => c.slug === dummy.slug)
        ) {
          candidates.push(dummy);
        }
      });

      // Score candidates by category and tag relevance
      const currentCat = (currentPage.category || inferCategory(currentPage)).toLowerCase();
      const currentTags = getPageTags(currentPage);

      const scored = candidates.map((candidate) => {
        let score = 0;
        const candidateCat = (candidate.category || inferCategory(candidate)).toLowerCase();
        const candidateTags = getPageTags(candidate);

        // Category match (+10 points)
        if (candidateCat && candidateCat === currentCat) {
          score += 10;
        }

        // Tag match (+3 points per matching tag)
        currentTags.forEach((tag) => {
          if (candidateTags.includes(tag)) {
            score += 3;
          }
        });

        // Keyword overlap in title or slug (+2 points)
        currentTags.forEach((tag) => {
          if (
            candidate.title.toLowerCase().includes(tag) ||
            candidate.slug.toLowerCase().includes(tag)
          ) {
            score += 2;
          }
        });

        return { candidate, score };
      });

      // Sort candidates by score descending, fallback to title
      scored.sort(
        (a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title)
      );

      setRelatedPages(scored.slice(0, 3).map((item) => item.candidate));
    } catch {
      // Fallback
      const fallback = Object.values(DUMMY_CMS_PAGES)
        .filter((dummy) => dummy.slug !== currentPage.slug)
        .slice(0, 3);
      setRelatedPages(fallback);
    }
  };

  return (
    <CustomerLayout>
      <div className={`w-full mx-auto px-4 py-8 space-y-8 ${tocItems.length > 0 ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
        </Link>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading page content...</div>
        ) : (
          <div className={tocItems.length > 0 ? 'grid grid-cols-1 lg:grid-cols-4 gap-8 items-start' : ''}>
            {/* Article Content Column */}
            <div className={`${tocItems.length > 0 ? 'lg:col-span-3' : ''} space-y-8`}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-6">
                <div className="border-b pb-6 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> MEGGS Official Document
                    </span>
                    {faqList.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>FAQPage Schema Markup Active ({faqList.length} Q&As indexed)</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 capitalize">{page?.title}</h1>
                  {page?.subtitle && <p className="text-sm text-gray-500">{page.subtitle}</p>}
                </div>

                {/* Schema.org FAQPage Structured Data JSON-LD Tag */}
                {faqSchema && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                  />
                )}

                {/* Mobile Expandable Table of Contents */}
                {tocItems.length > 0 && (
                  <div className="lg:hidden p-4 bg-navy-50/70 rounded-xl border border-navy-100/80 space-y-2">
                    <details className="group">
                      <summary className="flex items-center justify-between font-bold text-xs text-navy-900 cursor-pointer list-none">
                        <span className="flex items-center gap-2">
                          <List className="w-4 h-4 text-primary-600" />
                          <span>Table of Contents ({tocItems.length} sections)</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <nav className="mt-3 pt-3 border-t border-navy-100/60 space-y-1">
                        {tocItems.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const el = document.getElementById(item.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                                setActiveId(item.id);
                              }
                            }}
                            className={`block text-xs py-1 px-2 rounded-md transition-colors ${
                              item.level === 3 ? 'ml-3 text-[11px]' : 'font-medium'
                            } ${
                              activeId === item.id
                                ? 'bg-primary-100 text-primary-800 font-bold'
                                : 'text-gray-700 hover:bg-navy-100/50'
                            }`}
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
                    </details>
                  </div>
                )}

                <div className="markdown-body text-sm leading-relaxed text-gray-800 space-y-4">
                  <Markdown
                    components={{
                      h1: ({ children }) => {
                        const text = extractTextFromNode(children);
                        const id = slugifyHeading(text);
                        return (
                          <h1 id={id} className="scroll-mt-28 text-2xl sm:text-3xl font-extrabold text-navy-950 mt-8 mb-4 border-b border-gray-200 pb-2">
                            {children}
                          </h1>
                        );
                      },
                      h2: ({ children }) => {
                        const text = extractTextFromNode(children);
                        const id = slugifyHeading(text);
                        return (
                          <h2 id={id} className="scroll-mt-28 text-xl sm:text-2xl font-bold text-navy-900 mt-6 mb-3 border-b border-gray-100 pb-1">
                            {children}
                          </h2>
                        );
                      },
                      h3: ({ children }) => {
                        const text = extractTextFromNode(children);
                        const id = slugifyHeading(text);
                        return (
                          <h3 id={id} className="scroll-mt-28 text-lg font-bold text-navy-900 mt-5 mb-2">
                            {children}
                          </h3>
                        );
                      },
                      h4: ({ children }) => <h4 className="text-base font-bold text-navy-900 mt-4 mb-2">{children}</h4>,
                      p: ({ children }) => <p className="text-gray-700 leading-relaxed my-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-outside space-y-1.5 my-3 text-gray-700 pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-outside space-y-1.5 my-3 text-gray-700 pl-5">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                      a: ({ href, children }) => <a href={href} className="text-primary-600 underline font-semibold hover:text-primary-800 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                      strong: ({ children }) => <strong className="font-bold text-navy-950">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary-500 pl-4 py-2.5 my-4 italic bg-primary-50/60 text-navy-900 rounded-r-lg shadow-sm">{children}</blockquote>,
                      hr: () => <hr className="my-8 border-t-2 border-gray-100" />,
                      img: ({ src, alt }) => <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-xl border border-gray-200 shadow-sm my-4 object-cover" />,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6 border border-gray-200 rounded-xl shadow-sm">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-navy-950 text-white font-bold text-xs uppercase tracking-wider">{children}</thead>,
                      tbody: ({ children }) => <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>,
                      tr: ({ children }) => <tr className="hover:bg-gray-50/80 transition-colors">{children}</tr>,
                      th: ({ children }) => <th className="p-3 font-semibold text-white border-b border-navy-900">{children}</th>,
                      td: ({ children }) => <td className="p-3 text-gray-700 text-xs sm:text-sm border-b border-gray-100">{children}</td>,
                      code: ({ className, children }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && (typeof children !== 'string' || !children.includes('\n'));
                        if (isInline) {
                          return (
                            <code className="bg-primary-50 text-primary-900 font-mono text-[12px] px-1.5 py-0.5 rounded-md border border-primary-200/80 font-semibold tracking-tight mx-0.5">
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code className={`font-mono text-xs sm:text-sm text-gray-100 leading-relaxed block ${className || ''}`}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                    }}
                  >
                    {page?.content || ''}
                  </Markdown>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Official MEGGS KITCHEN Policy
                  </span>
                  <span>Need help? Contact sales@meggskitchen.co.ke</span>
                </div>
              </div>

              {/* DYNAMIC RELATED ARTICLES SECTION */}
              {relatedPages.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary-100/80 text-primary-700">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-navy-950">
                          Related Articles & Policies
                        </h2>
                        <p className="text-xs text-gray-500">
                          Handpicked policies and documentation relevant to this topic.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/page/about"
                      className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 self-start sm:self-auto"
                    >
                      <span>View All Articles</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {relatedPages.map((art) => {
                      const cat = art.category || inferCategory(art);
                      return (
                        <Link
                          key={art.slug}
                          href={`/page/${art.slug}`}
                          className="group bg-gray-50/70 hover:bg-white rounded-xl p-4 border border-gray-200/80 hover:border-primary-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                                <Tag className="w-2.5 h-2.5" />
                                {cat}
                              </span>
                              <span className="text-[10px] font-medium text-gray-400 group-hover:text-primary-600 flex items-center gap-0.5">
                                Read <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>

                            <h3 className="font-bold text-xs sm:text-sm text-navy-950 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                              {art.title}
                            </h3>

                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                              {art.subtitle || art.meta_description || 'Learn more in our official MEGGS KITCHEN knowledge base.'}
                            </p>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] font-semibold text-primary-600 group-hover:text-primary-700">
                            <span>Explore page</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Sidebar Table of Contents (Desktop) */}
            {tocItems.length > 0 && (
              <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 space-y-4 self-start">
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-navy-950">
                    <List className="w-4 h-4 text-primary-600" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-navy-900">
                      Table of Contents
                    </h2>
                  </div>

                  <nav className="space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                    {tocItems.map((item) => {
                      const isActive = activeId === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(item.id);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                              setActiveId(item.id);
                            }
                          }}
                          className={`block text-xs py-1.5 px-2.5 rounded-lg transition-all leading-snug ${
                            item.level === 3 ? 'ml-3 text-[11px]' : 'font-semibold'
                          } ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 font-bold border-l-2 border-primary-600 shadow-2xs'
                              : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
                          }`}
                        >
                          {item.text}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
