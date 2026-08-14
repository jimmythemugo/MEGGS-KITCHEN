import { useState } from 'react';
import { Megaphone, Mail, MessageSquare, Send, Calendar, Clock, Sparkles, CheckCircle, Plus, Users, ShoppingBag, Gift, ArrowRight } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  trigger: string;
  target_segment: string;
  status: 'active' | 'draft' | 'paused';
  sent_count: number;
  open_rate: string;
  conversion_rate: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Abandoned Cart Follow-up (1h)',
    type: 'whatsapp',
    trigger: 'Cart inactive for 60 minutes',
    target_segment: 'All Customers',
    status: 'active',
    sent_count: 142,
    open_rate: '94%',
    conversion_rate: '18.5%',
  },
  {
    id: 'camp-2',
    name: 'Welcome & 10% Discount Offer',
    type: 'email',
    trigger: 'New Customer Sign-up',
    target_segment: 'New Customers',
    status: 'active',
    sent_count: 380,
    open_rate: '68%',
    conversion_rate: '22.1%',
  },
  {
    id: 'camp-3',
    name: 'VIP Loyalty Reward & Birthday Gift',
    type: 'sms',
    trigger: 'Customer Birthday / Tier Upgrade',
    target_segment: 'VIP & Platinum Members',
    status: 'active',
    sent_count: 89,
    open_rate: '98%',
    conversion_rate: '34.2%',
  },
  {
    id: 'camp-4',
    name: 'Re-engagement Discount (30d Inactive)',
    type: 'email',
    trigger: 'No order for 30 days',
    target_segment: 'Inactive Customers',
    status: 'active',
    sent_count: 215,
    open_rate: '42%',
    conversion_rate: '9.8%',
  },
  {
    id: 'camp-5',
    name: 'Post-Delivery Review Request',
    type: 'whatsapp',
    trigger: 'Order Delivered + 2 Days',
    target_segment: 'Completed Orders',
    status: 'active',
    sent_count: 512,
    open_rate: '89%',
    conversion_rate: '41.0%',
  },
];

export default function AdminMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [activeTab, setActiveTab] = useState<'automated' | 'broadcast' | 'templates'>('automated');
  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'whatsapp',
    trigger: 'Manual Broadcast',
    target_segment: 'All Customers',
  });
  const { toast } = useToast();

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) return;

    const created: Campaign = {
      id: `camp-${Date.now()}`,
      name: newCampaign.name,
      type: newCampaign.type,
      trigger: newCampaign.trigger,
      target_segment: newCampaign.target_segment,
      status: 'active',
      sent_count: 0,
      open_rate: '0%',
      conversion_rate: '0%',
    };

    setCampaigns([created, ...campaigns]);
    setShowModal(false);
    setNewCampaign({ name: '', type: 'email', trigger: 'Manual Broadcast', target_segment: 'All Customers' });
    toast({ title: 'Campaign created and activated' });
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
      )
    );
    toast({ title: 'Campaign status updated' });
  };

  return (
    <AdminLayout title="Marketing">
      <div className="space-y-6">
        {/* Top Header stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Automations</span>
              <Sparkles className="w-4 h-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-navy-900">{campaigns.filter(c => c.status === 'active').length}</p>
            <p className="text-xs text-green-600 mt-1">Running 24/7 automatically</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Messages Delivered</span>
              <Send className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-navy-900">1,338</p>
            <p className="text-xs text-navy-500 mt-1">Last 30 days</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Open Rate</span>
              <Mail className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-navy-900">78.2%</p>
            <p className="text-xs text-emerald-600 mt-1">+12.4% over industry avg</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Recovered Revenue</span>
              <Gift className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-navy-900">KES 485,000</p>
            <p className="text-xs text-purple-600 mt-1">Via automated cart follow-ups</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('automated')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'automated'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Automated Triggers
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'broadcast'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Broadcast Campaigns
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Message Templates
            </button>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>

        {/* List of Automated Triggers */}
        {activeTab === 'automated' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-navy-900">Automated Customer Journey Triggers</h2>
              <span className="text-xs text-navy-500">Triggers automatically send based on real-time customer activity</span>
            </div>
            <div className="divide-y divide-gray-200">
              {campaigns.map((camp) => (
                <div key={camp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg text-white mt-1 ${
                      camp.type === 'whatsapp' ? 'bg-emerald-500' : camp.type === 'sms' ? 'bg-blue-500' : 'bg-primary-500'
                    }`}>
                      {camp.type === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : camp.type === 'sms' ? <Send className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-navy-900">{camp.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                          camp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {camp.status}
                        </span>
                      </div>
                      <p className="text-sm text-navy-600 mt-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-navy-400" />
                        Trigger: <span className="font-medium">{camp.trigger}</span>
                      </p>
                      <p className="text-xs text-navy-400 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Target: {camp.target_segment}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right text-xs">
                      <p className="text-navy-400">Delivered</p>
                      <p className="font-bold text-sm text-navy-900">{camp.sent_count}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-navy-400">Open Rate</p>
                      <p className="font-bold text-sm text-emerald-600">{camp.open_rate}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-navy-400">Conversion</p>
                      <p className="font-bold text-sm text-primary-600">{camp.conversion_rate}</p>
                    </div>
                    <button
                      onClick={() => toggleCampaignStatus(camp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        camp.status === 'active'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {camp.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Broadcast tab */}
        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-navy-900">Instant Broadcast Campaigns</h2>
            <p className="text-sm text-navy-600">Send one-time marketing updates, flash sale alerts, or seasonal newsletters to selected customer segments.</p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 cursor-pointer bg-gray-50/50">
                <Mail className="w-6 h-6 text-primary-500 mb-2" />
                <h3 className="font-bold text-sm text-navy-900">Email Newsletter Broadcast</h3>
                <p className="text-xs text-navy-500 mt-1">Rich HTML layout with product recommendations & coupon codes.</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 cursor-pointer bg-gray-50/50">
                <MessageSquare className="w-6 h-6 text-emerald-500 mb-2" />
                <h3 className="font-bold text-sm text-navy-900">WhatsApp VIP Alert</h3>
                <p className="text-xs text-navy-500 mt-1">Direct message to High-Value & Platinum members with instant response link.</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer bg-gray-50/50">
                <Send className="w-6 h-6 text-blue-500 mb-2" />
                <h3 className="font-bold text-sm text-navy-900">Bulk SMS Promo</h3>
                <p className="text-xs text-navy-500 mt-1">Short text promo code for flash sales and holiday discount announcements.</p>
              </div>
            </div>
          </div>
        )}

        {/* Templates tab */}
        {activeTab === 'templates' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-900 text-sm">Abandoned Cart Remainder</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold">WhatsApp</span>
              </div>
              <p className="text-xs text-navy-600 bg-gray-50 p-3 rounded-lg border font-mono">
                "Hi &#123;&#123;customer_name&#125;&#125;, you left items in your Meggs Kitchen cart! Complete your order now and enjoy free express delivery across Nairobi. Click here: &#123;&#123;checkout_link&#125;&#125;"
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-900 text-sm">Order Follow-up & Review</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">Email</span>
              </div>
              <p className="text-xs text-navy-600 bg-gray-50 p-3 rounded-lg border font-mono">
                "Subject: How is your new kitchen appliance working?
                Hi &#123;&#123;customer_name&#125;&#125;, thanks for choosing Meggs Kitchen! We'd love to hear your feedback on your recent purchase of &#123;&#123;product_name&#125;&#125;."
              </p>
            </div>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h2 className="font-bold text-lg text-navy-900">Create Marketing Campaign</h2>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Campaign Name</label>
                  <input
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g. Flash Sale Weekend Blast"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Channel</label>
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as any })}
                    className="input"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Trigger Event</label>
                  <select
                    value={newCampaign.trigger}
                    onChange={(e) => setNewCampaign({ ...newCampaign, trigger: e.target.value })}
                    className="input"
                  >
                    <option value="Manual Broadcast">Manual Immediate Broadcast</option>
                    <option value="Cart inactive for 60 minutes">Cart Inactive for 60m</option>
                    <option value="New Customer Sign-up">New Customer Sign-up</option>
                    <option value="Order Completed + 2 Days">Order Completed + 2 Days</option>
                    <option value="Customer Birthday / Tier Upgrade">Customer Birthday / Tier Upgrade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Target Segment</label>
                  <select
                    value={newCampaign.target_segment}
                    onChange={(e) => setNewCampaign({ ...newCampaign, target_segment: e.target.value })}
                    className="input"
                  >
                    <option value="All Customers">All Customers</option>
                    <option value="New Customers">New Customers</option>
                    <option value="Returning Customers">Returning Customers</option>
                    <option value="VIP & Platinum Members">VIP & Platinum Members</option>
                    <option value="Inactive Customers">Inactive Customers (30d+)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Automation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
