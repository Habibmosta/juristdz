import { API_URL } from '../config/apiConfig';
(window as any).__SHIM_VER__ = 'v7';
console.log('[SHIM] supabase.ts LOADED version v7 AT', new Date().toISOString());

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('juristdz_access_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return response;
}

export const supabase = {
  auth: {
    signInWithPassword: async (credentials) => {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('juristdz_access_token', data.tokens.accessToken);
      localStorage.setItem('juristdz_refresh_token', data.tokens.refreshToken);
      
      return { data: { user: data.user, session: data.tokens }, error: null };
    },
    signUp: async (credentials) => {
      const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Registration failed');
      return { data: { user: {} }, error: null };
    },
    signOut: async () => {
      await apiCall('/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('juristdz_access_token');
      localStorage.removeItem('juristdz_refresh_token');
    },
    getUser: async () => {
      const res = await apiCall('/auth/me');
      const data = await res.json();
      return res.ok && data.success
        ? { data: { id: data.user?.id, email: data.user?.email }, error: null }
        : { data: null, error: null };
    },
    getSession: async () => {
      const accessToken = localStorage.getItem('juristdz_access_token');
      if (!accessToken) {
        return { data: { session: null }, error: null };
      }
      const refreshToken = localStorage.getItem('juristdz_refresh_token');
      return {
        data: {
          session: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        },
        error: null
      };
    },
    get user() { return null; },
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    resetPasswordForEmail: async (email: string) => {
      const res = await apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data.success
        ? { data: { message: 'Email sent' }, error: null }
        : { data: null, error: data.error || 'reset_failed' };
    },
    updateUser: async (attributes) => {
      console.log('[SHIM] auth.updateUser called with:', attributes);
      const res = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(attributes),
      });
      const data = await res.json();
      console.log('[SHIM] auth.updateUser response:', data);
      return res.ok ? { data: { user: attributes }, error: null } : { data: null, error: null };
    },
    mfa: {
      enroll: async () => { return { data: null, error: null }; },
      challenge: async () => { return { data: null, error: null }; },
      verify: async () => { return { data: null, error: null }; },
      listFactors: async () => { return { data: { factors: [] }, error: null }; },
      unenroll: async () => { return { data: null, error: null }; },
    }
  },
  from: (table) => {
    let queryFilters: any[] = [];
    let queryOrder: any = null;
    let queryLimit = 50;
    let querySingle = false;

    const chainObj = {
      select: () => chainObj,
      eq: (col: string, val: any) => { queryFilters.push({ column: col, op: 'eq', value: val }); return chainObj; },
      neq: (col: string, val: any) => { queryFilters.push({ column: col, op: 'neq', value: val }); return chainObj; },
      in: (col: string, vals: any[]) => { queryFilters.push({ column: col, op: 'in', value: vals }); return chainObj; },
      gte: (col: string, val: any) => { queryFilters.push({ column: col, op: 'gte', value: val }); return chainObj; },
      lte: (col: string, val: any) => { queryFilters.push({ column: col, op: 'lte', value: val }); return chainObj; },
      gt: (col: string, val: any) => { queryFilters.push({ column: col, op: 'gt', value: val }); return chainObj; },
      lt: (col: string, val: any) => { queryFilters.push({ column: col, op: 'lt', value: val }); return chainObj; },
      like: (col: string, val: any) => { queryFilters.push({ column: col, op: 'like', value: val }); return chainObj; },
      ilike: (col: string, val: any) => { queryFilters.push({ column: col, op: 'ilike', value: val }); return chainObj; },
      or: (expr: string) => { queryFilters.push({ column: '_or', op: 'or', value: expr }); return chainObj; },
      order: (col: string, opts: any = {}) => { queryOrder = { column: col, ascending: opts.ascending !== false }; return chainObj; },
      limit: (n: number) => { queryLimit = n; return chainObj; },
      range: (from: number, to: number) => { queryLimit = to - from + 1; return chainObj; },
      single: () => { querySingle = true; return chainObj; },
      then: async (resolve: (val: any) => void) => {
        try {
          const body = { filters: queryFilters, order: queryOrder, limit: queryLimit, single: querySingle };
          const res = await apiCall(`/data/${table}`, { method: 'POST', body: JSON.stringify(body) });
          const data = await res.json();
          resolve({ data: Array.isArray(data) ? data : [], error: null });
        } catch (e) { resolve({ data: [], error: null }); }
      },
      update: (updates: any) => {
        return {
          eq: async (col: string, val: any) => {
            try {
              const body = { id: val, ...updates };
              const res = await apiCall(`/data/${table}/update`, { method: 'PUT', body: JSON.stringify(body) });
              const data = await res.json();
              return { data: data.data || updates, error: null };
            } catch (e) { return { data: null, error: null }; }
          },
        };
      },
      delete: () => {
        return {
          eq: async (col: string, val: any) => {
            try {
              const res = await apiCall(`/data/${table}`, { method: 'DELETE', body: JSON.stringify({ id: val }) });
              return { data: null, error: null };
            } catch (e) { return { data: null, error: null }; }
          },
        };
      },
      insert: async (rows: any) => {
        try {
          const data = Array.isArray(rows) ? rows : [rows];
          const res = await apiCall(`/data/${table}/insert`, { method: 'POST', body: JSON.stringify(data) });
          const result = await res.json();
          return { data: result.data || data, error: null };
        } catch (e) { return { data: rows, error: null }; }
      },
      upsert: async (rows: any) => {
        try {
          const data = Array.isArray(rows) ? rows : [rows];
          const res = await apiCall(`/data/${table}/insert`, { method: 'POST', body: JSON.stringify(data) });
          const result = await res.json();
          return { data: result.data || data, error: null };
        } catch (e) { return { data: rows, error: null }; }
      },
    };
    return chainObj;
  },
  storage: {
    from: (bucket) => ({
      upload: async (path: string, file: File) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const token = localStorage.getItem('juristdz_access_token');
          const res = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
          });
          const data = await res.json();
          return { data: { path: data.path || path }, error: null };
        } catch (e) { return { data: { path }, error: null }; }
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `${API_URL}/files/${path}` } }),
      download: async (path: string) => {
        try {
          const res = await apiCall(`/files/${path}`);
          return { data: await res.blob(), error: null };
        } catch (e) { return { data: null, error: { message: 'Download failed' } }; }
      },
      remove: async (paths: string[]) => {
        try {
          await apiCall('/files/delete', { method: 'DELETE', body: JSON.stringify({ paths }) });
          return { data: null, error: null };
        } catch (e) { return { data: null, error: null }; }
      },
    })
  },
  functions: {
    invoke: async (name: string, options?: { body?: any }) => {
      try {
        const res = await apiCall(`/functions/${name}`, {
          method: 'POST',
          body: JSON.stringify(options?.body || {}),
        });
        const data = await res.json();
        return { data, error: null };
      } catch (e) { return { data: null, error: { message: `Function ${name} failed` } }; }
    }
  },
  rpc: (fn: string, params?: any) => {
    // Mapping des fonctions RPC vers les endpoints backend
    const rpcRoutes: Record<string, { endpoint: string; method: string }> = {
      'generate_case_number': { endpoint: '/cases/generate-number', method: 'POST' },
      'get_next_exploit_number': { endpoint: '/cases/generate-number', method: 'POST' },
      'get_next_act_number': { endpoint: '/cases/generate-number', method: 'POST' },
      'get_next_version_number': { endpoint: '/documents/versions/next', method: 'POST' },
      'search_case_documents': { endpoint: '/documents/search', method: 'POST' },
      'get_case_document_stats': { endpoint: '/documents/stats', method: 'POST' },
      'check_schedule_conflict': { endpoint: '/calendar/check-conflict', method: 'POST' },
      'get_account_usage': { endpoint: '/users/usage', method: 'POST' },
      'deduct_credits': { endpoint: '/users/deduct-credits', method: 'POST' },
      'increment_usage': { endpoint: '/users/increment-usage', method: 'POST' },
      'convert_trial_to_paid': { endpoint: '/billing/convert-trial', method: 'POST' },
      'downgrade_to_free': { endpoint: '/billing/downgrade', method: 'POST' },
      'activate_account': { endpoint: '/admin/activate-account', method: 'POST' },
      'block_account': { endpoint: '/admin/block-account', method: 'POST' },
      'admin_activate_user_email': { endpoint: '/admin/activate-user', method: 'POST' },
      'admin_deactivate_user': { endpoint: '/admin/deactivate-user', method: 'POST' },
      'admin_reactivate_user': { endpoint: '/admin/reactivate-user', method: 'POST' },
    };

    const route = rpcRoutes[fn] || { endpoint: `/rpc/${fn}`, method: 'POST' };

    const chain = {
      then: async (resolve: (val: any) => void) => {
        try {
          const res = await apiCall(route.endpoint, {
            method: route.method,
            body: JSON.stringify(params || {}),
          });
          const data = await res.json();
          resolve({ data: data.data ?? data, error: null });
        } catch (e) {
          console.warn(`RPC ${fn} failed:`, e);
          resolve({ data: null, error: { message: `RPC ${fn} failed` } });
        }
      },
      single: async () => {
        try {
          const res = await apiCall(route.endpoint, {
            method: route.method,
            body: JSON.stringify(params || {}),
          });
          const data = await res.json();
          return { data: data.data ?? data, error: null };
        } catch (e) {
          console.warn(`RPC ${fn} failed:`, e);
          return { data: null, error: { message: `RPC ${fn} failed` } };
        }
      }
    };
    return chain;
  }
};

const chain = {
  eq: () => chain, neq: () => chain, in: () => chain, gte: () => chain,
  lte: () => chain, like: () => chain, ilike: () => chain, or: () => chain,
  order: () => chain, limit: () => chain, range: () => chain,
  single: async () => { return { data: null, error: null }; },
  then: (resolve) => resolve({ data: [], error: null }),
};

export default supabase;