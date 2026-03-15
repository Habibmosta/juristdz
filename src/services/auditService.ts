/**
 * Audit trail service — logs user actions to Supabase `audit_logs` table.
 * Falls back silently if the table doesn't exist yet.
 */

export type AuditAction =
  | 'case.create' | 'case.update' | 'case.delete' | 'case.status_change'
  | 'client.create' | 'client.update' | 'client.delete'
  | 'invoice.create' | 'invoice.update' | 'invoice.delete' | 'invoice.paid'
  | 'document.create' | 'document.export' | 'document.delete'
  | 'profile.update' | 'auth.login' | 'auth.logout' | 'auth.2fa_enable' | 'auth.2fa_disable';

export interface AuditEntry {
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
}

class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('audit_logs').insert([{
        ...entry,
        created_at: new Date().toISOString(),
        ip_address: null, // browser can't get real IP
        user_agent: navigator.userAgent.slice(0, 200),
      }]);
    } catch {
      // Silent fail — audit logging should never break the app
    }
  }

  async getLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data ?? [];
    } catch {
      return [];
    }
  }
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  created_at: string;
  user_agent?: string;
}

export const auditService = new AuditService();
