'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Dumbbell, Flame, Scale, Armchair, Footprints, Bike, Zap, X, Droplets, TrendingDown } from 'lucide-react';
import { Locale } from '@/types';
import { Activity, BmiClass, Goal, Sex, allowedLevels, buildReport, calcCalories, nearestLevel } from '@/lib/calorieCalc';
import { ClientProfile, DEFAULT_PROFILE } from '@/lib/clientProfile';
import { CalorieOption } from '@/lib/rationOptions';
import { T, mealsWord } from './orderData';
import { RulerPicker } from './RulerPicker';

interface Props {
  locale: Locale;
  /** the saved details, or null for a first visit (then nothing is pre-selected) */
  initial: ClientProfile | null;
  /** calorie levels we can really serve right now */
  levels: CalorieOption[];
  onClose: () => void;
  onApply: (profile: ClientProfile, calories: number) => void;
}

const STEPS = ['sex', 'age', 'height', 'weight', 'activity', 'goal', 'result'] as const;
type StepId = (typeof STEPS)[number];

/** A simple person drawn to scale: the taller the height, the taller the figure. */
function Figure({ heightCm, sex }: { heightCm: number; sex: Sex | null }) {
  const scale = Math.min(1, Math.max(0.36, (heightCm - 60) / (220 - 60)));
  return (
    <div className="q-figure" aria-hidden>
      <svg viewBox="0 0 100 220" style={{ transform: `scaleY(${scale}) scaleX(${0.55 + scale * 0.45})` }}>
        <circle cx="50" cy="20" r="15" />
        {sex === 'female' ? <path d="M38 40h24l14 62H24z" /> : <rect x="29" y="40" width="42" height="66" rx="14" />}
        <rect x="15" y="42" width="11" height="62" rx="5.5" />
        <rect x="74" y="42" width="11" height="62" rx="5.5" />
        <rect x="32" y="100" width="16" height="112" rx="7" />
        <rect x="52" y="100" width="16" height="112" rx="7" />
      </svg>
      <span className="q-ground" />
    </div>
  );
}

const BMI_ORDER: BmiClass[] = ['under', 'normal', 'over', 'obese'];
const BMI_LABEL = { under: 'bmiUnder', normal: 'bmiNormal', over: 'bmiOver', obese: 'bmiObese' } as const;

export function RationQuiz({ locale: l, initial, levels, onClose, onApply }: Props) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  // numbers start at typical values, but sex / activity / goal stay empty until the customer answers
  const [age, setAge] = useState(initial?.age ?? DEFAULT_PROFILE.age);
  const [heightCm, setHeight] = useState(initial?.heightCm ?? DEFAULT_PROFILE.heightCm);
  const [weightKg, setWeight] = useState(initial?.weightKg ?? DEFAULT_PROFILE.weightKg);
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [activity, setActivity] = useState<Activity | null>(initial?.activity ?? null);
  const [goal, setGoal] = useState<Goal | null>(initial?.goal ?? null);
  const [picked, setPicked] = useState<number | null>(null);
  const id: StepId = STEPS[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const complete = sex !== null && activity !== null && goal !== null;
  const profile: ClientProfile | null = complete ? { sex, age, heightCm, weightKg, activity, goal } : null;
  const calc = useMemo(() => (profile ? calcCalories(profile) : null), [profile?.sex, profile?.age, profile?.heightCm, profile?.weightKg, profile?.activity, profile?.goal]); // eslint-disable-line react-hooks/exhaustive-deps
  const report = useMemo(() => (profile && calc ? buildReport(profile, calc) : null), [profile, calc]);

  // nobody gets offered a ration far below what they need
  const allowed = useMemo(() => (calc && profile ? allowedLevels(levels, calc.target, profile.sex) : []), [levels, calc, profile]);
  const best = calc ? nearestLevel(allowed, calc.target) : undefined;
  const chosen = picked ?? best?.cal ?? null;

  const go = (n: number) => {
    setDir(n > i ? 1 : -1);
    setI(n);
    if (STEPS[n] === 'result') setPicked(null);
  };
  const answer = (apply: () => void) => {
    apply();
    setTimeout(() => go(Math.min(STEPS.length - 1, i + 1)), 180);
  };

  const sexOpt: { v: Sex; label: string; icon: string }[] = [
    { v: 'male', label: T.male[l], icon: '♂' },
    { v: 'female', label: T.female[l], icon: '♀' },
  ];
  const actOpt: { v: Activity; label: string; icon: React.ReactNode }[] = [
    { v: 'sedentary', label: T.actSedentary[l], icon: <Armchair size={22} /> },
    { v: 'light', label: T.actLight[l], icon: <Footprints size={22} /> },
    { v: 'moderate', label: T.actModerate[l], icon: <Bike size={22} /> },
    { v: 'high', label: T.actHigh[l], icon: <Zap size={22} /> },
  ];
  const goalOpt: { v: Goal; label: string; icon: React.ReactNode }[] = [
    { v: 'lose', label: T.goalLose[l], icon: <Flame size={22} /> },
    { v: 'maintain', label: T.goalMaintain[l], icon: <Scale size={22} /> },
    { v: 'gain', label: T.goalGain[l], icon: <Dumbbell size={22} /> },
  ];

  const titles: Record<StepId, string> = {
    sex: T.qSex[l], age: T.qAge[l], height: T.qHeight[l], weight: T.qWeight[l],
    activity: T.qActivity[l], goal: T.qGoal[l], result: T.qResult[l],
  };

  // ── result pieces ──
  const bmiPct = report ? Math.min(100, Math.max(0, ((report.bmi - 15) / (40 - 15)) * 100)) : 0;
  const kcalMax = calc ? Math.max(calc.maintain, calc.target, chosen ?? 0) : 1;
  const bars = calc
    ? [
        { label: T.rMaintain[l], v: calc.maintain, cls: 'm' },
        { label: T.rTarget[l], v: calc.target, cls: 't' },
        ...(chosen !== null ? [{ label: T.rRation[l], v: chosen, cls: 'r' }] : []),
      ]
    : [];
  const macro = report
    ? [
        { label: T.protein[l], g: report.protein, kcal: report.protein * 4, cls: 'p' },
        { label: T.fat[l], g: report.fat, kcal: report.fat * 9, cls: 'f' },
        { label: T.carbs[l], g: report.carbs, kcal: report.carbs * 4, cls: 'c' },
      ]
    : [];
  const macroKcal = macro.reduce((a, m) => a + m.kcal, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="q-back" role="presentation" onClick={onClose}>
      <div className="q-modal" role="dialog" aria-modal="true" aria-label={T.quizBtn[l]} onClick={e => e.stopPropagation()}>
        <header className="q-head">
          {i > 0 ? (
            <button type="button" className="q-icon" onClick={() => go(i - 1)} aria-label={T.prev[l]}><ArrowLeft size={20} /></button>
          ) : <span className="q-icon" />}
          <div className="q-progress" aria-hidden>
            {STEPS.map((s, k) => <i key={s} className={k <= i ? 'on' : ''} />)}
          </div>
          <button type="button" className="q-icon" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>

        <div className={`q-body ${dir > 0 ? 'fwd' : 'back'}`} key={id}>
          <h2 className="q-title">{titles[id]}</h2>

          {id === 'sex' && (
            <div className="q-cards two">
              {sexOpt.map(o => (
                <button key={o.v} type="button" className="q-card big" aria-pressed={sex === o.v} onClick={() => answer(() => setSex(o.v))}>
                  <span className="q-sym">{o.icon}</span>
                  <b>{o.label}</b>
                </button>
              ))}
            </div>
          )}

          {id === 'age' && (
            <div className="q-picker">
              <div className="q-big"><b>{age}</b><span>{T.yrs[l]}</span></div>
              <RulerPicker label={T.calcAge[l]} value={age} min={14} max={90} unitPx={14} majorEvery={10} onChange={setAge} />
            </div>
          )}

          {id === 'height' && (
            <div className="q-picker height">
              <Figure heightCm={heightCm} sex={sex} />
              <div className="q-hcol">
                <div className="q-big"><b>{heightCm}</b><span>{T.cm[l]}</span></div>
                <RulerPicker label={T.calcHeight[l]} orientation="v" value={heightCm} min={120} max={220} unitPx={9} majorEvery={10} onChange={setHeight} />
              </div>
            </div>
          )}

          {id === 'weight' && (
            <div className="q-picker">
              <div className="q-big"><b>{weightKg}</b><span>{T.kg[l]}</span></div>
              <RulerPicker label={T.calcWeight[l]} value={weightKg} min={35} max={200} unitPx={11} majorEvery={10} onChange={setWeight} />
            </div>
          )}

          {id === 'activity' && (
            <div className="q-cards">
              {actOpt.map(o => (
                <button key={o.v} type="button" className="q-card" aria-pressed={activity === o.v} onClick={() => answer(() => setActivity(o.v))}>
                  <span className="q-ico">{o.icon}</span><b>{o.label}</b>
                </button>
              ))}
            </div>
          )}

          {id === 'goal' && (
            <div className="q-cards">
              {goalOpt.map(o => (
                <button key={o.v} type="button" className="q-card" aria-pressed={goal === o.v} onClick={() => answer(() => setGoal(o.v))}>
                  <span className="q-ico">{o.icon}</span><b>{o.label}</b>
                </button>
              ))}
            </div>
          )}

          {id === 'result' && calc && report && profile && (
            <div className="q-result">
              <div className="q-num"><b>{calc.target}</b><span>{T.kcal[l]} / {T.perDay[l]}</span></div>
              <p>{T.calcResult[l].replace('{need}', String(calc.maintain)).replace('{target}', String(calc.target))}</p>
              {calc.raisedToSafeMin && <p className="ord-warn"><AlertTriangle size={14} /> {T.calcSafe[l]}</p>}

              {/* body mass index */}
              <section className="q-panel">
                <h4>{T.rBody[l]}</h4>
                <div className="q-bmi-row"><span>{T.rBmi[l]}</span><b>{report.bmi}</b><em className={`bmi-${report.bmiClass}`}>{T[BMI_LABEL[report.bmiClass]][l]}</em></div>
                <div className="q-bmi" aria-hidden>
                  {BMI_ORDER.map(c => <i key={c} className={`bmi-${c}`} />)}
                  <span className="q-bmi-pin" style={{ left: `${bmiPct}%` }} />
                </div>
                <small>{T.rHealthy[l].replace('{a}', String(report.healthyMin)).replace('{b}', String(report.healthyMax))}</small>
              </section>

              {/* calories: need vs goal vs the ration */}
              <section className="q-panel">
                <h4>{T.rCalories[l]}</h4>
                {bars.map(b => (
                  <div key={b.cls} className="q-bar">
                    <span>{b.label}</span>
                    <div><i className={b.cls} style={{ width: `${Math.max(6, (b.v / kcalMax) * 100)}%` }} /></div>
                    <b>{b.v}</b>
                  </div>
                ))}
              </section>

              {/* macros donut */}
              <section className="q-panel">
                <h4>{T.rMacros[l]}</h4>
                <div className="q-donut-row">
                  <svg viewBox="0 0 140 140" className="q-donut" role="img" aria-label={T.rMacros[l]}>
                    <g transform="rotate(-90 70 70)">
                      <circle cx="70" cy="70" r={R} className="ring" />
                      {macro.map(m => {
                        const len = (m.kcal / macroKcal) * C;
                        const el = <circle key={m.cls} cx="70" cy="70" r={R} className={`seg ${m.cls}`} strokeDasharray={`${Math.max(0, len - 3)} ${C}`} strokeDashoffset={-offset} />;
                        offset += len;
                        return el;
                      })}
                    </g>
                    <text x="70" y="68" textAnchor="middle" className="d-num">{calc.target}</text>
                    <text x="70" y="86" textAnchor="middle" className="d-sub">{T.kcal[l]}</text>
                  </svg>
                  <ul className="q-legend">
                    {macro.map(m => (
                      <li key={m.cls}><i className={m.cls} /><span>{m.label}</span><b>{m.g} {T.grams[l]}</b></li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* water & pace */}
              <div className="q-two">
                <section className="q-panel mini">
                  <Droplets size={20} />
                  <h4>{T.rWater[l]}</h4>
                  <b>{T.rWaterText[l].replace('{l}', String(report.waterL))}</b>
                </section>
                <section className="q-panel mini">
                  <TrendingDown size={20} />
                  <h4>{T.rPace[l]}</h4>
                  <b>{report.weeklyKg === 0 ? T.rPaceKeep[l] : T.rPaceText[l].replace('{kg}', `${report.weeklyKg > 0 ? '+' : '−'}${Math.abs(report.weeklyKg)}`)}</b>
                </section>
              </div>

              {/* the ration to choose */}
              <h4 className="q-sub">{T.rChoose[l]}</h4>
              {best ? (
                <>
                  <p><b>{T.calcClosest[l].replace('{cal}', String(best.cal))}</b>{' '}
                    {calc.target - best.cal > calc.target * 0.1 ? T.calcShort[l].replace('{diff}', String(calc.target - best.cal)) : ''}
                  </p>
                  <div className="q-levels">
                    {levels.map(o => {
                      const low = !allowed.some(a => a.cal === o.cal);
                      return (
                        <button key={o.cal} type="button" className={`ord-chip${low ? ' off' : ''}`} disabled={low} aria-pressed={!low && o.cal === chosen} onClick={() => setPicked(o.cal)}>
                          {!low && o.cal === best.cal && <span className="ord-rec">{T.recommended[l]}</span>}
                          <span className="lv-kcal">{o.cal} <em>{T.kcal[l]}</em></span>
                          <small>{low ? T.tooLow[l] : `${o.meals} ${mealsWord(o.meals, l)}`}</small>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="ord-warn"><AlertTriangle size={14} /> {T.noRations[l]}</p>
              )}
              <p className="ord-note">{T.calcNote[l]} {T.savedNote[l]}</p>
            </div>
          )}
        </div>

        <footer className="q-foot">
          {id === 'result' ? (
            <button type="button" className="ord-cta q-cta" disabled={chosen === null || !profile} onClick={() => chosen !== null && profile && onApply(profile, chosen)}>
              <Check size={18} /> {chosen !== null ? T.quizApply[l].replace('{cal}', String(chosen)) : T.next[l]}
            </button>
          ) : (
            (id === 'age' || id === 'height' || id === 'weight') && (
              <button type="button" className="ord-cta q-cta" onClick={() => go(i + 1)}>{T.next[l]} <ArrowRight size={18} /></button>
            )
          )}
        </footer>
      </div>
    </div>
  );
}
