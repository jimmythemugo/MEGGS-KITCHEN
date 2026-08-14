import { useState, useEffect, useCallback } from 'react';
import { Search, X, Phone, Mail, MapPin, Building2, ShoppingCart, FileText, Wallet, Crown, Award, Tag, MessageSquare, Plus } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { formatDateTime, formatKES } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/admin/Pagination';
import type { Customer, Order, Quotation } from '@/lib/types';

function getCustomerSegment(customer: Customer, totalSpent: number, orderCount: number) {
  if (totalSpent > 1000000) return { label: 'VIP Executive', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (customer.company || totalSpent > 500000) return { label: 'Wholesale B2B', color: 'bg-purple-100 text-purple-800 border-purple-300' };
  if (orderCount >= 3) return { label: 'Repeat Buyer', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  if (orderCount === 0) return { label: 'Lead / Prospect', color: 'bg-gray-100 text-gray-700 border-gray-300' };
  return { label: 'Standard Retail', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
}

function getLoyaltyTier(points: number) {
  if (points >= 5000) return { name: 'Platinum', badge: 'bg-slate-800 text-white' };
  if (points >= 2000) return { name: 'Gold', badge: 'bg-amber-500 text-white' };
  if (points >= 500) return { name: 'Silver', badge: 'bg-slate-300 text-slate-800' };
  return { name: 'Bronze', badge: 'bg-amber-800 text-amber-100' };
}

export default function AdminCustomers() {
  const { page, setPage, limit, total, totalPages, from, to, setTotal } = usePagination(20);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (!error) {
      setCustomers(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [from, to, search, setTotal]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <AdminLayout title="Customers">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or company..."
            className="input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <p className="text-gray-500">{search ? 'No customers match your search' : 'No customers yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Segment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Loyalty Tier</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => {
                const points = Math.floor(Math.random() * 2500) + 100;
                const tier = getLoyaltyTier(points);
                const seg = getCustomerSegment(customer, points * 400, Math.floor(points / 300));
                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelected(customer)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-900">{customer.name}</p>
                      {customer.company && <p className="text-xs text-navy-500">{customer.company}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-700">
                      <div>{customer.email}</div>
                      <div className="text-xs text-navy-400">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${seg.color}`}>
                        {seg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${tier.badge}`}>
                        <Award className="w-3 h-3" />
                        {tier.name} ({points} pts)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(customer.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} total={total} limit={limit} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}

function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<string[]>([
    'Customer interested in commercial combi ovens for new restaurant opening in Westlands.',
    'Prefers payment via Bank Wire Transfer for VAT invoice tax compliance.',
  ]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [o, q] = await Promise.all([
        supabase.from('orders').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('quotations').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
      ]);
      setOrders(o.data || []);
      setQuotations(q.data || []);
      setLoading(false);
    }
    load();
  }, [customer.id]);

  const totalSpent = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0);
  const points = Math.floor(totalSpent / 500) + 150;
  const tier = getLoyaltyTier(points);
  const segment = getCustomerSegment(customer, totalSpent, orders.length);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([newNote.trim(), ...notes]);
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xl text-navy-900">{customer.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${segment.color}`}>
                {segment.label}
              </span>
            </div>
            <p className="text-xs text-navy-500 mt-1">Customer ID: {customer.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-navy-700"><Mail className="w-4 h-4 text-navy-400" /><span>{customer.email}</span></div>
          <div className="flex items-center gap-2 text-navy-700"><Phone className="w-4 h-4 text-navy-400" /><span>{customer.phone}</span></div>
          {customer.company && <div className="flex items-center gap-2 text-navy-700"><Building2 className="w-4 h-4 text-navy-400" /><span>{customer.company}</span></div>}
          {customer.address && <div className="flex items-center gap-2 text-navy-700"><MapPin className="w-4 h-4 text-navy-400" /><span>{customer.address}</span></div>}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 text-center">
            <ShoppingCart className="w-4 h-4 mx-auto text-primary-600 mb-1" />
            <p className="text-base font-bold text-navy-900">{orders.length}</p>
            <p className="text-xs text-navy-500">Orders</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
            <Wallet className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <p className="text-base font-bold text-navy-900">{formatKES(totalSpent)}</p>
            <p className="text-xs text-navy-500">Total Spent</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
            <FileText className="w-4 h-4 mx-auto text-purple-600 mb-1" />
            <p className="text-base font-bold text-navy-900">{quotations.length}</p>
            <p className="text-xs text-navy-500">Quotations</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
            <Award className="w-4 h-4 mx-auto text-amber-600 mb-1" />
            <p className="text-base font-bold text-navy-900">{points} pts</p>
            <p className="text-xs text-amber-700 font-semibold">{tier.name} Member</p>
          </div>
        </div>

        {/* CRM Internal Notes */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-navy-900 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-600" />
            Account Executive CRM Notes
          </h3>
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add internal customer note or interaction memo..."
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button type="submit" className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Note
            </button>
          </form>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notes.map((note, idx) => (
              <div key={idx} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-navy-800">
                {note}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center py-4 text-gray-500">Loading order history...</p>
        ) : (
          <div className="space-y-4">
            {orders.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-navy-900 mb-2">Order History</h3>
                <div className="space-y-1">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex justify-between items-center text-xs py-2 px-3 bg-gray-50 rounded border border-gray-100">
                      <span className="font-mono font-semibold text-navy-800">{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className="font-semibold text-primary-700">{formatKES(o.total_amount)}</span>
                      <span className="text-gray-500">{formatDateTime(o.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
