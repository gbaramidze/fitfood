import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { KitchenCheck, KitchenClient } from '@/types/kitchen';

/**
 * Supabase access for the kitchen tablet. Every call resolves to `null` / `false` instead of
 * throwing, so the UI can fall back to device-local storage when the tables are missing
 * (see supabase/add_kitchen_tables.sql) or the network is down.
 */

const mapClient = (r: any): KitchenClient => ({
  id: r.id,
  clientName: r.client_name,
  phone: r.phone || '',
  address: r.address || '',
  zone: r.zone || '',
  programId: r.program_id || '',
  programTitle: r.program_title || '',
  calories: Number(r.calories) || 0,
  totalDays: Number(r.total_days) || 0,
  deliveredDays: Number(r.delivered_days) || 0,
  deliverySlot: r.delivery_slot || 'morning',
  startDate: typeof r.start_date === 'string' ? r.start_date.slice(0, 10) : '',
  status: r.status || 'active',
  notes: r.notes || undefined,
  createdAt: r.created_at || new Date().toISOString(),
});

const clientRow = (c: KitchenClient) => ({
  id: c.id,
  client_name: c.clientName,
  phone: c.phone,
  address: c.address,
  zone: c.zone,
  program_id: c.programId,
  program_title: c.programTitle,
  calories: c.calories,
  total_days: c.totalDays,
  delivered_days: c.deliveredDays,
  delivery_slot: c.deliverySlot,
  start_date: c.startDate,
  status: c.status,
  notes: c.notes || null,
});

export const kitchenDbService = {
  async getClients(): Promise<KitchenClient[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('kitchen_clients').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map(mapClient);
    } catch {
      return null;
    }
  },

  async upsertClient(c: KitchenClient): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('kitchen_clients').upsert(clientRow(c));
      return !error;
    } catch {
      return false;
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('kitchen_clients').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  async getChecks(sinceDate: string): Promise<KitchenCheck[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('kitchen_checks').select('*').gte('plan_date', sinceDate);
      if (error || !data) return null;
      return data.map((r: any) => ({
        planDate: typeof r.plan_date === 'string' ? r.plan_date.slice(0, 10) : '',
        ref: r.ref,
        done: Boolean(r.done),
        qty: r.qty === null || r.qty === undefined ? undefined : Number(r.qty),
        doneAt: r.done_at || new Date().toISOString(),
      }));
    } catch {
      return null;
    }
  },

  async setCheck(c: KitchenCheck): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('kitchen_checks').upsert({
        plan_date: c.planDate,
        ref: c.ref,
        done: c.done,
        qty: c.qty ?? null,
        done_at: c.doneAt,
      });
      return !error;
    } catch {
      return false;
    }
  },
};
