'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { partnerDbService } from '@/services/partnerDbService';
import { kitchenDbService } from '@/services/kitchenDbService';
import { computeKitchenPlan, KitchenPlan } from '@/lib/kitchenPlanHelper';
import { computeRationPlan, RationDayPlan, remainingDays, SentLookup } from '@/lib/rationPlanHelper';
import { dayKeyOf } from '@/lib/salesForecastHelper';
import { allRationDishes as siteDishes } from '@/lib/rationRotation';
import { checkId, KitchenCheck, KitchenClient } from '@/types/kitchen';
import { PartnerWriteOff } from '@/types/partner';

const LS_CHECKS = 'fitfood_kitchen_checks_v1';
const LS_CLIENTS = 'fitfood_kitchen_clients_v1';
const CHECK_HISTORY_DAYS = 120; // client "days left" is derived from past "sent" ticks
const REFRESH_MS = 60_000;

export type SyncMode = 'loading' | 'cloud' | 'local';
export type DayOffset = 0 | 1 | 2;

interface KitchenContextType {
  now: Date;
  offset: DayOffset;
  setOffset: (o: DayOffset) => void;
  plan: KitchenPlan;
  ration: RationDayPlan;
  syncMode: SyncMode;
  isDataLoading: boolean;
  refresh: () => Promise<void>;

  isChecked: (ref: string) => boolean;
  checkedQty: (ref: string) => number | undefined;
  toggleCheck: (ref: string, qty?: number) => void;

  clients: KitchenClient[];
  saveClient: (c: Omit<KitchenClient, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteClient: (id: string) => void;
  clientRemainingDays: (c: KitchenClient) => number;
  /** photo of a hall product (partner_products.image), by product id */
  dishImage: (productId?: string) => string | undefined;
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the cloud copy still works */
  }
}

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sales, points, dishes, preorders, stocks } = useAdmin();

  const [now, setNow] = useState<Date>(() => new Date());
  const [offset, setOffset] = useState<DayOffset>(1);
  const [writeOffs, setWriteOffs] = useState<PartnerWriteOff[]>([]);
  const [checks, setChecks] = useState<Record<string, KitchenCheck>>({});
  const [clients, setClients] = useState<KitchenClient[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode>('loading');
  const [isDataLoading, setIsDataLoading] = useState(true);

  const checksRef = useRef(checks);
  const clientsRef = useRef(clients);
  checksRef.current = checks;
  clientsRef.current = clients;

  // Keep "now" fresh so the plan follows the clock (sales so far today, share of the day elapsed).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const since = new Date();
    since.setDate(since.getDate() - CHECK_HISTORY_DAYS);

    const [remoteChecks, remoteClients, remoteWriteOffs] = await Promise.all([
      kitchenDbService.getChecks(dayKeyOf(since)),
      kitchenDbService.getClients(),
      partnerDbService.getWriteOffs(),
    ]);

    if (remoteWriteOffs) setWriteOffs(remoteWriteOffs);

    if (remoteChecks && remoteClients) {
      // Anything ticked / created while the tables were missing is pushed up once, then the cloud wins.
      const localChecks = readLocal<Record<string, KitchenCheck>>(LS_CHECKS, {});
      const localClients = readLocal<KitchenClient[]>(LS_CLIENTS, []);
      const remoteCheckIds = new Set(remoteChecks.map(c => checkId(c.planDate, c.ref)));
      const remoteClientIds = new Set(remoteClients.map(c => c.id));

      const pushes: Promise<boolean>[] = [];
      const mergedChecks = new Map<string, KitchenCheck>(remoteChecks.map(c => [checkId(c.planDate, c.ref), c]));
      Object.entries(localChecks).forEach(([id, c]) => {
        const remote = mergedChecks.get(id);
        // Local-only tick, or a newer local change that has not reached the cloud yet.
        if (!remoteCheckIds.has(id) || (remote && c.doneAt > remote.doneAt)) {
          mergedChecks.set(id, c);
          pushes.push(kitchenDbService.setCheck(c));
        }
      });
      const mergedClients = [...remoteClients];
      localClients.forEach(c => {
        if (!remoteClientIds.has(c.id)) {
          mergedClients.push(c);
          pushes.push(kitchenDbService.upsertClient(c));
        }
      });

      const checkMap = Object.fromEntries(mergedChecks.entries());
      setChecks(checkMap);
      setClients(mergedClients);
      writeLocal(LS_CHECKS, checkMap);
      writeLocal(LS_CLIENTS, mergedClients);
      setSyncMode('cloud');
      Promise.all(pushes).catch(() => undefined);
    } else {
      setChecks(readLocal(LS_CHECKS, {}));
      setClients(readLocal(LS_CLIENTS, []));
      setSyncMode('local');
    }
    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    let channels: ReturnType<typeof supabase.channel>[] = [];
    if (isSupabaseConfigured) {
      try {
        channels = ['kitchen_checks', 'kitchen_clients', 'partner_write_offs'].map(table =>
          supabase
            .channel(`kitchen_${table}_rt`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
            .subscribe()
        );
      } catch (e) {
        console.warn('Kitchen realtime subscription error:', e);
      }
    }
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      channels.forEach(c => supabase.removeChannel(c));
    };
  }, [load]);

  const targetDate = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }, [now, offset]);

  const plan = useMemo(
    () => computeKitchenPlan({ sales, points, dishes, preorders, writeOffs, stocks, targetDate, now }),
    [sales, points, dishes, preorders, writeOffs, stocks, targetDate, now]
  );

  // ---- sent-box lookup, derived from ticks ----
  const sentLookup = useMemo<SentLookup>(() => {
    const counts: Record<string, number> = {};
    const onDay = new Set<string>();
    Object.values(checks).forEach(c => {
      if (!c.done || !c.ref.startsWith('rsent:')) return;
      const clientId = c.ref.slice('rsent:'.length);
      counts[clientId] = (counts[clientId] || 0) + 1;
      onDay.add(`${clientId}|${c.planDate}`);
    });
    return { count: id => counts[id] || 0, on: (id, dateKey) => onDay.has(`${id}|${dateKey}`) };
  }, [checks]);

  const ration = useMemo(
    () => computeRationPlan(clients, siteDishes, targetDate, now, sentLookup),
    [clients, targetDate, now, sentLookup]
  );

  // ---- ticks ----
  const planDateKey = plan.targetDateKey;

  const isChecked = useCallback(
    (ref: string) => Boolean(checks[checkId(planDateKey, ref)]?.done),
    [checks, planDateKey]
  );
  const checkedQty = useCallback(
    (ref: string) => {
      const c = checks[checkId(planDateKey, ref)];
      return c?.done ? c.qty : undefined;
    },
    [checks, planDateKey]
  );

  const toggleCheck = useCallback(
    (ref: string, qty?: number) => {
      const id = checkId(planDateKey, ref);
      const prev = checksRef.current[id];
      const next: KitchenCheck = {
        planDate: planDateKey,
        ref,
        done: !prev?.done,
        qty: prev?.done ? prev.qty : qty,
        doneAt: new Date().toISOString(),
      };
      const nextMap = { ...checksRef.current, [id]: next };
      checksRef.current = nextMap;
      setChecks(nextMap);
      writeLocal(LS_CHECKS, nextMap);
      if (navigator.vibrate) navigator.vibrate(12);
      kitchenDbService.setCheck(next).then(ok => {
        if (!ok) setSyncMode('local');
      });
    },
    [planDateKey]
  );

  // ---- client cards ----
  const saveClient = useCallback<KitchenContextType['saveClient']>(c => {
    const full: KitchenClient = {
      ...c,
      id: c.id || `kc-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
      createdAt: clientsRef.current.find(x => x.id === c.id)?.createdAt || new Date().toISOString(),
    };
    const next = clientsRef.current.some(x => x.id === full.id)
      ? clientsRef.current.map(x => (x.id === full.id ? full : x))
      : [full, ...clientsRef.current];
    clientsRef.current = next;
    setClients(next);
    writeLocal(LS_CLIENTS, next);
    kitchenDbService.upsertClient(full).then(ok => {
      if (!ok) setSyncMode('local');
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    const next = clientsRef.current.filter(x => x.id !== id);
    clientsRef.current = next;
    setClients(next);
    writeLocal(LS_CLIENTS, next);
    kitchenDbService.deleteClient(id).then(ok => {
      if (!ok) setSyncMode('local');
    });
  }, []);

  const imageById = useMemo(() => {
    const m = new Map<string, string>();
    dishes.forEach(d => {
      if (d.id && d.image) m.set(d.id, d.image);
    });
    return m;
  }, [dishes]);
  const dishImage = useCallback((productId?: string) => (productId ? imageById.get(productId) : undefined), [imageById]);

  const clientRemainingDays = useCallback((c: KitchenClient) => remainingDays(c, sentLookup), [sentLookup]);

  const refresh = useCallback(async () => {
    setNow(new Date());
    await load();
  }, [load]);

  return (
    <KitchenContext.Provider
      value={{
        now,
        offset,
        setOffset,
        plan,
        ration,
        syncMode,
        isDataLoading,
        refresh,
        isChecked,
        checkedQty,
        toggleCheck,
        clients,
        saveClient,
        deleteClient,
        clientRemainingDays,
        dishImage,
      }}
    >
      {children}
    </KitchenContext.Provider>
  );
};

export const useKitchen = () => {
  const ctx = useContext(KitchenContext);
  if (!ctx) throw new Error('useKitchen must be used within a KitchenProvider');
  return ctx;
};
