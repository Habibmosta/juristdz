import express from 'express';
import { authenticate } from '@/middleware/auth';
import { db } from '@/database/connection';

const router = express.Router();

const TABLE_MAP: Record<string, string> = {
  profiles: 'users',
  subscription: 'subscriptions',
  subscriptions: 'subscriptions',
  cases: 'cases',
  clients: 'clients',
  documents: 'documents',
  invoices: 'invoices',
  calendar_events: 'calendar_events',
  notifications: 'notifications',
  reminders: 'reminders',
  time_entries: 'time_entries',
  legal_deadlines: 'legal_deadlines',
  payment_orders: 'payment_orders',
  case_events: 'case_events',
  case_documents: 'case_documents',
  client_messages: 'client_messages',
  pending_accounts: 'pending_accounts',
  cabinet_settings: 'cabinet_settings',
};

router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users');
    const activeResult = await db.query('SELECT COUNT(*) as active FROM users WHERE is_active = true');
    
    res.json({
      totalUsers: parseInt((usersResult as any).rows[0]?.total || 0),
      activeUsers: parseInt((activeResult as any).rows[0]?.active || 0),
      totalDocuments: 0,
      totalCases: 0,
      recentActivity: []
    });
  } catch (error) {
    res.json({ totalUsers: 0, activeUsers: 0, totalDocuments: 0, totalCases: 0 });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, first_name, last_name, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 50');
    res.json((result as any).rows || []);
  } catch (error) {
    res.json([]);
  }
});

router.post('/:table', authenticate, async (req, res) => {
  const rawTable = req.params.table;
  const table = TABLE_MAP[rawTable] || rawTable;
  const { filters = [], order = null, limit = 20, single = false } = req.body;
  
  try {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    filters.forEach((f: any, i: number) => {
      params.push(f.value);
      if (f.op === 'eq') conditions.push(`${f.column} = $${i + 1}`);
      else if (f.op === 'neq') conditions.push(`${f.column} != $${i + 1}`);
      else if (f.op === 'in') conditions.push(`${f.column} = ANY($${i + 1})`);
      else if (f.op === 'gt') conditions.push(`${f.column} > $${i + 1}`);
      else if (f.op === 'gte') conditions.push(`${f.column} >= $${i + 1}`);
      else if (f.op === 'lt') conditions.push(`${f.column} < $${i + 1}`);
      else if (f.op === 'lte') conditions.push(`${f.column} <= $${i + 1}`);
      else if (f.op === 'like') conditions.push(`${f.column} LIKE $${i + 1}`);
    });
    
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    
    if (order) {
      query += ` ORDER BY ${order.column} ${order.ascending ? 'ASC' : 'DESC'}`;
    }
    
    if (!single) query += ` LIMIT ${limit}`;
    
    const result = await db.query(query, params);
    res.json((result as any).rows || []);
  } catch (error) {
    console.error('Data query error:', error);
    res.json([]);
  }
});

router.post('/:table/insert', authenticate, async (req, res) => {
  const rawTable = req.params.table;
  const table = TABLE_MAP[rawTable] || rawTable;
  const rows = req.body;
  
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Expected array' });
  
  try {
    const columns = Object.keys(rows[0]);
    const values = rows.map(r => columns.map(c => r[c]));
    const placeholders = rows.map((_, i) => columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')).join('), (');
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} RETURNING *`;
    
    const result = await db.query(query, values.flat());
    res.json({ data: (result as any).rows || [] });
  } catch (error) {
    console.error('Insert error:', error);
    res.json({ data: rows, error: null });
  }
});

router.put('/:table/update', authenticate, async (req, res) => {
  const rawTable = req.params.table;
  const table = TABLE_MAP[rawTable] || rawTable;
  const { id, ...updates } = req.body;
  
  console.log('[UPDATE] table:', table, 'id:', id, 'updates:', JSON.stringify(updates));
  
  if (!id) return res.status(400).json({ error: 'ID required' });
  
  try {
    const set = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const query = `UPDATE ${table} SET ${set} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...Object.values(updates)]);
    res.json({ data: (result as any).rows?.[0] || updates });
  } catch (error) {
    console.error('Update error:', error);
    res.json({ data: updates });
  }
});

router.delete('/:table', authenticate, async (req, res) => {
  const rawTable = req.params.table;
  const table = TABLE_MAP[rawTable] || rawTable;
  const { id } = req.body;
  
  if (!id) return res.status(400).json({ error: 'ID required' });
  
  try {
    await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

export default router;
