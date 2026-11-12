import type { Activity, Goal, Sex } from './calorieCalc';

/** What the customer told the quiz about themself. Kept on this device so the next order starts prefilled. */
export interface ClientProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

export const DEFAULT_PROFILE: ClientProfile = { sex: 'male', age: 30, heightCm: 175, weightKg: 75, activity: 'light', goal: 'lose' };

const KEY = 'fitfood.profile.v1';

const num = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : fallback;
};

export function loadProfile(): ClientProfile | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      sex: p.sex === 'female' ? 'female' : 'male',
      age: num(p.age, 14, 90, DEFAULT_PROFILE.age),
      heightCm: num(p.heightCm, 120, 230, DEFAULT_PROFILE.heightCm),
      weightKg: num(p.weightKg, 35, 250, DEFAULT_PROFILE.weightKg),
      activity: ['sedentary', 'light', 'moderate', 'high'].includes(p.activity) ? p.activity : DEFAULT_PROFILE.activity,
      goal: ['lose', 'maintain', 'gain'].includes(p.goal) ? p.goal : DEFAULT_PROFILE.goal,
    };
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

export function saveProfile(p: ClientProfile): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode — the quiz simply asks again next time */
  }
}
