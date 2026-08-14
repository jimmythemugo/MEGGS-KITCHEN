import { useState } from 'react';
import { Plus, Building2, MapPin, User, Package, Layers, Pencil, Trash2, X, Search } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useWarehouses } from '@/hooks/use-erp';
import { useProducts } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import type { Warehouse } from '@/lib/types';

export default function AdminWarehouses() {
  const { warehouses, loading, saveWarehouse, deleteWarehouse } = useWarehouses();
  const { products } = useProducts();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    manager_name: '',
    location: '',
    storage_sections: '',
    shelf_numbers: '',
    capacity_units: '10000',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      manager_name: '',
      location: '',
      storage_sections: '',
      shelf_numbers: '',
      capacity_units: '10000',
      notes: '',
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (wh: Warehouse) => {
    setEditing(wh);
    setForm({
      name: wh.name,
      manager_name: wh.manager_name || '',
      location: wh.location || '',
      storage_sections: (wh.storage_sections || []).join(', '),
      shelf_numbers: (wh.shelf_numbers || []).join(', '),
      capacity_units: wh.capacity_units?.toString() || '10000',
      notes: wh.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Warehouse name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const sections = form.storage_sections
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const shelves = form.shelf_numbers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await saveWarehouse({
        id: editing?.id,
        name: form.name.trim(),
        manager_name: form.manager_name.trim() || null,
        location: form.location.trim() || null,
        storage_sections: sections.length > 0 ? sections : ['Section A', 'Section B'],
        shelf_numbers: shelves.length > 0 ? shelves : ['A-01', 'A-02'],
        capacity_units: parseInt(form.capacity_units) || 10000,
        notes: form.notes.trim() || null,
      });

      toast({ title: editing ? 'Warehouse updated' : 'Warehouse created' });
      resetForm();
    } catch {
      toast({ title: 'Failed to save warehouse', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await deleteWarehouse(id);
      toast({ title: 'Warehouse deleted' });
    } catch {
      toast({ title: 'Failed to delete warehouse', variant: 'destructive' });
    }
  };

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.location && w.location.toLowerCase().includes(search.toLowerCase())) ||
      (w.manager_name && w.manager_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Stores & Warehouses">
      {/* Metrics Header */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-sm font-medium">Total Warehouses</span>
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900">{warehouses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-sm font-medium">Total Storage Sections</span>
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900">
            {warehouses.reduce((acc, w) => acc + (w.storage_sections?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-sm font-medium">Total Capacity (Units)</span>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900">
            {warehouses.reduce((acc, w) => acc + (w.capacity_units || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-sm font-medium">Products Assigned</span>
            <Package className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900">{products.length}</p>
        </div>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Warehouse
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouse or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Warehouses Grid */}
      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading warehouses...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">No Warehouses Found</h3>
          <p className="text-sm text-navy-500 mb-4">Add your primary storage hub or branch location.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add Warehouse</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((wh) => (
            <div key={wh.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-navy-900">{wh.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${wh.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {wh.is_active ? 'Active Hub' : 'Inactive'}
                    </span>
                  </div>
                  {wh.location && (
                    <p className="text-sm text-navy-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" /> {wh.location}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(wh)} className="p-1.5 text-navy-500 hover:text-primary-600 rounded" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="p-1.5 text-navy-500 hover:text-red-600 rounded" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-gray-50 rounded-lg text-xs mb-4">
                <div>
                  <span className="text-navy-400 block mb-0.5">Manager</span>
                  <span className="font-semibold text-navy-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-navy-400" /> {wh.manager_name || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-navy-400 block mb-0.5">Capacity Units</span>
                  <span className="font-semibold text-navy-800">{wh.capacity_units?.toLocaleString()} items</span>
                </div>
              </div>

              {/* Sections & Shelves */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-navy-400 tracking-wider">Storage Sections & Shelves</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(wh.storage_sections || []).map((sec, i) => (
                    <span key={i} className="text-xs bg-navy-50 text-navy-700 border border-navy-100 px-2.5 py-1 rounded-md font-medium">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {wh.notes && (
                <p className="text-xs text-navy-400 italic mt-4 pt-3 border-t border-gray-100">
                  "{wh.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-bold text-lg text-navy-900">{editing ? 'Edit Warehouse' : 'Create Warehouse Hub'}</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-navy-400 hover:text-navy-700" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Warehouse Name *</label>
                <input required placeholder="e.g. Meggs Central Logistics Hub" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Manager Name</label>
                  <input placeholder="e.g. David Mwangi" value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} className="input text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-navy-700 mb-1 block">Total Capacity Units</label>
                  <input type="number" min="1" value={form.capacity_units} onChange={(e) => setForm({ ...form, capacity_units: e.target.value })} className="input text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Location / Physical Address</label>
                <input placeholder="e.g. Mombasa Road, Industrial Area, Nairobi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Storage Sections (Comma Separated)</label>
                <input placeholder="Aisle A - Cookers, Aisle B - Refrigeration, Cold Storage" value={form.storage_sections} onChange={(e) => setForm({ ...form, storage_sections: e.target.value })} className="input text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Shelf / Bin Identifiers (Comma Separated)</label>
                <input placeholder="A-01, A-02, B-01, B-02, C-01" value={form.shelf_numbers} onChange={(e) => setForm({ ...form, shelf_numbers: e.target.value })} className="input text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 mb-1 block">Notes / Operational Instructions</label>
                <textarea placeholder="Special instructions for loading docks, forklift access..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update Warehouse' : 'Create Warehouse'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
