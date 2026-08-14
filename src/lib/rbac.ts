export type AdminRole =
  | 'Owner'
  | 'Administrator'
  | 'Inventory Manager'
  | 'Warehouse Staff'
  | 'Sales'
  | 'Customer Support'
  | 'Accountant'
  | 'Marketing'
  | 'Viewer';

export type Permission =
  | 'dashboard:view'
  | 'financials:view'
  | 'products:view'
  | 'products:write'
  | 'inventory:view'
  | 'inventory:write'
  | 'orders:view'
  | 'orders:write'
  | 'customers:view'
  | 'customers:write'
  | 'leads:view'
  | 'leads:write'
  | 'quotations:view'
  | 'quotations:write'
  | 'invoices:view'
  | 'invoices:write'
  | 'suppliers:view'
  | 'suppliers:write'
  | 'promotions:view'
  | 'promotions:write'
  | 'marketing:view'
  | 'marketing:write'
  | 'settings:view'
  | 'settings:write'
  | 'audit:view';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  Owner: [
    'dashboard:view',
    'financials:view',
    'products:view',
    'products:write',
    'inventory:view',
    'inventory:write',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
    'leads:view',
    'leads:write',
    'quotations:view',
    'quotations:write',
    'invoices:view',
    'invoices:write',
    'suppliers:view',
    'suppliers:write',
    'promotions:view',
    'promotions:write',
    'marketing:view',
    'marketing:write',
    'settings:view',
    'settings:write',
    'audit:view',
  ],
  Administrator: [
    'dashboard:view',
    'financials:view',
    'products:view',
    'products:write',
    'inventory:view',
    'inventory:write',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
    'leads:view',
    'leads:write',
    'quotations:view',
    'quotations:write',
    'invoices:view',
    'invoices:write',
    'suppliers:view',
    'suppliers:write',
    'promotions:view',
    'promotions:write',
    'marketing:view',
    'marketing:write',
    'settings:view',
    'settings:write',
    'audit:view',
  ],
  'Inventory Manager': [
    'dashboard:view',
    'products:view',
    'products:write',
    'inventory:view',
    'inventory:write',
    'suppliers:view',
    'suppliers:write',
  ],
  'Warehouse Staff': [
    'dashboard:view',
    'products:view',
    'inventory:view',
    'inventory:write',
    'orders:view',
    'suppliers:view',
  ],
  Sales: [
    'dashboard:view',
    'products:view',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
    'leads:view',
    'leads:write',
    'quotations:view',
    'quotations:write',
  ],
  'Customer Support': [
    'dashboard:view',
    'products:view',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
  ],
  Accountant: [
    'dashboard:view',
    'financials:view',
    'orders:view',
    'invoices:view',
    'invoices:write',
    'suppliers:view',
  ],
  Marketing: [
    'dashboard:view',
    'products:view',
    'customers:view',
    'promotions:view',
    'promotions:write',
    'marketing:view',
    'marketing:write',
  ],
  Viewer: [
    'dashboard:view',
    'products:view',
    'inventory:view',
    'orders:view',
    'customers:view',
  ],
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
