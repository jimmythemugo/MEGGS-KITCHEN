import { useState } from 'react';
import { ArrowLeftRight, SlidersHorizontal, Plus, Search, X, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useStockTransfers, useWarehouses } from '@/hooks/use-erp';
import { useProducts } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import type { StockTransfer } from '@/lib/types';

export default function AdminStockTransfers() {
  const [activeTab, setActiveTab] = useState<'transfers' | 'adjustments'>('transfers');

  return (
    <AdminLayout title="Update Stock">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'transfers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Inter-Warehouse Transfers
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'adjustments' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Stock Adjustments & Corrections
        </button>
      </div>

      {activeTab === 'transfers' ? <TransfersTab /> : <AdjustmentsTab />}
    </AdminLayout>
  );
}

function TransfersTab() {
  const { transfers, loading, createTransfer } = useStockTransfers();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [sourceWh, setSourceWh] = useState('');
  const [targetWh, setTargetWh] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWh || !targetWh) {
      toast({ title: 'Select both source and target warehouses', variant: 'destructive' });
      return;
    }
    if (sourceWh === targetWh) {
      toast({ title: 'Source and target warehouses must be different', variant: 'destructive' });
      return;
    }
    if (!productId) {
      toast({ title: 'Select a product to transfer', variant: 'destructive' });
      return;
    }

    try {
      await createTransfer({
        transfer_number: `TRF-${Date.now().toString().slice(-6)}`,
        source_warehouse_id: sourceWh,
        target_warehouse_id: targetWh,
        product_id: productId,
        quantity,
        status: 'completed',
        reason: reason || 'Stock reallocation across branch hubs',
        transfer_date: new Date().toISOString(),
        created_by: 'Admin ERP System',
        notes: null,
      });

      toast({ title: 'Stock transfer completed successfully' });
      setShowModal(false);
      setSourceWh('');
      setTargetWh('');
      setProductId('');
      setQuantity(1);
      setReason('');
    } catch {
      toast({ title: 'Failed to complete stock transfer', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Initiate Stock Transfer
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading transfers...</div>
      ) : transfers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">No Inter-Warehouse Transfers</h3>
          <p className="text-sm text-navy-500 mb-4">Transfer products between central logistics hubs and showroom branches.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Initiate Transfer</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-bold text-navy-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Ref Number</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">From Hub</th>
                <th className="px-6 py-3.5">To Hub</th>
                <th className="px-6 py-3.5">Qty</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-navy-900">{t.transfer_number}</td>
                  <td className="px-6 py-4 text-navy-500">{formatDateTime(t.transfer_date)}</td>
                  <td className="px-6 py-4 font-bold text-navy-800">{t.product?.name || 'Catalog Item'}</td>
                  <td className="px-6 py-4 text-navy-600">{t.source_warehouse?.name || 'Central Hub'}</td>
                  <td className="px-6 py-4 text-navy-600">{t.target_warehouse?.name || 'Showroom'}</td>
                  <td className="px-6 py-4 font-bold text-primary-700">{t.quantity}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold uppercase">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-bold text-lg text-navy-900">Initiate Inter-Warehouse Transfer</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-navy-400" /></button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Source Warehouse Hub *</label>
                <select required value={sourceWh} onChange={(e) => setSourceWh(e.target.value)} className="input text-sm">
                  <option value="">Select Origin</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Target Destination Hub *</label>
                <select required value={targetWh} onChange={(e) => setTargetWh(e.target.value)} className="input text-sm">
                  <option value="">Select Destination</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Product *</label>
                <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="input text-sm">
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Available: {p.stock_quantity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Quantity to Transfer *</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="input text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Reason / Reference Notes</label>
                <textarea placeholder="e.g. Stock balancing for upcoming promotion in Westlands" value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdjustmentsTab() {
  const { products, refetch } = useProducts();
  const { toast } = useToast();

  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'in' | 'out' | 'correction' | 'lost' | 'damaged' | 'expiry'>('correction');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast({ title: 'Select a product', variant: 'destructive' });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'A reason is required for audit trail compliance', variant: 'destructive' });
      return;
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    let newStock = targetProduct.stock_quantity;
    if (type === 'in') newStock += quantity;
    else if (type === 'out' || type === 'lost' || type === 'damaged' || type === 'expiry') newStock -= quantity;
    else if (type === 'correction') newStock = quantity;

    if (newStock < 0) {
      toast({ title: 'Negative stock is not permitted unless explicitly authorized', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('inventory_movements').insert({
        product_id: productId,
        movement_type: type === 'in' ? 'in' : type === 'correction' ? 'adjustment' : 'out',
        quantity,
        previous_stock: targetProduct.stock_quantity,
        new_stock: newStock,
        notes: `[${type.toUpperCase()}] ${reason}`,
      });

      await supabase.from('products').update({ stock_quantity: newStock }).eq('id', productId);

      toast({ title: `Stock level updated to ${newStock} units` });
      setProductId('');
      setQuantity(1);
      setReason('');
      refetch();
    } catch {
      toast({ title: 'Failed to apply adjustment', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-lg text-navy-900 mb-2 flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-primary-600" /> Stock Adjustment & Inventory Audit
      </h3>
      <p className="text-xs text-navy-500 mb-6">
        Record stock corrections, write-offs, lost goods, or physical count audits. Every adjustment is logged with full audit trail compliance.
      </p>

      <form onSubmit={handleAdjustment} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-navy-700 mb-1 block">Select Product Catalog Master *</label>
          <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="input text-sm">
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Current Stock: {p.stock_quantity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 mb-1 block">Adjustment Reason Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="input text-sm">
            <option value="correction">Set Exact Physical Count (Stock Take Correction)</option>
            <option value="in">Manual Stock In (Add Stock)</option>
            <option value="out">Manual Stock Out (Deduct Stock)</option>
            <option value="lost">Lost / Stolen Inventory Write-Off</option>
            <option value="damaged">Damaged in Transit / Storage</option>
            <option value="expiry">Expired Stock Discard</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 mb-1 block">
            {type === 'correction' ? 'New Total Physical Quantity *' : 'Adjustment Delta Quantity *'}
          </label>
          <input type="number" min="0" required value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="input text-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 mb-1 block">Mandatory Audit Reason *</label>
          <textarea required placeholder="State exact reason for this adjustment for compliance..." value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm min-h-[80px]" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Recording Adjustment...' : 'Record Stock Adjustment'}
        </button>
      </form>
    </div>
  );
}
