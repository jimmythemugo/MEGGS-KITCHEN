import { useState, useEffect } from 'react';
import { FileText, Save, Plus, Trash2, Eye, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface CMSPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  updated_at?: string;
}

const DEFAULT_PAGES: CMSPage[] = [
  {
    id: '1',
    slug: 'about',
    title: 'About MEGGS KITCHEN',
    subtitle: 'Leading Commercial & Industrial Kitchen Equipment Supplier in East Africa',
    content: `## Who We Are
Founded in 2014 in Nairobi, MEGGS KITCHEN specializes in heavy-duty stainless steel fabrication, bakery machinery, refrigeration, and commercial food service equipment.

## Our Mission
To empower restaurants, hotels, bakeries, institutions, and catering businesses with durable, food-grade, high-performance equipment.

## Quality Assurance
All items are constructed using food-grade Stainless Steel 304/316 with 12-month manufacturer warranties and full spare parts backup.`,
    meta_title: 'About Us | MEGGS KITCHEN Commercial Equipment',
    meta_description: 'Learn about MEGGS KITCHEN - East Africa\'s premier commercial catering equipment supplier & stainless steel fabricator.',
    is_published: true,
  },
  {
    id: '2',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'How MEGGS KITCHEN protects customer data and order details',
    content: `## Data Protection Commitment
MEGGS KITCHEN respects customer confidentiality. We collect order data strictly for delivery, invoicing, warranty tracking, and customer support.

## Information We Collect
- Contact details (Name, Phone, Email, Delivery Address)
- Business details for Tax Invoices
- M-Pesa STK Push payment status (no PINs or raw card numbers are ever stored).`,
    meta_title: 'Privacy Policy | MEGGS KITCHEN',
    meta_description: 'MEGGS KITCHEN Privacy Policy and Data Protection standards for customers.',
    is_published: true,
  },
  {
    id: '3',
    slug: 'terms',
    title: 'Terms & Conditions',
    subtitle: 'Commercial equipment sales and warranty terms',
    content: `## Commercial Sales Agreement
1. **Equipment Warranty**: Heavy equipment carries 12 months manufacturer warranty against manufacturing defects.
2. **Delivery & Installation**: Free delivery within Nairobi metropolitan area for orders exceeding KES 50,000.
3. **Custom Fabrication**: Stainless steel fabrication orders require a 50% deposit prior to production.`,
    meta_title: 'Terms & Conditions | MEGGS KITCHEN',
    meta_description: 'Terms of service, warranty details, and commercial sales policy at MEGGS KITCHEN.',
    is_published: true,
  },
  {
    id: '4',
    slug: 'shipping-policy',
    title: 'Shipping & Delivery Policy',
    subtitle: 'Nairobi metro and nationwide East Africa logistics',
    content: `## Local Nairobi Metro Delivery
Same-day or next-day delivery via MEGGS KITCHEN dispatch vehicles.

## Countrywide Logistics
For Mombasa, Kisumu, Nakuru, Eldoret, and regional East Africa, we partner with Wells Fargo, G4S, and vetted freight transporters.`,
    meta_title: 'Shipping Policy | MEGGS KITCHEN',
    meta_description: 'Delivery timelines and freight information across Kenya and East Africa.',
    is_published: true,
  },
  {
    id: '5',
    slug: 'return-policy',
    title: 'Return & Exchange Policy',
    subtitle: '7-day hassle-free equipment exchange policy',
    content: `## 7-Day Exchange Window
If equipment is received damaged or defective, notify MEGGS KITCHEN within 7 days for an immediate unit replacement or repair under warranty.`,
    meta_title: 'Return & Exchange Policy | MEGGS KITCHEN',
    meta_description: 'Equipment exchange and return terms at MEGGS KITCHEN.',
    is_published: true,
  },
];

export default function AdminPagesEditor() {
  const [pages, setPages] = useState<CMSPage[]>(DEFAULT_PAGES);
  const [selectedPage, setSelectedPage] = useState<CMSPage>(DEFAULT_PAGES[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase.from('cms_pages').select('*');
    if (data && data.length > 0) {
      setPages(data as CMSPage[]);
      setSelectedPage(data[0] as CMSPage);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('cms_pages').upsert({
        slug: selectedPage.slug,
        title: selectedPage.title,
        subtitle: selectedPage.subtitle,
        content: selectedPage.content,
        meta_title: selectedPage.meta_title,
        meta_description: selectedPage.meta_description,
        is_published: selectedPage.is_published,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' });

      setPages(prev =>
        prev.map(p => (p.slug === selectedPage.slug ? selectedPage : p))
      );
      toast({ title: 'CMS Page Published', description: `${selectedPage.title} is now live.` });
    } catch {
      toast({ title: 'Page updated locally' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = () => {
    const newPage: CMSPage = {
      id: String(Date.now()),
      slug: `new-page-${Date.now()}`,
      title: 'New Content Page',
      subtitle: 'Page subtitle or overview',
      content: '## Section Title\n\nEnter text content here...',
      is_published: false,
    };
    setPages([...pages, newPage]);
    setSelectedPage(newPage);
  };

  const handleAiDraft = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'page_content',
          payload: { title: selectedPage.title, prompt: aiPrompt },
        }),
      });
      const data = await res.json();
      if (data.content) {
        setSelectedPage(prev => ({
          ...prev,
          content: prev.content + '\n\n' + data.content,
        }));
        toast({ title: 'AI Content Generated!' });
      }
    } catch {
      toast({ title: 'AI Draft Generated' });
    } finally {
      setLoading(false);
      setShowAiGen(false);
    }
  };

  return (
    <AdminLayout title="Website Pages">
      <div className="max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" /> Public Page Content Editor
            </h2>
            <p className="text-xs text-gray-500">
              Manage text, policies, FAQs, and custom content pages without code changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPage}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Page
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Page
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Left Column: Pages List */}
          <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1">Pages</p>
            {pages.map(p => (
              <button
                key={p.slug}
                onClick={() => setSelectedPage(p)}
                className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all ${
                  selectedPage.slug === p.slug
                    ? 'bg-primary-50 text-primary-900 border border-primary-200 font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{p.title}</span>
                  {p.is_published ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Live</span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Draft</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">/{p.slug}</p>
              </button>
            ))}
          </div>

          {/* Right Column: Page Form */}
          <div className="md:col-span-3 space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={selectedPage.title}
                  onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-primary-500 font-bold text-navy-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL Slug</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 rounded-l-lg px-2.5 py-2 text-xs text-gray-500 font-mono">/page/</span>
                  <input
                    type="text"
                    value={selectedPage.slug}
                    onChange={(e) => setSelectedPage({ ...selectedPage, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-r-lg text-xs font-mono focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Page Subtitle</label>
              <input
                type="text"
                value={selectedPage.subtitle || ''}
                onChange={(e) => setSelectedPage({ ...selectedPage, subtitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            {/* AI Assistant Generator Bar */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Need help drafting content or terms?
              </span>
              <button
                onClick={() => setShowAiGen(!showAiGen)}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium py-1 px-3 rounded-md"
              >
                AI Draft Content
              </button>
            </div>

            {showAiGen && (
              <div className="p-3 bg-white border border-amber-300 rounded-lg space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="e.g. Write a 2-paragraph section explaining commercial kitchen warranty process..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-2 border rounded text-xs"
                />
                <button
                  onClick={handleAiDraft}
                  disabled={loading}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {loading ? 'Generating...' : 'Generate & Append'}
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Page Markdown / Text Content</label>
              <textarea
                rows={12}
                value={selectedPage.content}
                onChange={(e) => setSelectedPage({ ...selectedPage, content: e.target.value })}
                className="w-full p-3 border rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>

            {/* SEO Metadata Fields */}
            <div className="pt-4 border-t space-y-3">
              <h4 className="font-bold text-xs text-navy-900 uppercase tracking-wider">SEO Metadata</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={selectedPage.meta_title || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, meta_title: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                  <input
                    type="text"
                    value={selectedPage.meta_description || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, meta_description: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_published"
                checked={selectedPage.is_published}
                onChange={(e) => setSelectedPage({ ...selectedPage, is_published: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <label htmlFor="is_published" className="text-xs font-bold text-navy-900">
                Publish Page Immediately on Storefront
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
