'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { DayOfWeek, Dish, MealType } from '@/types';

/**
 * The ration menu comes from the database — table `partner_products`, rows whose
 * target_channels contain "site" (the admin panel's "site rations" tab). No mock data here.
 */

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'dessert', 'smoothie'];
const CACHE_KEY = 'fitfood_ration_dishes_v1';

/** Cooking videos in /public/video, keyed by the dish slug they belong to. */
export const DISH_VIDEOS: Record<string, { title: string; file: string }> = {
  'italian-balance': { title: 'Italian Balance', file: 'Italian Balance' },
  'tuna-energy': { title: 'Tuna Energy', file: 'Tuna Energy' },
  'hake-royale': { title: 'Hake Royale', file: 'hake royale' },
  'mexican-beef-balance': { title: 'Mexican Beef Balance', file: 'mexican balance' },
};
export const videoSrc = (slug: string, portrait: boolean): string | null => {
  const v = DISH_VIDEOS[slug];
  return v ? `/video/${encodeURIComponent(`${v.file} ${portrait ? '9x16' : '16x9'}.mp4`)}` : null;
};

const trio = (v: any, fallback = '') => {
  let o = v;
  if (typeof o === 'string') {
    try { o = JSON.parse(o); } catch { return { ka: o, ru: o, en: o }; }
  }
  const ka = o?.ka || o?.ru || o?.en || fallback;
  return { ka, ru: o?.ru || ka, en: o?.en || o?.ru || ka };
};

const list = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

export function mapProductToDish(row: any): Dish {
  const ing = typeof row.ingredients === 'string' ? safeJson(row.ingredients) : row.ingredients;
  const ka = list(Array.isArray(ing) ? ing : ing?.ka);
  const channels: string[] = list(row.target_channels);
  const meal = String(row.meal_type || 'lunch').toLowerCase() as MealType;
  const day = String(row.day || 'mon').toLowerCase() as DayOfWeek;
  return {
    id: String(row.id),
    slug: String(row.slug || row.id),
    name: trio(row.name, 'კერძი'),
    description: trio(row.description),
    mealType: MEALS.includes(meal) ? meal : 'lunch',
    day: DAYS.includes(day) ? day : 'mon',
    macros: {
      calories: Number(row.calories) || 0,
      protein: Number(row.protein) || 0,
      fat: Number(row.fat) || 0,
      carbs: Number(row.carbs) || 0,
      weightGrams: Number(row.weight_grams) || 0,
    },
    image: row.image || '', // no photo in the database = no photo (the page shows a neutral plate)
    tags: [],
    allergens: list(row.allergens),
    isGeorgianFit: false,
    cookingMethod: undefined,
    ingredients: {
      ka,
      ru: list(Array.isArray(ing) ? ing : ing?.ru).length ? list(ing?.ru) : ka,
      en: list(Array.isArray(ing) ? ing : ing?.en).length ? list(ing?.en) : ka,
    },
    reviews: [],
    rating: 0,
    channels,
    rationOnly: channels.includes('site') && !channels.includes('pos'),
    stopped: Boolean(row.stopped),
    sortOrder: row.sort_order == null ? undefined : Number(row.sort_order),
  };
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

/** All dishes that belong to the site rations. `null` = the database could not be reached. */
export async function fetchRationDishes(): Promise<Dish[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('partner_products').select('*').order('created_at', { ascending: true });
    if (error || !data) return null;
    return data
      .filter((r: any) => r.category !== 'drinks')
      .filter((r: any) => !r.stopped) // the stop-list: not served until switched back on
      .filter((r: any) => {
        const ch = list(r.target_channels);
        return ch.length === 0 || ch.includes('site'); // untagged rows follow the admin default ["site","pos"]
      })
      .map(mapProductToDish)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  } catch {
    return null;
  }
}

export type RationDishesState = { dishes: Dish[]; status: 'loading' | 'ready' | 'error' };

/** React hook: the live ration menu. Falls back to the last copy fetched on this device, never to mocks. */
export function useRationDishes(): RationDishesState {
  const [state, setState] = useState<RationDishesState>({ dishes: [], status: 'loading' });

  useEffect(() => {
    let alive = true;
    fetchRationDishes().then(fresh => {
      if (!alive) return;
      if (fresh) {
        setState({ dishes: fresh, status: 'ready' });
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch { /* storage unavailable */ }
        return;
      }
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (Array.isArray(cached) && cached.length) {
          setState({ dishes: cached, status: 'ready' });
          return;
        }
      } catch { /* ignore */ }
      setState({ dishes: [], status: 'error' });
    });
    return () => { alive = false; };
  }, []);

  return state;
}
