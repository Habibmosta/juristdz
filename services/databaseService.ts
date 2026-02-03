
import { supabase } from './supabaseClient';
import { UserStats, Transaction, LicenseKey, Message, UserFeedback } from '../types';

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val)),
};

export const databaseService = {
  // --- FEEDBACK (UAT) ---
  async saveFeedback(feedback: UserFeedback) {
    if (!supabase) {
      const allFeedback = storage.get('user_feedback') || [];
      allFeedback.push(feedback);
      storage.set('user_feedback', allFeedback);
      return { error: null };
    }
    const { error } = await supabase.from('user_feedback').insert({
      id: feedback.id,
      user_id: feedback.userId,
      message_id: feedback.messageId,
      is_positive: feedback.isPositive,
      comment: feedback.comment,
      mode: feedback.mode,
      created_at: feedback.timestamp.toISOString()
    });
    return { error };
  },

  async getAllFeedback(): Promise<UserFeedback[]> {
    if (!supabase) {
      return (storage.get('user_feedback') || []).map((f: any) => ({ ...f, timestamp: new Date(f.timestamp) }));
    }
    const { data, error } = await supabase.from('user_feedback').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Supabase error feedback:", error);
      return [];
    }
    return data.map(f => ({ 
      ...f, 
      userId: f.user_id, 
      messageId: f.message_id, 
      isPositive: f.is_positive, 
      timestamp: new Date(f.created_at) 
    }));
  },

  // --- PROFILES ---
  async getProfile(userId: string): Promise<UserStats | null> {
    if (!supabase) {
      const local = storage.get(`profile_${userId}`);
      if (local) return { ...local, joinedAt: new Date(local.joinedAt) };
      return null;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return { 
      ...data, 
      joinedAt: new Date(data.joined_at), 
      isPro: data.is_pro 
    };
  },

  async upsertProfile(profile: UserStats) {
    if (!supabase) {
      storage.set(`profile_${profile.id}`, profile);
      const users = storage.get('all_users') || [];
      const idx = users.findIndex((u: any) => u.id === profile.id);
      if (idx > -1) users[idx] = profile; else users.push(profile);
      storage.set('all_users', users);
      return { error: null };
    }
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      credits: profile.credits,
      plan: profile.plan,
      is_pro: profile.isPro,
      role: profile.role,
      joined_at: profile.joinedAt.toISOString()
    });
    return { error };
  },

  async getAllUsers(): Promise<UserStats[]> {
    if (!supabase) {
      const users = storage.get('all_users') || [];
      return users.map((u: any) => ({ ...u, joinedAt: new Date(u.joinedAt) }));
    }
    const { data, error } = await supabase.from('profiles').select('*').order('joined_at', { ascending: false });
    if (error) return [];
    return data.map(u => ({ ...u, isPro: u.is_pro, joinedAt: new Date(u.joined_at) }));
  },

  // --- MESSAGES ---
  async saveMessage(userId: string, message: Message) {
    if (!supabase) {
      const msgs = storage.get(`msgs_${userId}`) || [];
      msgs.push(message);
      storage.set(`msgs_${userId}`, msgs);
      return { error: null };
    }
    const { error } = await supabase.from('messages').insert({
      id: message.id,
      user_id: userId,
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp.toISOString(),
      citations: message.citations ? JSON.stringify(message.citations) : null
    });
    return { error };
  },

  async getMessages(userId: string): Promise<Message[]> {
    if (!supabase) {
      const msgs = storage.get(`msgs_${userId}`) || [];
      return msgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    const { data, error } = await supabase.from('messages').select('*').eq('user_id', userId).order('timestamp', { ascending: true });
    if (error) return [];
    return data.map(m => ({ 
      ...m, 
      timestamp: new Date(m.timestamp), 
      citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : undefined 
    }));
  },

  async clearMessages(userId: string): Promise<{ error: any }> {
    console.log(`🔄 Clearing all messages for user: ${userId}`);
    
    if (!supabase) {
      // Clear from localStorage
      storage.set(`msgs_${userId}`, []);
      console.log(`🔄 Messages cleared from localStorage`);
      return { error: null };
    }
    
    // Clear from Supabase
    const { error } = await supabase.from('messages').delete().eq('user_id', userId);
    if (error) {
      console.error(`🔄 Error clearing messages from Supabase:`, error);
    } else {
      console.log(`🔄 Messages cleared from Supabase`);
    }
    
    return { error };
  },

  // --- TRANSACTIONS ---
  async addTransaction(transaction: Transaction) {
    if (!supabase) {
      const trs = storage.get('transactions') || [];
      trs.push(transaction);
      storage.set('transactions', trs);
      return { error: null };
    }
    const { error } = await supabase.from('transactions').insert({
      id: transaction.id,
      user_id: transaction.userId,
      user_email: transaction.userEmail,
      amount: transaction.amount,
      status: transaction.status,
      method: transaction.method,
      created_at: transaction.date.toISOString()
    });
    return { error };
  },

  async getAllTransactions(): Promise<Transaction[]> {
    if (!supabase) {
      const trs = storage.get('transactions') || [];
      return trs.map((t: any) => ({ ...t, date: new Date(t.date) }));
    }
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map(t => ({ 
      ...t, 
      userId: t.user_id, 
      userEmail: t.user_email, 
      date: new Date(t.created_at) 
    }));
  },

  // --- LICENSES ---
  async generateLicenseKey(key: LicenseKey) {
    if (!supabase) {
      const keys = storage.get('license_keys') || [];
      keys.push(key);
      storage.set('license_keys', keys);
      return { error: null };
    }
    const { error } = await supabase.from('license_keys').insert({ 
      key: key.key, 
      plan: key.plan, 
      is_used: key.isUsed, 
      created_at: key.createdAt.toISOString() 
    });
    return { error };
  },

  async getLicenseKeys(): Promise<LicenseKey[]> {
    if (!supabase) {
      const keys = storage.get('license_keys') || [];
      return keys.map((k: any) => ({ ...k, createdAt: new Date(k.createdAt) }));
    }
    const { data, error } = await supabase.from('license_keys').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map(k => ({ 
      ...k, 
      isUsed: k.is_used, 
      usedBy: k.used_by, 
      createdAt: new Date(k.created_at) 
    }));
  },

  async useLicenseKey(key: string, userId: string) {
    if (!supabase) {
      const keys = storage.get('license_keys') || [];
      const lk = keys.find((k: any) => k.key === key && !k.isUsed);
      if (lk) {
        lk.isUsed = true;
        lk.usedBy = userId;
        storage.set('license_keys', keys);
        return { data: lk, error: null };
      }
      return { data: null, error: 'Clé non trouvée ou déjà utilisée' };
    }
    const { data, error } = await supabase.from('license_keys')
      .update({ is_used: true, used_by: userId })
      .eq('key', key)
      .eq('is_used', false)
      .select()
      .single();
    
    return { data, error };
  }
};
