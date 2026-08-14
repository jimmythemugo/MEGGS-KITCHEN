/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Warehouse,
  WarehouseStock,
  GoodsReceivedNote,
  StockTransfer,
  DamagedStock,
  StockReturn,
  RolePermission,
  PurchaseOrder,
  ERPUserRole,
} from '@/lib/types';

const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-main-01',
    name: 'Meggs Main Central Logistics Hub',
    manager_name: 'David Mwangi',
    location: 'Mombasa Road, Industrial Area, Nairobi',
    storage_sections: ['Aisle A - Kitchen Equipment', 'Aisle B - Heavy Commercial Cookers', 'Aisle C - Refrigeration & Cold Storage', 'Aisle D - Spare Parts & Accessories'],
    shelf_numbers: ['A-01', 'A-02', 'B-01', 'B-02', 'C-01', 'C-02', 'D-01', 'D-02'],
    capacity_units: 50000,
    notes: 'Primary dispatch center for trade orders and wholesale fulfillment.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wh-westlands-02',
    name: 'Westlands Showroom & Transit Warehouse',
    manager_name: 'Grace Wanjiku',
    location: 'Woodvale Grove, Westlands, Nairobi',
    storage_sections: ['Showroom Front Display', 'Backstock Storage', 'Demo Kitchen Unit'],
    shelf_numbers: ['SR-01', 'SR-02', 'BS-01', 'BS-02'],
    capacity_units: 12000,
    notes: 'Retail showroom inventory and express pickup point.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_ROLES: RolePermission[] = [
  {
    id: 'role-01',
    role: 'Administrator',
    description: 'Full system control including system settings, RBAC, financial reports, and data deletion.',
    permissions: ['all.access', 'products.write', 'inventory.adjust', 'po.approve', 'roles.manage', 'reports.view'],
    is_custom: false,
    user_count: 2,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-02',
    role: 'Inventory Manager',
    description: 'Manages master catalog, reorder levels, stock adjustments, GRN receipt verification, and transfers.',
    permissions: ['products.write', 'inventory.adjust', 'po.create', 'po.approve', 'grn.create', 'transfers.execute', 'reports.view'],
    is_custom: false,
    user_count: 4,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-03',
    role: 'Warehouse Staff',
    description: 'Handles goods receiving, shelf placement, order picking, packing, and dispatch execution.',
    permissions: ['inventory.read', 'grn.receive', 'picking.execute', 'packing.execute', 'transfers.request'],
    is_custom: false,
    user_count: 8,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-04',
    role: 'Sales Staff',
    description: 'Can view real-time inventory levels, place orders, generate quotations, and manage customer accounts.',
    permissions: ['inventory.read', 'orders.create', 'quotations.create', 'customers.manage'],
    is_custom: false,
    user_count: 12,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-05',
    role: 'Customer Support',
    description: 'Processes customer inquiries, tracks order fulfillment status, and initiates customer returns.',
    permissions: ['orders.read', 'returns.create', 'customers.manage'],
    is_custom: false,
    user_count: 5,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-06',
    role: 'Accountant',
    description: 'Views purchase order costs, inventory valuation, profit margin analysis, and customer invoices.',
    permissions: ['invoices.manage', 'reports.view', 'valuation.read', 'po.read'],
    is_custom: false,
    user_count: 3,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-07',
    role: 'Owner',
    description: 'Executive dashboard view, high-level audit logs, revenue analytics, and performance ratings.',
    permissions: ['all.access', 'reports.view', 'audit.read'],
    is_custom: false,
    user_count: 1,
    updated_at: new Date().toISOString(),
  },
];

// Helper to store local storage state when Supabase table isn't present
function getLocalItem<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(`meggs_erp_${key}`);
    return item ? JSON.parse(item) : initial;
  } catch {
    return initial;
  }
}

function setLocalItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(`meggs_erp_${key}`, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// 1. WAREHOUSES HOOK
export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() =>
    getLocalItem('warehouses', INITIAL_WAREHOUSES)
  );
  const [loading, setLoading] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (!error && data && data.length > 0) {
        setWarehouses(data);
        setLocalItem('warehouses', data);
      }
    } catch {
      // fallback to local
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const saveWarehouse = async (warehouse: Partial<Warehouse> & { name: string }) => {
    const id = warehouse.id || `wh-${Date.now()}`;
    const newEntry: Warehouse = {
      id,
      name: warehouse.name,
      manager_name: warehouse.manager_name || null,
      location: warehouse.location || null,
      storage_sections: warehouse.storage_sections || ['Section A', 'Section B'],
      shelf_numbers: warehouse.shelf_numbers || ['A-01', 'A-02'],
      capacity_units: warehouse.capacity_units || 10000,
      notes: warehouse.notes || null,
      is_active: warehouse.is_active ?? true,
      created_at: warehouse.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('warehouses').upsert(newEntry);
    } catch {
      // ignore
    }

    setWarehouses((prev) => {
      const exists = prev.some((w) => w.id === id);
      const updated = exists ? prev.map((w) => (w.id === id ? newEntry : w)) : [newEntry, ...prev];
      setLocalItem('warehouses', updated);
      return updated;
    });
  };

  const deleteWarehouse = async (id: string) => {
    try {
      await supabase.from('warehouses').delete().eq('id', id);
    } catch {
      // ignore
    }
    setWarehouses((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      setLocalItem('warehouses', updated);
      return updated;
    });
  };

  return { warehouses, loading, saveWarehouse, deleteWarehouse, refetch: fetchWarehouses };
}

// 2. GOODS RECEIVED NOTES (GRN) HOOK
export function useGoodsReceivedNotes() {
  const [grns, setGrns] = useState<GoodsReceivedNote[]>(() =>
    getLocalItem('grns', [])
  );
  const [loading, setLoading] = useState(false);

  const fetchGRNs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('goods_received_notes').select('*, supplier:suppliers(name), warehouse:warehouses(name)').order('created_at', { ascending: false });
      if (!error && data) {
        setGrns(data);
        setLocalItem('grns', data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGRNs();
  }, [fetchGRNs]);

  const createGRN = async (grn: Omit<GoodsReceivedNote, 'id' | 'created_at'>) => {
    const id = `grn-${Date.now()}`;
    const newGRN: GoodsReceivedNote = {
      ...grn,
      id,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('goods_received_notes').insert(newGRN);
    } catch {
      // ignore
    }

    setGrns((prev) => {
      const updated = [newGRN, ...prev];
      setLocalItem('grns', updated);
      return updated;
    });
    return newGRN;
  };

  return { grns, loading, createGRN, refetch: fetchGRNs };
}

// 3. STOCK TRANSFERS HOOK
export function useStockTransfers() {
  const [transfers, setTransfers] = useState<StockTransfer[]>(() =>
    getLocalItem('stock_transfers', [])
  );
  const [loading, setLoading] = useState(false);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_transfers')
        .select('*, source_warehouse:warehouses!source_warehouse_id(name), target_warehouse:warehouses!target_warehouse_id(name), product:products(name, sku)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setTransfers(data);
        setLocalItem('stock_transfers', data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const createTransfer = async (transfer: Omit<StockTransfer, 'id' | 'created_at'>) => {
    const id = `trf-${Date.now()}`;
    const newTransfer: StockTransfer = {
      ...transfer,
      id,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('stock_transfers').insert(newTransfer);
    } catch {
      // ignore
    }

    setTransfers((prev) => {
      const updated = [newTransfer, ...prev];
      setLocalItem('stock_transfers', updated);
      return updated;
    });
    return newTransfer;
  };

  return { transfers, loading, createTransfer, refetch: fetchTransfers };
}

// 4. DAMAGED STOCK & RETURNS HOOK
export function useDamagedStockAndReturns() {
  const [damagedStock, setDamagedStock] = useState<DamagedStock[]>(() =>
    getLocalItem('damaged_stock', [])
  );
  const [returns, setReturns] = useState<StockReturn[]>(() =>
    getLocalItem('stock_returns', [])
  );
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dmgRes, retRes] = await Promise.all([
        supabase.from('damaged_stock').select('*, product:products(name, sku)').order('created_at', { ascending: false }),
        supabase.from('stock_returns').select('*, product:products(name, sku)').order('created_at', { ascending: false }),
      ]);
      if (dmgRes.data) {
        setDamagedStock(dmgRes.data);
        setLocalItem('damaged_stock', dmgRes.data);
      }
      if (retRes.data) {
        setReturns(retRes.data);
        setLocalItem('stock_returns', retRes.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reportDamagedStock = async (dmg: Omit<DamagedStock, 'id' | 'created_at'>) => {
    const id = `dmg-${Date.now()}`;
    const newEntry: DamagedStock = { ...dmg, id, created_at: new Date().toISOString() };
    try {
      await supabase.from('damaged_stock').insert(newEntry);
    } catch {
      // ignore
    }
    setDamagedStock((prev) => {
      const updated = [newEntry, ...prev];
      setLocalItem('damaged_stock', updated);
      return updated;
    });
  };

  const processReturn = async (ret: Omit<StockReturn, 'id' | 'created_at'>) => {
    const id = `ret-${Date.now()}`;
    const newEntry: StockReturn = { ...ret, id, created_at: new Date().toISOString() };
    try {
      await supabase.from('stock_returns').insert(newEntry);
    } catch {
      // ignore
    }
    setReturns((prev) => {
      const updated = [newEntry, ...prev];
      setLocalItem('stock_returns', updated);
      return updated;
    });
  };

  return { damagedStock, returns, loading, reportDamagedStock, processReturn, refetch: fetchData };
}

// 5. ROLE PERMISSIONS HOOK
export function useRolePermissions() {
  const [roles, setRoles] = useState<RolePermission[]>(() =>
    getLocalItem('roles', INITIAL_ROLES)
  );

  const saveRole = (role: RolePermission) => {
    setRoles((prev) => {
      const exists = prev.some((r) => r.id === role.id);
      const updated = exists ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role];
      setLocalItem('roles', updated);
      return updated;
    });
  };

  return { roles, saveRole };
}
