/**
 * Daily calorie need — Mifflin–St Jeor (the most accurate common formula for adults).
 *   BMR  = 10·kg + 6.25·cm − 5·age + (man +5 | woman −161)
 *   need = BMR · activity
 *   goal = lose −20% · maintain 0 · gain +10%   (never below a safe minimum)
 * A rough guide, not medical advice.
 */
export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'high';

export const ACTIVITY_FACTOR: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725 };
const GOAL_FACTOR: Record<Goal, number> = { lose: 0.8, maintain: 1, gain: 1.1 };
/** Below this a diet should be supervised by a doctor. */
const SAFE_MIN: Record<Sex, number> = { male: 1500, female: 1200 };

export interface CalcInput { sex: Sex; age: number; heightCm: number; weightKg: number; activity: Activity; goal: Goal }
export interface CalcResult {
  bmr: number;
  /** calories that keep the weight where it is */
  maintain: number;
  /** calories for the chosen goal */
  target: number;
  /** the goal wanted fewer calories than is safe, so the target was raised to the minimum */
  raisedToSafeMin: boolean;
}

export const inputOk = (i: { age: number; heightCm: number; weightKg: number }) =>
  i.age >= 14 && i.age <= 90 && i.heightCm >= 120 && i.heightCm <= 230 && i.weightKg >= 35 && i.weightKg <= 250;

const round50 = (n: number) => Math.round(n / 50) * 50;

export function calcCalories(i: CalcInput): CalcResult {
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + (i.sex === 'male' ? 5 : -161);
  const maintain = bmr * ACTIVITY_FACTOR[i.activity];
  const wanted = maintain * GOAL_FACTOR[i.goal];
  const floor = SAFE_MIN[i.sex];
  const raised = i.goal === 'lose' && wanted < floor;
  return { bmr: Math.round(bmr), maintain: round50(maintain), target: round50(raised ? Math.min(floor, maintain) : wanted), raisedToSafeMin: raised };
}

/** The level closest to `target`; a tie goes to the lower one. */
export function nearestLevel<T extends { cal: number }>(levels: T[], target: number): T | undefined {
  return levels.reduce<T | undefined>(
    (best, o) => (!best || Math.abs(o.cal - target) < Math.abs(best.cal - target) || (Math.abs(o.cal - target) === Math.abs(best.cal - target) && o.cal < best.cal) ? o : best),
    undefined
  );
}

/** The lowest ration (kcal) that is reasonable for this person: not under 80% of their target and not under the safe minimum. */
export const minAllowedCal = (target: number, sex: Sex): number => Math.max(Math.round(target * 0.8), SAFE_MIN[sex]);

/**
 * The levels this person may pick. If none reaches the minimum (a big appetite, a small menu),
 * the closest level is allowed so they are never left without a choice.
 */
export function allowedLevels<T extends { cal: number }>(levels: T[], target: number, sex: Sex): T[] {
  const min = minAllowedCal(target, sex);
  const ok = levels.filter(o => o.cal >= min);
  if (ok.length) return ok;
  const near = nearestLevel(levels, target);
  return near ? [near] : [];
}

export type BmiClass = 'under' | 'normal' | 'over' | 'obese';

export interface Report {
  bmi: number;
  bmiClass: BmiClass;
  /** weight range that is a healthy BMI (18.5–24.9) at this height */
  healthyMin: number;
  healthyMax: number;
  /** litres of water a day */
  waterL: number;
  /** grams a day for the goal calories */
  protein: number;
  fat: number;
  carbs: number;
  /** expected change per week, kg (negative = losing) */
  weeklyKg: number;
}

/** Everything the quiz result screen shows besides the calories. Rules of thumb, not medical advice. */
export function buildReport(i: CalcInput, c: CalcResult): Report {
  const m = i.heightCm / 100;
  const bmi = i.weightKg / (m * m);
  const bmiClass: BmiClass = bmi < 18.5 ? 'under' : bmi < 25 ? 'normal' : bmi < 30 ? 'over' : 'obese';
  const perKg = i.goal === 'maintain' ? 1.5 : 1.8; // protein, g per kg
  const protein = Math.round(i.weightKg * perKg);
  const fat = Math.round((c.target * 0.28) / 9);
  const carbs = Math.max(0, Math.round((c.target - protein * 4 - fat * 9) / 4));
  const extra = i.activity === 'high' ? 0.5 : i.activity === 'moderate' ? 0.3 : 0;
  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiClass,
    healthyMin: Math.round(18.5 * m * m),
    healthyMax: Math.round(24.9 * m * m),
    waterL: Math.round((i.weightKg * 0.033 + extra) * 10) / 10,
    protein, fat, carbs,
    weeklyKg: Math.round(((c.target - c.maintain) * 7 / 7700) * 10) / 10,
  };
}
