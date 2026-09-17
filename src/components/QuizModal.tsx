'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { programs } from '@/data/programs';
import { ALLERGENS_DATABASE, ALLERGEN_CATEGORIES } from '@/data/allergensList';
import {
  IconClose,
  IconArrowRight,
  IconArrowLeft,
  IconZap,
  IconFire,
  IconLeaf,
  IconDumbbell,
  IconCheck,
  IconUser,
  IconSparkles,
  IconSearch,
  IconPlus,
  IconShield,
  IconClock,
} from '@/components/Icons';

export const QuizModal: React.FC = () => {
  const { locale, t } = useLanguage();
  const { isQuizOpen, setIsQuizOpen, setCart, setIsCartOpen, showToast } = useStore();

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<'weight_loss' | 'balance' | 'muscle_gain' | 'tourist_detox'>('weight_loss');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [age, setAge] = useState(28);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(68);
  const [targetWeightKg, setTargetWeightKg] = useState(60);
  const [activity, setActivity] = useState<'sedentary' | 'moderate' | 'high' | 'pro_athlete'>('moderate');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [allergenSearchQuery, setAllergenSearchQuery] = useState('');
  const [allergenCategory, setAllergenCategory] = useState('popular');
  const [customInputText, setCustomInputText] = useState('');
  const [format, setFormat] = useState<'standard' | 'trial' | 'month'>('standard');

  // Body scroll lock & ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuizOpen) {
        setIsQuizOpen(false);
      }
    };
    if (isQuizOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuizOpen, setIsQuizOpen]);

  // Reset or initialize state on opening
  useEffect(() => {
    if (isQuizOpen) {
      setStep(1);
    }
  }, [isQuizOpen]);

  // Allergy toggle
  const toggleAllergy = (id: string) => {
    setAllergies(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  // Add custom unwanted ingredient
  const handleAddCustom = (valueToAdd?: string) => {
    const text = (valueToAdd || customInputText).trim();
    if (!text) return;
    if (!customAllergens.includes(text) && !allergies.includes(text)) {
      setCustomAllergens(prev => [...prev, text]);
    }
    setCustomInputText('');
    if (valueToAdd) {
      setAllergenSearchQuery('');
    }
  };

  const removeCustomAllergen = (item: string) => {
    setCustomAllergens(prev => prev.filter(a => a !== item));
  };

  // Filtered allergens from master database
  const filteredAllergens = useMemo(() => {
    const query = allergenSearchQuery.trim().toLowerCase();

    return ALLERGENS_DATABASE.filter(item => {
      if (allergenCategory === 'popular') {
        if (!item.isCommonAllergen) return false;
      } else if (allergenCategory !== 'all') {
        if (item.categoryId !== allergenCategory) return false;
      }

      if (!query) return true;

      const nameRu = item.name.ru.toLowerCase();
      const nameKa = item.name.ka.toLowerCase();
      const nameEn = item.name.en.toLowerCase();

      const kwRu = item.keywords.ru.some(k => k.toLowerCase().includes(query));
      const kwKa = item.keywords.ka.some(k => k.toLowerCase().includes(query));
      const kwEn = item.keywords.en.some(k => k.toLowerCase().includes(query));

      return nameRu.includes(query) || nameKa.includes(query) || nameEn.includes(query) || kwRu || kwKa || kwEn;
    });
  }, [allergenSearchQuery, allergenCategory]);

  // BMI Calculation
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  const getBmiStatus = (bmiVal: number) => {
    if (bmiVal < 18.5) {
      return {
        label: locale === 'ru' ? 'Дефицит веса' : locale === 'ka' ? 'წონის დეფიციტი' : 'Underweight',
        color: '#38BDF8',
      };
    }
    if (bmiVal <= 24.9) {
      return {
        label: locale === 'ru' ? 'Нормальный вес' : locale === 'ka' ? 'ნორმალური წონა' : 'Healthy Weight',
        color: '#10B981',
      };
    }
    if (bmiVal <= 29.9) {
      return {
        label: locale === 'ru' ? 'Избыточный вес' : locale === 'ka' ? 'ზედმეტი წონა' : 'Overweight',
        color: '#F59E0B',
      };
    }
    return {
      label: locale === 'ru' ? 'Высокий индекс' : locale === 'ka' ? 'მაღალი ინდექსი' : 'Obese',
      color: '#EF4444',
    };
  };
  const bmiInfo = getBmiStatus(bmi);

  // Basal Metabolic Rate (BMR)
  const bmr = Math.round(
    10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161)
  );

  // Calculations for step 5
  const calculateResult = () => {
    let activityMultiplier = 1.375;
    if (activity === 'sedentary') activityMultiplier = 1.2;
    if (activity === 'high') activityMultiplier = 1.55;
    if (activity === 'pro_athlete') activityMultiplier = 1.75;

    const maintenanceCalories = Math.round(bmr * activityMultiplier);

    const progSlim = programs.find(p => p.slug === 'slim') || programs[0];
    const progBalance = programs.find(p => p.slug === 'balance') || programs[1];
    const progPower = programs.find(p => p.slug === 'power') || programs[2];
    const progDetox = programs.find(p => p.slug === 'detox') || programs[3];

    let targetCalories = maintenanceCalories;
    let matchedProgram = progBalance;
    let goalPercentText = '0%';

    if (goal === 'weight_loss') {
      targetCalories = Math.max(1000, Math.round(maintenanceCalories * 0.82));
      matchedProgram = progSlim;
      goalPercentText = '-18%';
    } else if (goal === 'muscle_gain') {
      targetCalories = Math.min(3200, Math.round(maintenanceCalories * 1.15));
      matchedProgram = progPower;
      goalPercentText = '+15%';
    } else if (goal === 'tourist_detox') {
      targetCalories = 1000;
      matchedProgram = progDetox;
      goalPercentText = locale === 'ru' ? 'Детокс' : locale === 'ka' ? 'დეტოქსი' : 'Detox';
    } else {
      targetCalories = maintenanceCalories;
      matchedProgram = progBalance;
      goalPercentText = locale === 'ru' ? 'Баланс' : locale === 'ka' ? 'ბალანსი' : 'Balance';
    }

    // Macro distributions
    let proteinPct = 0.3;
    let fatPct = 0.25;
    let carbsPct = 0.45;

    if (goal === 'muscle_gain') {
      proteinPct = 0.35;
      fatPct = 0.2;
      carbsPct = 0.45;
    } else if (goal === 'weight_loss') {
      proteinPct = 0.35;
      fatPct = 0.25;
      carbsPct = 0.4;
    } else if (goal === 'tourist_detox') {
      proteinPct = 0.15;
      fatPct = 0.2;
      carbsPct = 0.65;
    }

    const proteinGrams = Math.round((targetCalories * proteinPct) / 4);
    const fatGrams = Math.round((targetCalories * fatPct) / 9);
    const carbsGrams = Math.round((targetCalories * carbsPct) / 4);

    const waterLiters = Math.round(weightKg * 0.033 * 10) / 10;
    const weightDiff = Math.abs(weightKg - targetWeightKg);
    const estimatedWeeks = weightDiff > 0 ? Math.max(2, Math.round(weightDiff / 0.7)) : 0;

    return {
      maintenanceCalories,
      targetCalories,
      goalPercentText,
      proteinGrams,
      fatGrams,
      carbsGrams,
      proteinPct: Math.round(proteinPct * 100),
      fatPct: Math.round(fatPct * 100),
      carbsPct: Math.round(carbsPct * 100),
      matchedProgram,
      waterLiters,
      weightDiff,
      estimatedWeeks,
    };
  };

  const results = calculateResult();

  const handleApplyResult = () => {
    const daysCount = format === 'trial' ? 2 : format === 'month' ? 30 : 12;
    const price =
      daysCount === 2
        ? results.matchedProgram.prices.trialTwoDays
        : daysCount === 30
        ? results.matchedProgram.prices.thirtyDays
        : results.matchedProgram.prices.twelveDays;

    const allExcludedList = [...allergies, ...customAllergens];

    setCart({
      id: `quiz-order-${Date.now()}`,
      type: 'subscription',
      programId: results.matchedProgram.id,
      programTitle: results.matchedProgram.title[locale],
      daysDuration: daysCount,
      dailyCalories: results.targetCalories,
      dailyPrice: Math.round(price / daysCount),
      totalPriceGEL: price,
      deliverySlot: 'morning',
      deliveryZoneId: 'zone-batumi-center',
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      allergiesStopList: allExcludedList,
    });

    showToast(results.matchedProgram.title[locale]);
    setIsQuizOpen(false);
    setIsCartOpen(true);
  };

  const weightDelta = targetWeightKg - weightKg;

  // Bezel Dial Progress calculation (scale 800 - 3200 kcal)
  const dialRadius = 75;
  const dialCircumference = 2 * Math.PI * dialRadius;
  const dialProgress = Math.min(1, Math.max(0, (results.targetCalories - 800) / 2400));
  const dialOffset = dialCircumference - dialProgress * dialCircumference;

  if (!isQuizOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsQuizOpen(false)}>
      <div
        className="modal-content-card quiz-modal-window"
        style={{
          maxWidth: '680px',
          width: '100%',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="quiz-modal-header">
          {/* Top Close Button */}
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setIsQuizOpen(false)}
            aria-label="Close"
          >
            <IconClose size={20} />
          </button>

          {/* Progress Bar & Header */}
          <div style={{ paddingRight: '42px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.quiz.step} {step} {t.quiz.of} 5
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(step / 5) * 100}%`,
                  background: 'linear-gradient(90deg, #84CC16 0%, #10B981 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="quiz-modal-body">
          {/* ========================================================
              STEP 1: GOAL SELECTION
              ======================================================== */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '6px' }}>
                {t.quiz.step1Title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
                {t.quiz.subtitle}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Weight loss */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: goal === 'weight_loss' ? '2px solid #84CC16' : '1.5px solid #E2E8F0',
                    background: goal === 'weight_loss' ? '#FAFEF5' : '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: goal === 'weight_loss' ? '0 4px 14px rgba(132, 204, 22, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setGoal('weight_loss')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
                    <IconFire size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-heading)' }}>{t.quiz.goalOptions.lossTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.quiz.goalOptions.lossDesc}</div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: goal === 'weight_loss' ? '5px solid #84CC16' : '2px solid #CBD5E1', flexShrink: 0 }} />
                </div>

                {/* Balance */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: goal === 'balance' ? '2px solid #84CC16' : '1.5px solid #E2E8F0',
                    background: goal === 'balance' ? '#FAFEF5' : '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: goal === 'balance' ? '0 4px 14px rgba(132, 204, 22, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setGoal('balance')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
                    <IconZap size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-heading)' }}>{t.quiz.goalOptions.balanceTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.quiz.goalOptions.balanceDesc}</div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: goal === 'balance' ? '5px solid #84CC16' : '2px solid #CBD5E1', flexShrink: 0 }} />
                </div>

                {/* Muscle Gain */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: goal === 'muscle_gain' ? '2px solid #84CC16' : '1.5px solid #E2E8F0',
                    background: goal === 'muscle_gain' ? '#FAFEF5' : '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: goal === 'muscle_gain' ? '0 4px 14px rgba(132, 204, 22, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setGoal('muscle_gain')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
                    <IconDumbbell size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-heading)' }}>{t.quiz.goalOptions.muscleTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.quiz.goalOptions.muscleDesc}</div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: goal === 'muscle_gain' ? '5px solid #84CC16' : '2px solid #CBD5E1', flexShrink: 0 }} />
                </div>

                {/* Detox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: goal === 'tourist_detox' ? '2px solid #84CC16' : '1.5px solid #E2E8F0',
                    background: goal === 'tourist_detox' ? '#FAFEF5' : '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: goal === 'tourist_detox' ? '0 4px 14px rgba(132, 204, 22, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setGoal('tourist_detox')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                    <IconLeaf size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-heading)' }}>{t.quiz.goalOptions.touristTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.quiz.goalOptions.touristDesc}</div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: goal === 'tourist_detox' ? '5px solid #84CC16' : '2px solid #CBD5E1', flexShrink: 0 }} />
                </div>
              </div>
            </div>
          )}

        {/* ========================================================
            STEP 2: BODY METRICS WITH INTERACTIVE SLIDERS / STEPPERS
            ======================================================== */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
              {t.quiz.step2Title}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {locale === 'ru'
                ? 'Используйте интерактивные ползунки для точного расчета:'
                : locale === 'ka'
                ? 'გამოიყენეთ ინტერაქტიული სლაიდერები ზუსტი გათვლისთვის:'
                : 'Use the interactive sliders for an accurate calculation:'}
            </p>

            {/* Gender Switch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn"
                style={{
                  border: '1.5px solid',
                  borderColor: gender === 'female' ? '#84CC16' : '#E2E8F0',
                  background: gender === 'female' ? '#FAFEF5' : '#FFFFFF',
                  color: gender === 'female' ? '#15803D' : 'var(--text-secondary)',
                  padding: '12px',
                  fontWeight: 800,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onClick={() => setGender('female')}
              >
                <IconUser size={18} />
                <span>{t.quiz.gender.female}</span>
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  border: '1.5px solid',
                  borderColor: gender === 'male' ? '#84CC16' : '#E2E8F0',
                  background: gender === 'male' ? '#FAFEF5' : '#FFFFFF',
                  color: gender === 'male' ? '#15803D' : 'var(--text-secondary)',
                  padding: '12px',
                  fontWeight: 800,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onClick={() => setGender('male')}
              >
                <IconUser size={18} />
                <span>{t.quiz.gender.male}</span>
              </button>
            </div>

            {/* Sliders Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              {/* AGE SLIDER */}
              <div className="quiz-slider-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {t.quiz.ageLabel}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                      {age}{' '}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {locale === 'ru' ? 'лет' : locale === 'ka' ? 'წელი' : 'yrs'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setAge(prev => Math.max(16, prev - 1))}
                    disabled={age <= 16}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={16}
                    max={80}
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="quiz-range-slider"
                  />
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setAge(prev => Math.min(80, prev + 1))}
                    disabled={age >= 80}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* HEIGHT SLIDER */}
              <div className="quiz-slider-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {t.quiz.heightLabel}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                      {heightCm}{' '}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {locale === 'ru' ? 'см' : locale === 'ka' ? 'სმ' : 'cm'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setHeightCm(prev => Math.max(130, prev - 1))}
                    disabled={heightCm <= 130}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={130}
                    max={220}
                    value={heightCm}
                    onChange={e => setHeightCm(Number(e.target.value))}
                    className="quiz-range-slider"
                  />
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setHeightCm(prev => Math.min(220, prev + 1))}
                    disabled={heightCm >= 220}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CURRENT WEIGHT SLIDER */}
              <div className="quiz-slider-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {t.quiz.weightLabel}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                      {weightKg}{' '}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {locale === 'ru' ? 'кг' : locale === 'ka' ? 'კგ' : 'kg'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setWeightKg(prev => Math.max(40, prev - 1))}
                    disabled={weightKg <= 40}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={40}
                    max={160}
                    value={weightKg}
                    onChange={e => setWeightKg(Number(e.target.value))}
                    className="quiz-range-slider"
                  />
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setWeightKg(prev => Math.min(160, prev + 1))}
                    disabled={weightKg >= 160}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* TARGET WEIGHT SLIDER */}
              <div className="quiz-slider-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {t.quiz.targetWeightLabel}
                    </span>
                    {weightDelta !== 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: weightDelta < 0 ? '#DCFCE7' : '#EFF6FF',
                          color: weightDelta < 0 ? '#15803D' : '#1D4ED8',
                        }}
                      >
                        {weightDelta > 0 ? `+${weightDelta}` : weightDelta} {locale === 'ru' ? 'кг' : locale === 'ka' ? 'კგ' : 'kg'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                      {targetWeightKg}{' '}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {locale === 'ru' ? 'кг' : locale === 'ka' ? 'კგ' : 'kg'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setTargetWeightKg(prev => Math.max(40, prev - 1))}
                    disabled={targetWeightKg <= 40}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={40}
                    max={150}
                    value={targetWeightKg}
                    onChange={e => setTargetWeightKg(Number(e.target.value))}
                    className="quiz-range-slider"
                  />
                  <button
                    type="button"
                    className="quiz-stepper-btn"
                    onClick={() => setTargetWeightKg(prev => Math.min(150, prev + 1))}
                    disabled={targetWeightKg >= 150}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Live BMI & Metabolism Preview Bar */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                marginBottom: '26px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {locale === 'ru' ? 'Индекс массы (BMI)' : locale === 'ka' ? 'სხეულის მასის ინდექსი (BMI)' : 'Body Mass Index (BMI)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)' }}>{bmi}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: bmiInfo.color,
                      background: `${bmiInfo.color}18`,
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {bmiInfo.label}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {locale === 'ru' ? 'Базовый обмен (BMR)' : locale === 'ka' ? 'ბაზალური მეტაბოლიზმი (BMR)' : 'Basal Metabolism (BMR)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)' }}>{bmr}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: ACTIVITY LEVEL
            ======================================================== */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
              {t.quiz.step3Title}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
              {locale === 'ru'
                ? 'Физическая нагрузка определяет суточный расход калорий:'
                : locale === 'ka'
                ? 'ფიზიკური დატვირთვა განსაზღვრავს დღიურ ხარჯს:'
                : 'Physical activity sets your daily caloric expenditure:'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {[
                {
                  key: 'sedentary',
                  label: t.quiz.activities.sedentary,
                  desc: locale === 'ru' ? 'Коэффициент активности x1.2' : locale === 'ka' ? 'აქტივობის კოეფიციენტი x1.2' : 'Activity multiplier x1.2',
                },
                {
                  key: 'moderate',
                  label: t.quiz.activities.moderate,
                  desc: locale === 'ru' ? 'Коэффициент активности x1.375' : locale === 'ka' ? 'აქტივობის კოეფიციენტი x1.375' : 'Activity multiplier x1.375',
                },
                {
                  key: 'high',
                  label: t.quiz.activities.high,
                  desc: locale === 'ru' ? 'Коэффициент активности x1.55' : locale === 'ka' ? 'აქტივობის კოეფიციენტი x1.55' : 'Activity multiplier x1.55',
                },
                {
                  key: 'pro_athlete',
                  label: t.quiz.activities.proAthlete,
                  desc: locale === 'ru' ? 'Коэффициент активности x1.75' : locale === 'ka' ? 'აქტივობის კოეფიციენტი x1.75' : 'Activity multiplier x1.75',
                },
              ].map(act => {
                const isSelected = activity === act.key;
                return (
                  <div
                    key={act.key}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #84CC16' : '1.5px solid #E2E8F0',
                      background: isSelected ? '#FAFEF5' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isSelected ? '0 4px 16px rgba(132, 204, 22, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setActivity(act.key as any)}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? '#15803D' : 'var(--text-heading)' }}>
                        {act.label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {act.desc}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isSelected ? '#84CC16' : '#F1F5F9',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <IconCheck size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: ALLERGENS & EXCLUSIONS (CONNECTED TO MASTER DB)
            ======================================================== */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShield size={18} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)' }}>
                {t.quiz.step4Title}
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {t.quiz.step4Subtitle}
            </p>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <IconSearch size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                className="config-input-text"
                placeholder={
                  locale === 'ru'
                    ? 'Поиск: кунжут, орехи, молоко, яйца, рыба, кинза...'
                    : locale === 'ka'
                    ? 'ძებნა: სეზამი, თხილი, რძე, კვერცხი, თევზი, ქინძი...'
                    : 'Search: sesame, nuts, dairy, eggs, fish, cilantro...'
                }
                value={allergenSearchQuery}
                onChange={e => setAllergenSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', height: '42px', fontSize: '13px' }}
              />
              {allergenSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAllergenSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <IconClose size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '14px',
              }}
            >
              {ALLERGEN_CATEGORIES.map(cat => {
                const isActive = allergenCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAllergenCategory(cat.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: isActive ? '1.5px solid #84CC16' : '1px solid #E2E8F0',
                      background: isActive ? '#84CC16' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label[locale]}
                  </button>
                );
              })}
            </div>

            {/* Master Allergens List Scrollable Grid */}
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '12px',
                background: '#F8FAFC',
                marginBottom: '14px',
              }}
            >
              {filteredAllergens.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {filteredAllergens.map(item => {
                    const isChecked = allergies.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleAllergy(item.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: isChecked ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                          background: isChecked ? '#ECFDF5' : '#FFFFFF',
                          color: isChecked ? '#065F46' : '#1E293B',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '6px' }}>
                          {item.name[locale]}
                        </span>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isChecked ? '1px solid #10B981' : '1px solid #CBD5E1',
                            background: isChecked ? '#10B981' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                          }}
                        >
                          {isChecked && <IconCheck size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94A3B8', fontSize: '13px' }}>
                  {locale === 'ru' ? 'Ничего не найдено. Добавьте свой продукт ниже:' : 'No allergens found. Add custom item below:'}
                </div>
              )}
            </div>

            {/* Custom Exclusions Form */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                className="config-input-text"
                placeholder={
                  locale === 'ru'
                    ? 'Свой продукт (например: кинза, чеснок, мед)...'
                    : locale === 'ka'
                    ? 'საკუთარი ინგრედიენტი (მაგ: ქინძი, ნიორი, თაფლი)...'
                    : 'Custom ingredient (e.g. cilantro, garlic, honey)...'
                }
                value={customInputText}
                onChange={e => setCustomInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                style={{ height: '40px', fontSize: '13px' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddCustom()}
                disabled={!customInputText.trim()}
                style={{ height: '40px', padding: '0 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                <IconPlus size={14} />
                <span>{locale === 'ru' ? 'Добавить' : locale === 'ka' ? 'დამატება' : 'Add'}</span>
              </button>
            </div>

            {/* Selected Tags Display */}
            {(allergies.length > 0 || customAllergens.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {allergies.map(id => {
                  const item = ALLERGENS_DATABASE.find(a => a.id === id);
                  return (
                    <span
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#065F46',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {item ? item.name[locale] : id}
                      <button
                        type="button"
                        onClick={() => toggleAllergy(id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: 0 }}
                      >
                        <IconClose size={12} />
                      </button>
                    </span>
                  );
                })}
                {customAllergens.map(custom => (
                  <span
                    key={custom}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1E40AF',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {custom}
                    <button
                      type="button"
                      onClick={() => removeCustomAllergen(custom)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', padding: 0 }}
                    >
                      <IconClose size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STEP 5: COMPREHENSIVE PERSONALIZED RECOMMENDATIONS
            ======================================================== */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '4px' }}>
              {t.quiz.result.heading}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              {locale === 'ru'
                ? 'Персональная программа питания, составленная диетологом с учетом вашего метаболизма:'
                : locale === 'ka'
                ? 'პერსონალური კვების პროგრამა შედგენილი დიეტოლოგის მიერ:'
                : 'Personalized meal plan calibrated for your metabolism:'}
            </p>

            {/* Circular Bezel Gauge & Calories Readout */}
            <div
              style={{
                background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
                border: '1.5px solid #E2E8F0',
                borderRadius: '20px',
                padding: '24px 20px',
                textAlign: 'center',
                marginBottom: '18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Bezel SVG Meter */}
              <div className="quiz-bezel-meter-wrap">
                <svg className="quiz-bezel-svg" viewBox="0 0 190 190">
                  <defs>
                    <linearGradient id="bezel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#84CC16" />
                      <stop offset="50%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="95"
                    cy="95"
                    r={dialRadius}
                    className="quiz-bezel-bg-ring"
                  />
                  <circle
                    cx="95"
                    cy="95"
                    r={dialRadius}
                    className="quiz-bezel-progress-ring"
                    style={{
                      strokeDasharray: dialCircumference,
                      strokeDashoffset: dialOffset,
                    }}
                  />
                </svg>

                <div className="quiz-bezel-center-data">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {locale === 'ru' ? 'ЦЕЛЬ' : locale === 'ka' ? 'მიზანი' : 'TARGET'}
                  </span>
                  <div style={{ fontSize: '34px', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                    {results.targetCalories}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
                    {locale === 'ru' ? 'ккал / день' : locale === 'ka' ? 'კკალ / დღეში' : 'kcal / day'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: '#84CC16',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      marginTop: '4px',
                    }}
                  >
                    {results.goalPercentText}
                  </span>
                </div>
              </div>

              {/* Matched Program Title & Target */}
              <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {t.quiz.result.recommendedProgram}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
                  {results.matchedProgram.title[locale]}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {results.matchedProgram.description[locale]}
                </div>
              </div>

              {/* Macro Row with Percentage Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
                <div style={{ background: '#FFFFFF', padding: '12px 10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#DC2626' }}>
                    {results.proteinGrams}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {t.menu.macros.protein} ({results.proteinPct}%)
                  </div>
                  <div className="quiz-macro-bar-wrap">
                    <div className="quiz-macro-bar-fill" style={{ width: `${results.proteinPct}%`, background: '#DC2626' }} />
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '12px 10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#D97706' }}>
                    {results.fatGrams}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {t.menu.macros.fat} ({results.fatPct}%)
                  </div>
                  <div className="quiz-macro-bar-wrap">
                    <div className="quiz-macro-bar-fill" style={{ width: `${results.fatPct}%`, background: '#D97706' }} />
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '12px 10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#2563EB' }}>
                    {results.carbsGrams}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {t.menu.macros.carbs} ({results.carbsPct}%)
                  </div>
                  <div className="quiz-macro-bar-wrap">
                    <div className="quiz-macro-bar-fill" style={{ width: `${results.carbsPct}%`, background: '#2563EB' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendations Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {locale === 'ru' ? 'Водный баланс' : locale === 'ka' ? 'წყლის ბალანსი' : 'Water intake'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
                  {results.waterLiters} {locale === 'ru' ? 'л воды / день' : locale === 'ka' ? 'ლ წყალი / დღე' : 'L water / day'}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {locale === 'ru' ? 'Прогноз цели' : locale === 'ka' ? 'მიზნის მიღწევა' : 'Goal timeline'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#15803D', marginTop: '2px' }}>
                  {results.estimatedWeeks > 0
                    ? `~${results.estimatedWeeks} ${locale === 'ru' ? 'недель' : locale === 'ka' ? 'კვირა' : 'weeks'}`
                    : locale === 'ru' ? 'Поддержание' : locale === 'ka' ? 'შენარჩუნება' : 'Maintenance'}
                </div>
              </div>
            </div>

            {/* Program Duration Selector with Pricing */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {t.quiz.step5Title}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1.5px solid',
                    borderColor: format === 'trial' ? '#84CC16' : '#E2E8F0',
                    background: format === 'trial' ? '#FAFEF5' : '#FFFFFF',
                    color: format === 'trial' ? '#15803D' : 'var(--text-heading)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '12px 6px',
                    borderRadius: '12px',
                  }}
                  onClick={() => setFormat('trial')}
                >
                  <span>{locale === 'ru' ? '2 дня (тест)' : locale === 'ka' ? '2 დღე (ტესტი)' : '2 Days (Trial)'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: '#0F172A' }}>
                    {results.matchedProgram.prices.trialTwoDays} GEL
                  </span>
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1.5px solid',
                    borderColor: format === 'standard' ? '#84CC16' : '#E2E8F0',
                    background: format === 'standard' ? '#FAFEF5' : '#FFFFFF',
                    color: format === 'standard' ? '#15803D' : 'var(--text-heading)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '12px 6px',
                    borderRadius: '12px',
                  }}
                  onClick={() => setFormat('standard')}
                >
                  <span>{locale === 'ru' ? '12 дней (-10%)' : locale === 'ka' ? '12 დღე (-10%)' : '12 Days (-10%)'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: '#0F172A' }}>
                    {results.matchedProgram.prices.twelveDays} GEL
                  </span>
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1.5px solid',
                    borderColor: format === 'month' ? '#84CC16' : '#E2E8F0',
                    background: format === 'month' ? '#FAFEF5' : '#FFFFFF',
                    color: format === 'month' ? '#15803D' : 'var(--text-heading)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '12px 6px',
                    borderRadius: '12px',
                  }}
                  onClick={() => setFormat('month')}
                >
                  <span>{locale === 'ru' ? '30 дней (-20%)' : locale === 'ka' ? '30 დღე (-20%)' : '30 Days (-20%)'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: '#0F172A' }}>
                    {results.matchedProgram.prices.thirtyDays} GEL
                  </span>
                </button>
              </div>
            </div>

            {/* Medical / Health Disclaimer Alert */}
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <div style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }}>
                <IconShield size={16} />
              </div>
              <div style={{ fontSize: '11.5px', color: '#92400E', lineHeight: 1.5 }}>
                {t.quiz.result.medicalDisclaimer}
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '15px',
                fontWeight: 800,
                justifyContent: 'center',
                borderRadius: '14px',
                boxShadow: '0 4px 16px rgba(132, 204, 22, 0.35)',
              }}
              onClick={handleApplyResult}
            >
              <IconSparkles size={18} />
              <span>{t.quiz.result.selectThisPlan}</span>
              <IconArrowRight size={16} />
            </button>
          </div>
        )}

        </div>

        {/* ========================================================
            STICKY MODAL FOOTER NAVIGATION (PREV / NEXT)
            ======================================================== */}
        {step < 5 && (
          <div className="quiz-modal-footer">
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
                style={{ borderRadius: '12px', padding: '12px 18px', fontWeight: 700, flexShrink: 0 }}
              >
                <IconArrowLeft size={16} />
                <span>{t.quiz.back}</span>
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              style={{
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 800,
                flex: 1,
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(132, 204, 22, 0.35)'
              }}
            >
              <span>{step === 4 ? t.quiz.seeResult : t.quiz.next}</span>
              <IconArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
