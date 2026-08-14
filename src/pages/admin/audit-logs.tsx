import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, UserCheck, Clock, FileText, Activity } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';

interface ActivityLogRow {
  id: string;
  user_email: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (entityFilter !== 'all') {
          query = query.ilike('action', `%[${entityFilter.toUpperCase()}]%`);
        }
        const { data } = await query;
        setLogs(data || []);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [entityFilter]);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      (log.user_email || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entity_type || '').toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const headers = 'ID,User Email,Action,Entity Type,Entity ID,Timestamp\n';
    const rows = filteredLogs.map(l => `"${l.id}","${l.user_email || ''}","${(l.action || '').replace(/"/g, '""')}","${l.entity_type || ''}","${l.entity_id || ''}","${l.created_at}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="Activity Log">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-600" />
              Enterprise Audit Logging & Compliance Trail
            </h1>
            <p className="text-xs text-navy-500 mt-1">
              Immutable record of system mutations, role changes, price updates, inventory adjustments, and administrative access.
            </p>
          </div>

          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export Security Logs (CSV)
          </button>
        </div>

        {/* Filters */}
        <div className="grid sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by admin email, action, entity..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy-500" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Entity Categories</option>
              <option value="product">Product & Catalog Changes</option>
              <option value="inventory">Inventory & Stock Adjustments</option>
              <option value="price">Price & Margin Updates</option>
              <option value="supplier">Supplier & PO Actions</option>
              <option value="order">Order & Quotation Mutations</option>
              <option value="role">RBAC Role Assignments</option>
              <option value="auth">Authentication & Sessions</option>
              <option value="settings">System & Site Settings</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading audit trail records...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-medium text-navy-800">No audit logs match criteria</p>
              <p className="text-xs text-navy-500 mt-1">System actions and admin mutations will be recorded here automatically.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-navy-700">Timestamp</th>
                  <th className="text-left px-6 py-3 font-semibold text-navy-700">User / Actor</th>
                  <th className="text-left px-6 py-3 font-semibold text-navy-700">Action Performed</th>
                  <th className="text-left px-6 py-3 font-semibold text-navy-700">Entity Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-3 text-navy-500 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDateTime(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium text-navy-900 text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                        {log.user_email || 'System Exec'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-navy-800 text-xs font-mono">
                      {log.action}
                    </td>
                    <td className="px-6 py-3 text-navy-500 text-xs">
                      {log.entity_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 font-mono text-[10px]">
                          <FileText className="w-3 h-3 text-gray-500" />
                          {log.entity_id.slice(0, 10)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
