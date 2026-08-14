import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: 'product' | 'inventory' | 'price' | 'supplier' | 'order' | 'role' | 'settings' | 'auth' | 'system';
  entity_id?: string;
  old_value?: Record<string, any> | string | null;
  new_value?: Record<string, any> | string | null;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export async function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>) {
  try {
    const timestamp = new Date().toISOString();
    const payload = {
      user_email: entry.user_email || 'admin@meggskitchen.co.ke',
      user_role: entry.user_role || 'Owner',
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      old_value: typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : entry.old_value,
      new_value: typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : entry.new_value,
      ip_address: entry.ip_address || '127.0.0.1',
      user_agent: entry.user_agent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'),
      created_at: timestamp,
    };

    // Store in audit_logs table or activity_logs table
    await supabase.from('activity_logs').insert({
      user_email: payload.user_email,
      action: `[${payload.entity_type.toUpperCase()}] ${payload.action}`,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      created_at: payload.created_at,
    });
  } catch (err) {
    console.error('Audit log recording failed silently:', err);
  }
}
