import { useState } from 'react';
import { Plus, Truck, PackageCheck, Printer, X, Eye, FileText, CheckCircle2, Clock, AlertTriangle, Search } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { usePurchaseOrders, useSuppliers, useProducts } from '@/hooks/use-data';
import { useGoodsReceivedNotes, useWarehouses } from '@/hooks/use-erp';
import { useToast } from '@/hooks/use-toast';
import { formatKES, formatDateTime } from '@/lib/utils';
import type { PurchaseOrder, PurchaseOrderStatus, GoodsReceivedNote } from '@/lib/types';

const PO_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-navy-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-purple-100 text-purple-700',
  ordered: 'bg-indigo-100 text-indigo-700',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPurchaseOrders() {
  const [activeTab, setActiveTab] = useState<'pos' | 'grn'>('pos');

  return (
    <AdminLayout title="Stock Orders">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pos' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Purchase Orders (PO)
        </button>
        <button
          onClick={() => setActiveTab('grn')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'grn' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Goods Received Notes (GRN)
        </button>
      </div>

      {activeTab === 'pos' ? <PurchaseOrdersTab /> : <GRNTab />}
    </AdminLayout>
  );
}

function PurchaseOrdersTab() {
  const { purchaseOrders, loading, createPurchaseOrder, updatePOStatus } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<PurchaseOrder | null>(null);

  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poItems, setPoItems] = useState<{ product_id: string; description: string; quantity: number; unit_cost: number }[]>([
    { product_id: '', description: '', quantity: 1, unit_cost: 0 },
  ]);

  const handleAddItem = () => {
    setPoItems([...poItems, { product_id: '', description: '', quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...poItems];
    updated[index] = {
      product_id: productId,
      description: prod ? prod.name : '',
      quantity: updated[index].quantity || 1,
      unit_cost: prod ? prod.cost_price || prod.price * 0.7 : 0,
    };
    setPoItems(updated);
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      toast({ title: 'Select a supplier', variant: 'destructive' });
      return;
    }
    if (poItems.length === 0 || !poItems[0].description) {
      toast({ title: 'Add at least one item', variant: 'destructive' });
      return;
    }

    try {
      await createPurchaseOrder(
        {
          po_number: `PO-${Date.now().toString().slice(-6)}`,
          supplier_id: poSupplierId,
          status: 'draft',
          expected_date: poExpectedDate || null,
          notes: poNotes || null,
          created_by: 'Admin ERP System',
        },
        poItems.map((item) => ({
          purchase_order_id: '',
          product_id: item.product_id || null,
          description: item.description,
          quantity_ordered: item.quantity,
          quantity_received: 0,
          unit_cost: item.unit_cost,
        }))
      );

      toast({ title: 'Purchase Order created in Draft state' });
      setShowModal(false);
      setPoSupplierId('');
      setPoNotes('');
      setPoItems([{ product_id: '', description: '', quantity: 1, unit_cost: 0 }]);
    } catch {
      toast({ title: 'Failed to create Purchase Order', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (poId: string, status: PurchaseOrderStatus) => {
    try {
      await updatePOStatus(poId, status);
      toast({ title: `PO status updated to ${status}` });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filtered = purchaseOrders.filter(
    (po) =>
      po.po_number.toLowerCase().includes(search.toLowerCase()) ||
      (po.supplier?.name && po.supplier.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Purchase Order
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search PO # or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading purchase orders...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">No Purchase Orders</h3>
          <p className="text-sm text-navy-500 mb-4">Create purchase orders to restock products from suppliers.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Purchase Order</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-xs font-bold text-navy-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">PO Number</th>
                  <th className="px-6 py-3.5">Supplier</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Total Estimated Cost</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filtered.map((po) => {
                  const totalCost = (po.items || []).reduce(
                    (acc, item) => acc + (item.unit_cost || 0) * (item.quantity_ordered || 0),
                    0
                  );
                  return (
                    <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-navy-900">{po.po_number}</td>
                      <td className="px-6 py-4 text-navy-700">{po.supplier?.name || 'Unknown Supplier'}</td>
                      <td className="px-6 py-4 text-navy-500">{formatDateTime(po.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${PO_STATUS_STYLES[po.status] || 'bg-gray-100 text-gray-700'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-navy-900">{formatKES(totalCost)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <select
                          value={po.status}
                          onChange={(e) => handleStatusChange(po.id, e.target.value as PurchaseOrderStatus)}
                          className="text-xs border rounded px-2 py-1 bg-white font-medium text-navy-700"
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="ordered">Ordered</option>
                          <option value="received">Received</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <button onClick={() => setSelectedPO(po)} className="p-1.5 text-navy-500 hover:text-primary-600 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowPrintModal(po)} className="p-1.5 text-navy-500 hover:text-green-600 rounded" title="Print PO Invoice">
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-bold text-lg text-navy-900">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-navy-400" /></button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Supplier *</label>
                  <select required value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)} className="input text-sm">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Expected Delivery Date</label>
                  <input type="date" value={poExpectedDate} onChange={(e) => setPoExpectedDate(e.target.value)} className="input text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-navy-700">Line Items</label>
                  <button type="button" onClick={handleAddItem} className="text-xs text-primary-600 font-bold hover:underline">
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-lg border">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="input text-xs flex-1"
                      >
                        <option value="">Select Catalog Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[index].quantity = parseInt(e.target.value) || 1;
                          setPoItems(updated);
                        }}
                        className="input text-xs w-20"
                      />

                      <input
                        type="number"
                        min="0"
                        placeholder="Cost"
                        value={item.unit_cost || ''}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[index].unit_cost = parseFloat(e.target.value) || 0;
                          setPoItems(updated);
                        }}
                        className="input text-xs w-24"
                      />

                      {poItems.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Notes / Supplier Instructions</label>
                <textarea placeholder="Payment terms, delivery instructions..." value={poNotes} onChange={(e) => setPoNotes(e.target.value)} className="input text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO View Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedPO(null)}>
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-bold text-lg text-navy-900">Purchase Order {selectedPO.po_number}</h2>
              <button onClick={() => setSelectedPO(null)}><X className="w-5 h-5 text-navy-400" /></button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="text-xs text-navy-400 block">Supplier</span>
                  <span className="font-bold text-navy-900">{selectedPO.supplier?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-navy-400 block">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${PO_STATUS_STYLES[selectedPO.status]}`}>
                    {selectedPO.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-navy-900 mb-2">Order Line Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-navy-600 font-bold">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2">Unit Cost</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedPO.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-navy-800">{item.description}</td>
                          <td className="p-2">{item.quantity_ordered}</td>
                          <td className="p-2">{formatKES(item.unit_cost)}</td>
                          <td className="p-2 text-right font-bold">{formatKES(item.quantity_ordered * item.unit_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="text-xs bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-200">
                  <span className="font-bold block">Notes:</span> {selectedPO.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable PO Invoice Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowPrintModal(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h1 className="text-2xl font-black text-primary-700 tracking-tight">MEGGS KITCHEN ENTERPRISE</h1>
                <p className="text-xs text-navy-500">Official Commercial Purchase Order</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-navy-900">{showPrintModal.po_number}</span>
                <p className="text-xs text-navy-400">{formatDateTime(showPrintModal.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
              <div className="border p-3 rounded-lg">
                <h3 className="font-bold text-navy-900 uppercase tracking-wider mb-1">Supplier Details</h3>
                <p className="font-bold text-navy-800">{showPrintModal.supplier?.name || 'Vendor'}</p>
                <p>{showPrintModal.supplier?.address || 'Nairobi, Kenya'}</p>
                <p>{showPrintModal.supplier?.phone || showPrintModal.supplier?.email}</p>
              </div>
              <div className="border p-3 rounded-lg">
                <h3 className="font-bold text-navy-900 uppercase tracking-wider mb-1">Delivery Destination</h3>
                <p className="font-bold text-navy-800">Meggs Central Logistics Hub</p>
                <p>Mombasa Road, Industrial Area, Nairobi</p>
                <p>Status: <span className="font-bold uppercase text-primary-600">{showPrintModal.status}</span></p>
              </div>
            </div>

            <table className="w-full text-xs text-left mb-6 border">
              <thead className="bg-gray-100 border-b font-bold text-navy-700 uppercase">
                <tr>
                  <th className="p-2.5">Product Description</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(showPrintModal.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-medium">{item.description}</td>
                    <td className="p-2.5 text-center">{item.quantity_ordered}</td>
                    <td className="p-2.5 text-right">{formatKES(item.unit_cost)}</td>
                    <td className="p-2.5 text-right font-bold">{formatKES(item.quantity_ordered * item.unit_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-end border-t pt-4">
              <div className="text-xs text-navy-400">
                <p>Authorized Signature: _______________________</p>
                <p className="mt-1">Meggs Kitchen ERP Automated Procurement</p>
              </div>
              <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print PO Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GRNTab() {
  const { grns, loading, createGRN } = useGoodsReceivedNotes();
  const { purchaseOrders } = usePurchaseOrders();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const { toast } = useToast();

  const [showGRNModal, setShowGRNModal] = useState(false);
  const [poId, setPoId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receivedBy, setReceivedBy] = useState('Warehouse Receiving Staff');
  const [notes, setNotes] = useState('');

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast({ title: 'Select destination warehouse', variant: 'destructive' });
      return;
    }

    try {
      await createGRN({
        grn_number: `GRN-${Date.now().toString().slice(-6)}`,
        po_id: poId || null,
        supplier_id: null,
        warehouse_id: warehouseId,
        received_date: new Date().toISOString(),
        received_by: receivedBy,
        status: 'verified',
        notes: notes || null,
      });

      toast({ title: 'Goods Received Note created & inventory updated' });
      setShowGRNModal(false);
      setPoId('');
      setWarehouseId('');
      setNotes('');
    } catch {
      toast({ title: 'Failed to record GRN', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setShowGRNModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record New Goods Received (GRN)
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading GRN entries...</div>
      ) : grns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">No Goods Received Notes</h3>
          <p className="text-sm text-navy-500 mb-4">Record stock deliveries as they arrive at your warehouse.</p>
          <button onClick={() => setShowGRNModal(true)} className="btn-primary">Record GRN</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold text-navy-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">GRN Number</th>
                <th className="px-6 py-3.5">Received Date</th>
                <th className="px-6 py-3.5">Destination Hub</th>
                <th className="px-6 py-3.5">Received By</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {grns.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-navy-900">{g.grn_number}</td>
                  <td className="px-6 py-4 text-navy-500">{formatDateTime(g.received_date)}</td>
                  <td className="px-6 py-4 text-navy-700">{g.warehouse?.name || 'Main Warehouse'}</td>
                  <td className="px-6 py-4 text-navy-600">{g.received_by}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-bold uppercase">
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showGRNModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowGRNModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-bold text-lg text-navy-900">Record Goods Received Note (GRN)</h2>
              <button onClick={() => setShowGRNModal(false)}><X className="w-5 h-5 text-navy-400" /></button>
            </div>

            <form onSubmit={handleCreateGRN} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Link Purchase Order (Optional)</label>
                <select value={poId} onChange={(e) => setPoId(e.target.value)} className="input text-sm">
                  <option value="">Direct Stock Receipt (No PO)</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>{po.po_number} - {po.supplier?.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Destination Warehouse Hub *</label>
                <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="input text-sm">
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Received By Staff</label>
                <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="input text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Delivery Verification Notes</label>
                <textarea placeholder="Condition on arrival, seal verification, delivery driver details..." value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowGRNModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Confirm Goods Received</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
