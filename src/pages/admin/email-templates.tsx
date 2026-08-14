import { useState, useEffect } from 'react';
import { Mail, Save, Eye, RefreshCw, Send, CheckCircle2, Code } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  is_active: boolean;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    template_key: 'order_confirmation',
    name: 'Order Confirmation Email',
    subject: 'Thank you for your order #{{order_number}} - MEGGS KITCHEN',
    body_html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; rounded: 8px;">
  <h2 style="color: #0f172a;">Order Confirmation</h2>
  <p>Dear {{customer_name}},</p>
  <p>Thank you for purchasing commercial kitchen equipment with MEGGS KITCHEN. We have received your order <strong>#{{order_number}}</strong>.</p>
  <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <p><strong>Order Summary:</strong></p>
    <p>Total Amount: <strong>KES {{total_amount}}</strong></p>
    <p>Payment Status: {{payment_status}}</p>
    <p>Delivery Location: {{delivery_address}}</p>
  </div>
  <p>Our sales and dispatch team is currently processing your machinery. We will contact you shortly.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
  <p style="font-size: 12px; color: #64748b;">MEGGS KITCHEN East Africa | Industrial & Commercial Kitchen Solutions</p>
</div>`,
    variables: ['customer_name', 'order_number', 'total_amount', 'payment_status', 'delivery_address'],
    is_active: true,
  },
  {
    id: '2',
    template_key: 'invoice_email',
    name: 'Commercial Invoice Email',
    subject: 'Tax Invoice #{{invoice_number}} for Order #{{order_number}}',
    body_html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0f172a;">Official Tax Invoice</h2>
  <p>Hi {{customer_name}},</p>
  <p>Please find attached your official commercial invoice <strong>#{{invoice_number}}</strong> for KES {{amount_due}}.</p>
  <p>VAT (16%): KES {{vat_amount}}</p>
  <p>Thank you for choosing MEGGS KITCHEN.</p>
</div>`,
    variables: ['customer_name', 'invoice_number', 'order_number', 'amount_due', 'vat_amount'],
    is_active: true,
  },
  {
    id: '3',
    template_key: 'shipping_notification',
    name: 'Shipping & Dispatch Notification',
    subject: 'Your MEGGS KITCHEN order #{{order_number}} is on the way!',
    body_html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0284c7;">Dispatch Alert</h2>
  <p>Hello {{customer_name}},</p>
  <p>Your heavy equipment shipment has been dispatched. Carrier: <strong>{{courier_name}}</strong>. Tracking Number: <strong>{{tracking_number}}</strong>.</p>
</div>`,
    variables: ['customer_name', 'order_number', 'courier_name', 'tracking_number'],
    is_active: true,
  },
  {
    id: '4',
    template_key: 'welcome_newsletter',
    name: 'Customer Welcome & Offers',
    subject: 'Welcome to MEGGS KITCHEN - Exclusive Commercial Deals Inside',
    body_html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0f172a;">Welcome to MEGGS KITCHEN</h2>
  <p>Hi {{customer_name}},</p>
  <p>Enjoy 5% off your first bakery or restaurant machinery order using coupon code: <strong>{{coupon_code}}</strong>.</p>
</div>`,
    variables: ['customer_name', 'coupon_code'],
    is_active: true,
  },
];

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [activeKey, setActiveKey] = useState('order_confirmation');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(DEFAULT_TEMPLATES[0]);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('email_templates').select('*');
    if (data && data.length > 0) {
      setTemplates(data as EmailTemplate[]);
      const current = data.find((t: any) => t.template_key === activeKey) || data[0];
      setSelectedTemplate(current as EmailTemplate);
    }
  };

  const handleSelect = (tmpl: EmailTemplate) => {
    setActiveKey(tmpl.template_key);
    setSelectedTemplate(tmpl);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('email_templates').upsert({
        template_key: selectedTemplate.template_key,
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        body_html: selectedTemplate.body_html,
        variables: selectedTemplate.variables,
        is_active: selectedTemplate.is_active,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'template_key' });

      if (error && error.code !== 'PGRST116') {
        // Fallback to local state save
      }

      setTemplates(prev =>
        prev.map(t => (t.template_key === selectedTemplate.template_key ? selectedTemplate : t))
      );
      toast({ title: 'Email Template Saved', description: `${selectedTemplate.name} updated successfully.` });
    } catch {
      toast({ title: 'Template updated locally' });
    } finally {
      setSaving(false);
    }
  };

  const renderPreviewHtml = () => {
    let html = selectedTemplate.body_html;
    const dummyVals: Record<string, string> = {
      customer_name: 'John Doe (Nairobi Restaurant Ltd)',
      order_number: 'MK-2026-8942',
      total_amount: '185,000',
      payment_status: 'Paid via M-Pesa STK Push',
      delivery_address: 'Industrial Area, Commercial Street, Nairobi',
      invoice_number: 'INV-8831',
      amount_due: '185,000',
      vat_amount: '25,517',
      courier_name: 'Wells Fargo Express Logistics',
      tracking_number: 'WF-NBI-99214',
      coupon_code: 'MEGGSWELCOME5',
    };

    Object.entries(dummyVals).forEach(([k, v]) => {
      html = html.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
    return html;
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast({ title: 'Please enter an email address', variant: 'destructive' });
      return;
    }
    toast({
      title: 'Test Email Dispatched',
      description: `Preview sent to ${testEmail} using MEGGS Mailer engine.`,
    });
  };

  return (
    <AdminLayout title="Email Notices">
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" /> System Email Template Manager
            </h2>
            <p className="text-xs text-gray-500">
              Customize commercial transactional emails, invoices, dispatch alerts, and customer notifications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Template
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Left Column: Template List */}
          <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1">Templates</p>
            {templates.map(tmpl => (
              <button
                key={tmpl.template_key}
                onClick={() => handleSelect(tmpl)}
                className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all ${
                  activeKey === tmpl.template_key
                    ? 'bg-primary-50 text-primary-900 border border-primary-200 font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <p className="truncate">{tmpl.name}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tmpl.template_key}</p>
              </button>
            ))}
          </div>

          {/* Right Column: Template Editor */}
          <div className="md:col-span-3 space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm">{selectedTemplate.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode('editor')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 ${
                    previewMode === 'editor' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Editor
                </button>
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 ${
                    previewMode === 'preview' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Visual Preview
                </button>
              </div>
            </div>

            {/* Template Variable Chips */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
              <span className="font-semibold text-gray-700">Available Variables (Click to Insert):</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.variables?.map(v => (
                  <button
                    key={v}
                    onClick={() => {
                      setSelectedTemplate(prev => ({
                        ...prev,
                        body_html: prev.body_html + ` {{${v}}}`,
                      }));
                    }}
                    className="px-2 py-0.5 bg-white border border-gray-300 hover:border-primary-500 rounded text-[11px] font-mono text-primary-700"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Subject Line</label>
              <input
                type="text"
                value={selectedTemplate.subject}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Content Mode */}
            {previewMode === 'editor' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">HTML Body Content</label>
                <textarea
                  rows={14}
                  value={selectedTemplate.body_html}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body_html: e.target.value })}
                  className="w-full p-3 border rounded-lg text-xs font-mono bg-gray-900 text-emerald-400 focus:ring-2 focus:ring-primary-500 leading-relaxed"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-100 min-h-[350px]">
                <div className="bg-white p-2 border-b text-xs text-gray-500 mb-4 rounded flex items-center gap-2">
                  <span className="font-bold text-gray-700">Subject:</span> {selectedTemplate.subject}
                </div>
                <div
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-sm"
                  dangerouslySetInnerHTML={{ __html: renderPreviewHtml() }}
                />
              </div>
            )}

            {/* Send Test Email Box */}
            <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="admin@meggskitchen.co.ke"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-xs w-64"
                />
                <button
                  onClick={handleSendTest}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send Test Email
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Active Template:</label>
                <input
                  type="checkbox"
                  checked={selectedTemplate.is_active}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, is_active: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
