import { useState } from 'react';
import { AlertTriangle, RotateCcw, Plus, X, Search, CheckCircle2, DollarSign } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useDamagedStockAndReturns, useWarehouses } from '@/hooks/use-erp';
import { useProducts } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { formatKES, formatDateTime } from '@/lib/utils';

export default function AdminDamagesReturns() {
  const [activeTab, setActiveTab] = useState<'damaged' | 'returns'>('damaged');

  return (
    <AdminLayout title="Returns & Damaged Items">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('damaged')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'damaged' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-500" /> Damaged & Expired Stock Log
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'returns' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-blue-500" /> Returns Management (Customer & Supplier)
        </button>
      </div>

      {activeTab === 'damaged' ? <DamagedStockTab /> : <ReturnsTab />}
    </AdminLayout>
  );
}

function DamagedStockTab() {
  const { damagedStock, loading, reportDamagedStock } = useDamagedStockAndReturns();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'damaged' | 'expired' | 'broken_in_transit' | 'defective' | 'other'>('damaged');
  const [action, setAction] = useState<'scrapped' | 'returned_to_supplier' | 'discounted_sale' | 'pending'>('scrapped');
  const [notes, setNotes] = useState('');

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !warehouseId) {
      toast({ title: 'Select product and warehouse', variant: 'destructive' });
      return;
    }

    const prod = products.find((p) => p.id === productId);

    try {
      await reportDamagedStock({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity,
        reason,
        cost_price: prod ? prod.cost_price || prod.price * 0.6 : 0,
        reported_by: 'QA & Inventory Inspector',
        reported_at: new Date().toISOString(),
        action_taken: action,
        status: 'approved',
        notes: notes || null,
      });

      toast({ title: 'Damaged stock recorded and deducted from active stock' });
      setShowModal(false);
      setProductId('');
      setQuantity(1);
      setNotes('');
    } catch {
      toast({ title: 'Failed to record damaged stock', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Damaged / Expired Stock
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading damaged stock records...</div>
      ) : damagedStock.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">No Damaged Stock Reported</h3>
          <p className="text-sm text-navy-500 mb-4">Keep your inventory clean by writing off damaged or expired items.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Log Damaged Stock</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-bold text-navy-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Qty</th>
                <th className="px-6 py-3.5">Estimated Cost</th>
                <th className="px-6 py-3.5">Action Taken</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {damagedStock.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-navy-900">{d.product?.name || 'Catalog Item'}</td>
                  <td className="px-6 py-4 text-navy-600 capitalize">{d.reason.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 font-bold text-red-600">{d.quantity}</td>
                  <td className="px-6 py-4 font-bold text-navy-800">{formatKES(d.quantity * (d.cost_price || 0))}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-navy-700 px-2.5 py-1 rounded-full font-bold capitalize">
                      {d.action_taken.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-navy-400">{formatDateTime(d.reported_at)}</td>
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
              <h2 className="font-bold text-lg text-navy-900">Report Damaged or Expired Stock</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-navy-400" /></button>
            </div>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Product *</label>
                <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="input text-sm">
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Warehouse Hub *</label>
                <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="input text-sm">
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Quantity *</label>
                  <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="input text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Damage Reason</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value as any)} className="input text-sm">
                    <option value="damaged">Damaged in Storage</option>
                    <option value="broken_in_transit">Broken in Transit</option>
                    <option value="defective">Manufacturing Defect</option>
                    <option value="expired">Expired Date</option>
                    <option value="other">Other Reason</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Action Taken</label>
                <select value={action} onChange={(e) => setAction(e.target.value as any)} className="input text-sm">
                  <option value="scrapped">Scrapped / Written Off</option>
                  <option value="returned_to_supplier">Returned to Supplier for Credit</option>
                  <option value="discounted_sale">Clearance / Discounted Sale</option>
                  <option value="pending">Pending Inspection</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Inspection Notes</label>
                <textarea placeholder="Describe physical condition..." value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Log Damaged Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReturnsTab() {
  const { returns, loading, processReturn } = useDamagedStockAndReturns();
  const { products } = useProducts();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [returnType, setReturnType] = useState<'customer_return' | 'supplier_return'>('customer_return');
  const [customerName, setCustomerName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<'resellable' | 'damaged' | 'refurbished' | 'scrapped'>('resellable');
  const [refundAmount, setRefundAmount] = useState(0);
  const [reason, setReason] = useState('');

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast({ title: 'Select product', variant: 'destructive' });
      return;
    }

    try {
      await processReturn({
        return_number: `RET-${Date.now().toString().slice(-6)}`,
        return_type: returnType,
        customer_name: customerName || 'Walk-in Customer',
        product_id: productId,
        quantity,
        condition,
        refund_amount: refundAmount,
        reason: reason || 'Customer changed specification requirements',
        status: 'processed',
        processed_by: 'Customer Support Desk',
      });

      toast({ title: 'Return processed & stock restocked accordingly' });
      setShowModal(false);
      setCustomerName('');
      setProductId('');
      setQuantity(1);
      setRefundAmount(0);
      setReason('');
    } catch {
      toast({ title: 'Failed to process return', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Process Customer / Supplier Return
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading returns...</div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">No Stock Returns Logged</h3>
          <p className="text-sm text-navy-500 mb-4">Track customer item returns, warranty exchanges, or supplier RMA returns.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Process Return</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-bold text-navy-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Return #</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Customer / Supplier</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Condition</th>
                <th className="px-6 py-3.5">Refund Value</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-navy-900">{r.return_number}</td>
                  <td className="px-6 py-4 text-xs font-bold uppercase text-navy-600">
                    {r.return_type === 'customer_return' ? 'Customer Return' : 'Supplier RMA'}
                  </td>
                  <td className="px-6 py-4 text-navy-700">{r.customer_name || r.supplier_name || 'N/A'}</td>
                  <td className="px-6 py-4 font-bold text-navy-800">{r.product?.name || 'Item'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium capitalize">
                      {r.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-700">{formatKES(r.refund_amount)}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold uppercase">
                      {r.status}
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
              <h2 className="font-bold text-lg text-navy-900">Process Stock Return</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-navy-400" /></button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Return Category</label>
                  <select value={returnType} onChange={(e) => setReturnType(e.target.value as any)} className="input text-sm">
                    <option value="customer_return">Customer Return</option>
                    <option value="supplier_return">Return to Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Party Name</label>
                  <input placeholder="Customer or Supplier Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Product *</label>
                <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="input text-sm">
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Quantity</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="input text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Condition</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as any)} className="input text-sm">
                    <option value="resellable">Resellable (Restock)</option>
                    <option value="damaged">Damaged</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="scrapped">Scrapped</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Refund (KES)</label>
                  <input type="number" min="0" value={refundAmount} onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)} className="input text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Return Reason</label>
                <textarea placeholder="e.g. Item size mismatch or minor cosmetic scratch" value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Process Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
