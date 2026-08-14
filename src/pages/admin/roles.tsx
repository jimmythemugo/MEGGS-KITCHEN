import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Users, Check, Lock, Info, KeyRound } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useRolePermissions } from '@/hooks/use-erp';
import { useToast } from '@/hooks/use-toast';
import type { RolePermission } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/auth';

const PERMISSION_MODULES = [
  { key: 'products', name: 'Product Master Catalog', perm: ['read', 'write', 'delete'] },
  { key: 'inventory', name: 'Inventory & Stock Adjustments', perm: ['read', 'adjust', 'audit'] },
  { key: 'warehouses', name: 'Warehouse & Storage Hubs', perm: ['read', 'manage', 'transfers'] },
  { key: 'po', name: 'Purchase Orders & Suppliers', perm: ['read', 'create', 'approve'] },
  { key: 'grn', name: 'Goods Received Notes (GRN)', perm: ['receive', 'verify'] },
  { key: 'reports', name: 'ERP Valuation & Financial Analytics', perm: ['view', 'export'] },
  { key: 'roles', name: 'Role & User Access Settings', perm: ['manage'] },
];

export default function AdminRoles() {
  const { roles, saveRole } = useRolePermissions();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RolePermission>(roles[0]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setProfiles(data);
      }
    } catch (err) {
      console.warn('[AdminRoles] Failed to load profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const togglePermission = (permCode: string) => {
    const hasPerm = selectedRole.permissions.includes(permCode) || selectedRole.permissions.includes('all.access');
    if (selectedRole.permissions.includes('all.access')) return; // Superadmin has all

    let updatedPerms: string[] = [];
    if (hasPerm) {
      updatedPerms = selectedRole.permissions.filter((p) => p !== permCode);
    } else {
      updatedPerms = [...selectedRole.permissions, permCode];
    }

    const updatedRole = { ...selectedRole, permissions: updatedPerms, updated_at: new Date().toISOString() };
    setSelectedRole(updatedRole);
    saveRole(updatedRole);
    toast({ title: `Permissions updated for ${selectedRole.role}` });
  };

  return (
    <AdminLayout title="Users">
      <div className="space-y-8">
        {/* User Accounts Overview Panel */}
        <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Supabase Auth & RBAC
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Profiles Table Active
                </span>
              </div>
              <h2 className="font-display font-bold text-xl text-navy-950">
                System Users & Role Allocation
              </h2>
              <p className="text-xs text-navy-500 mt-1">
                Authoritative user profiles linked to Supabase Auth and governed by PostgreSQL Row-Level Security.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 max-w-md">
              <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-0.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                Role Hierarchy
              </p>
              <p className="text-[11px] text-amber-800">
                <strong>Owner</strong>: full system access. <strong>Staff</strong>: operations, products, inventory & orders. <strong>Customer</strong>: storefront browsing, ordering & profile management.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {loadingProfiles ? (
              <div className="col-span-3 text-center py-8">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-navy-500">Loading user profiles...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="col-span-3 text-center py-6 text-navy-500 text-xs">
                No profiles found. Profiles will sync automatically upon Supabase user creation.
              </div>
            ) : (
              profiles.map((p) => {
                const roleLower = p.role?.toLowerCase() || 'customer';
                const isOwner = roleLower === 'owner' || roleLower === 'admin';
                const isStaff = roleLower === 'staff';

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-5 border shadow-sm relative overflow-hidden ${
                      isOwner
                        ? 'bg-navy-900 text-white border-navy-950'
                        : isStaff
                        ? 'bg-white text-navy-950 border-blue-200'
                        : 'bg-white text-navy-950 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isOwner
                            ? 'bg-amber-400 text-navy-950'
                            : isStaff
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        Role: {p.role?.toUpperCase()}
                      </span>
                      {isOwner ? (
                        <KeyRound className="w-4 h-4 text-amber-400" />
                      ) : isStaff ? (
                        <Users className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <h3 className={`font-bold text-base ${isOwner ? 'text-white' : 'text-navy-950'}`}>
                      {p.full_name || 'System User'}
                    </h3>
                    <p className={`text-xs font-mono mt-1 ${isOwner ? 'text-navy-300' : 'text-navy-500'}`}>
                      {p.email}
                    </p>
                    {p.company_name && (
                      <p className={`text-xs mt-0.5 ${isOwner ? 'text-amber-300' : 'text-navy-600'}`}>
                        {p.company_name}
                      </p>
                    )}

                    <div className={`mt-4 pt-3 border-t space-y-1.5 text-xs ${isOwner ? 'border-navy-800 text-navy-200' : 'border-gray-100 text-navy-700'}`}>
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <span className={`font-bold ${p.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Phone:</span>
                        <span className="font-mono">{p.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Access Level:</span>
                        <span className="font-bold">
                          {isOwner ? 'Full Enterprise Access' : isStaff ? 'Store Operations & ERP' : 'Storefront Customer'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Roles & Permissions Matrix */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
            <h3 className="font-bold text-navy-900 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Configured ERP User Roles
            </h3>

            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedRole.id === r.id
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-navy-900 text-sm">{r.role}</span>
                  <span className="text-[10px] bg-navy-100 text-navy-700 px-2 py-0.5 rounded font-bold">
                    {r.user_count} Users
                  </span>
                </div>
                <p className="text-xs text-navy-500 line-clamp-2">{r.description}</p>
              </button>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
              <div>
                <h2 className="font-black text-xl text-navy-900">{selectedRole.role} Permissions Matrix</h2>
                <p className="text-xs text-navy-500">{selectedRole.description}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full uppercase">
                Active Role
              </span>
            </div>

            <div className="space-y-6">
              {PERMISSION_MODULES.map((mod) => (
                <div key={mod.key} className="border-b pb-4 last:border-0">
                  <h4 className="font-bold text-sm text-navy-900 mb-2">{mod.name}</h4>
                  <div className="flex flex-wrap gap-3">
                    {mod.perm.map((p) => {
                      const permCode = `${mod.key}.${p}`;
                      const isGranted =
                        selectedRole.permissions.includes('all.access') ||
                        selectedRole.permissions.includes(permCode) ||
                        selectedRole.permissions.includes(`${mod.key}.write`);

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePermission(permCode)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isGranted
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-gray-50 text-navy-500 border-gray-200 hover:border-navy-300'
                          }`}
                        >
                          {isGranted ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span className="capitalize">{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
