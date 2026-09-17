'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { programs } from '@/data/programs';
import { dishes } from '@/data/dishes';
import { Program, DayOfWeek, Dish } from '@/types';
import {
  IconFlame,
  IconZap,
  IconDumbbell,
  IconLeaf,
  IconTruck,
  IconInfo,
  IconGift,
  IconRepeat,
  IconCheck,
  IconClose,
  IconAlertTriangle,
  IconShield,
  IconPlus,
} from '@/components/Icons';
import { DishModal } from '@/components/DishModal';
import { DishSwapModal } from '@/components/DishSwapModal';
import { AllergensModal } from '@/components/AllergensModal';
import { ALLERGENS_DATABASE } from '@/data/allergensList';

const dayKeys: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const dayLabelsRu: Record<DayOfWeek, string> = {
  mon: 'Пн 21.09',
  tue: 'Вт 22.09',
  wed: 'Ср 23.09',
  thu: 'Чт 24.09',
  fri: 'Пт 25.09',
  sat: 'Сб 26.09',
  sun: 'Вс 27.09',
};

const dayLabelsKa: Record<DayOfWeek, string> = {
  mon: 'ორშ 21',
  tue: 'სამშ 22',
  wed: 'ოთხშ 23',
  thu: 'ხუთშ 24',
  fri: 'პარ 25',
  sat: 'შაბ 26',
  sun: 'კვი 27',
};

const dayLabelsEn: Record<DayOfWeek, string> = {
  mon: 'Mon 21',
  tue: 'Tue 22',
  wed: 'Wed 23',
  thu: 'Thu 24',
  fri: 'Fri 25',
  sat: 'Sat 26',
  sun: 'Sun 27',
};

const calorieOptionsByProgram: Record<string, Array<{ cal: number; meals: number }>> = {
  'prog-slim': [
    { cal: 750, meals: 3 },
    { cal: 1000, meals: 4 },
    { cal: 1250, meals: 4 },
    { cal: 1500, meals: 5 },
  ],
  'prog-balance': [
    { cal: 1600, meals: 5 },
    { cal: 1800, meals: 5 },
    { cal: 2000, meals: 5 },
  ],
  'prog-power': [
    { cal: 2200, meals: 6 },
    { cal: 2500, meals: 6 },
    { cal: 3000, meals: 6 },
  ],
  'prog-detox': [
    { cal: 900, meals: 6 },
    { cal: 1100, meals: 6 },
  ],
};

export const ProgramsSection: React.FC = () => {
  const { locale } = useLanguage();
  const { setCart, setIsCartOpen, showToast } = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState<Program>(programs[0]);
  const [selectedCalories, setSelectedCalories] = useState<number>(1000);
  const [durationDays, setDurationDays] = useState<number>(12);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon');
  const [cheatMeal, setCheatMeal] = useState(false);

  // Allergens & Stop-list State
  const [isAllergensModalOpen, setIsAllergensModalOpen] = useState(false);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);

  // Swaps State: key format `${selectedDay}-${slotIndex}` -> Dish
  const [customSwaps, setCustomSwaps] = useState<Record<string, Dish>>({});

  // Modals State
  const [activeDishModal, setActiveDishModal] = useState<Dish | null>(null);
  const [swapModalState, setSwapModalState] = useState<{
    slotIndex: number;
    dish: Dish;
    title: string;
  } | null>(null);

  // Track scroll position to show sticky bar only inside builder
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top <= window.innerHeight * 0.4 && rect.bottom >= 200;
      setIsStickyVisible(inView);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stop list names for cart & checkout
  const selectedAllergenObjects = selectedAllergenIds
    .map(id => ALLERGENS_DATABASE.find(a => a.id === id))
    .filter(Boolean);

  const fullStopList = [
    ...selectedAllergenObjects.map(a => a?.name[locale] || a?.name.ru || ''),
    ...customAllergens,
  ].filter(Boolean);

  const handleAllergensSave = (allergenIds: string[], customList: string[]) => {
    setSelectedAllergenIds(allergenIds);
    setCustomAllergens(customList);
    const count = allergenIds.length + customList.length;
    showToast(
      locale === 'ru'
        ? count > 0 ? `Стоп-лист обновлен (${count} исключений)` : 'Стоп-лист очищен'
        : locale === 'ka'
        ? count > 0 ? `ალერგენების სია განახლდა (${count})` : 'სია გასუფთავდა'
        : count > 0 ? `Stop-list updated (${count} items)` : 'Stop-list cleared'
    );
  };

  const handleRemoveAllergenId = (id: string) => {
    setSelectedAllergenIds(prev => prev.filter(item => item !== id));
  };

  const handleRemoveCustomAllergen = (custom: string) => {
    setCustomAllergens(prev => prev.filter(item => item !== custom));
  };

  // Helper to check if a dish contains any selected allergen or custom exclusion
  const checkDishAllergens = (dish: Dish): { hasAllergen: boolean; matchedNames: string[] } => {
    if (selectedAllergenIds.length === 0 && customAllergens.length === 0) {
      return { hasAllergen: false, matchedNames: [] };
    }

    const matchedNames: string[] = [];
    const dishText = [
      dish.name.ru,
      dish.name.en,
      dish.name.ka,
      ...dish.allergens,
      ...dish.ingredients.ru,
      ...dish.ingredients.en,
      ...dish.ingredients.ka,
    ].join(' ').toLowerCase();

    // Check standard selected allergens
    for (const id of selectedAllergenIds) {
      const item = ALLERGENS_DATABASE.find(a => a.id === id);
      if (!item) continue;

      const allKeywords = [
        item.name.ru,
        item.name.en,
        item.name.ka,
        ...item.keywords.ru,
        ...item.keywords.en,
        ...item.keywords.ka,
      ];

      const isMatch = allKeywords.some(kw => kw && dishText.includes(kw.toLowerCase()));
      if (isMatch) {
        matchedNames.push(item.name[locale] || item.name.ru);
      }
    }

    // Check custom exclusions
    for (const custom of customAllergens) {
      if (custom && dishText.includes(custom.toLowerCase())) {
        matchedNames.push(custom);
      }
    }

    return {
      hasAllergen: matchedNames.length > 0,
      matchedNames: Array.from(new Set(matchedNames)),
    };
  };

  // Handle program switch
  const handleProgramSelect = (prog: Program) => {
    setSelectedProgram(prog);
    const options = calorieOptionsByProgram[prog.id] || [];
    if (options.length > 0) {
      setSelectedCalories(options[0].cal);
    }
  };

  // Target meals count for current calorie selection
  const currentOption = (calorieOptionsByProgram[selectedProgram.id] || []).find(o => o.cal === selectedCalories);
  const targetMealsCount = currentOption?.meals || 4;

  // Price calculations
  let basePrice = selectedProgram.prices.twelveDays;
  let oldPrice = 0;

  if (durationDays === 2) {
    basePrice = selectedProgram.prices.trialTwoDays;
    oldPrice = Math.round(basePrice * 1.05);
  } else if (durationDays === 6) {
    basePrice = selectedProgram.prices.sixDays;
    oldPrice = Math.round(basePrice * 1.08);
  } else if (durationDays === 12) {
    basePrice = selectedProgram.prices.twelveDays;
    oldPrice = Math.round(basePrice * 1.15);
  } else if (durationDays === 24) {
    basePrice = selectedProgram.prices.twentyFourDays;
    oldPrice = Math.round(basePrice * 1.22);
  } else if (durationDays === 30) {
    basePrice = selectedProgram.prices.thirtyDays;
    oldPrice = Math.round(basePrice * 1.30);
  }

  const dailyPrice = Math.round(basePrice / durationDays);
  const bonusPoints = Math.round(basePrice * 0.05);

  // Default day dishes filtered
  const rawDayDishes = dishes.filter(d => d.day === selectedDay);

  // Generate exact N dishes matching targetMealsCount
  const defaultDayDishes: Dish[] = [];
  if (targetMealsCount === 3) {
    // 3 meals: breakfast, lunch, dinner
    const b = rawDayDishes.find(d => d.mealType === 'breakfast') || rawDayDishes[0];
    const l = rawDayDishes.find(d => d.mealType === 'lunch') || rawDayDishes[1];
    const d = rawDayDishes.find(d => d.mealType === 'dinner') || rawDayDishes[2];
    if (b) defaultDayDishes.push(b);
    if (l) defaultDayDishes.push(l);
    if (d) defaultDayDishes.push(d);
  } else if (targetMealsCount === 4) {
    // 4 meals: breakfast, snack, lunch, dinner
    const b = rawDayDishes.find(d => d.mealType === 'breakfast') || rawDayDishes[0];
    const s = rawDayDishes.find(d => d.mealType === 'snack' || d.mealType === 'dessert') || rawDayDishes[1];
    const l = rawDayDishes.find(d => d.mealType === 'lunch') || rawDayDishes[2];
    const d = rawDayDishes.find(d => d.mealType === 'dinner') || rawDayDishes[3];
    if (b) defaultDayDishes.push(b);
    if (s) defaultDayDishes.push(s);
    if (l) defaultDayDishes.push(l);
    if (d) defaultDayDishes.push(d);
  } else {
    // 5 or 6 meals
    defaultDayDishes.push(...rawDayDishes.slice(0, targetMealsCount));
    // If not enough in day, fill from other days with dessert/smoothies
    while (defaultDayDishes.length < targetMealsCount) {
      const extra = dishes.find(d => !defaultDayDishes.some(ed => ed.id === d.id));
      if (extra) defaultDayDishes.push(extra);
      else break;
    }
  }

  // Active dishes considering user custom swaps
  const activeDayDishes = defaultDayDishes.map((defaultDish, idx) => {
    const swapKey = `${selectedDay}-${idx}`;
    return customSwaps[swapKey] || defaultDish;
  });

  // Total daily macros from active dishes
  const totalCalories = activeDayDishes.reduce((acc, d) => acc + d.macros.calories, 0);
  const totalProtein = activeDayDishes.reduce((acc, d) => acc + d.macros.protein, 0);
  const totalFat = activeDayDishes.reduce((acc, d) => acc + d.macros.fat, 0);
  const totalCarbs = activeDayDishes.reduce((acc, d) => acc + d.macros.carbs, 0);

  const getMealSlotLabel = (dish: Dish, idx: number) => {
    if (dish.mealType === 'breakfast') {
      return locale === 'ru' ? 'Завтрак' : locale === 'ka' ? 'საუზმე' : 'Breakfast';
    }
    if (dish.mealType === 'snack') {
      return locale === 'ru' ? `Перекус / Снек ${idx > 1 ? '2' : '1'}` : locale === 'ka' ? 'სნექი' : 'Snack';
    }
    if (dish.mealType === 'lunch') {
      return locale === 'ru' ? 'Обед' : locale === 'ka' ? 'სადილი' : 'Lunch';
    }
    if (dish.mealType === 'dinner') {
      return locale === 'ru' ? 'Ужин' : locale === 'ka' ? 'ვახშამი' : 'Dinner';
    }
    if (dish.mealType === 'dessert') {
      return locale === 'ru' ? 'Фитнес-десерт' : locale === 'ka' ? 'დესერტი' : 'Dessert';
    }
    if (dish.mealType === 'smoothie') {
      return locale === 'ru' ? 'Детокс-смузи' : locale === 'ka' ? 'სმუზი' : 'Smoothie';
    }
    return `${locale === 'ru' ? 'Приём' : 'Meal'} ${idx + 1}`;
  };

  const handleSelectSwap = (newDish: Dish) => {
    if (!swapModalState) return;
    const swapKey = `${selectedDay}-${swapModalState.slotIndex}`;
    setCustomSwaps(prev => ({
      ...prev,
      [swapKey]: newDish,
    }));
    showToast(
      locale === 'ru'
        ? `Блюдо заменено на «${newDish.name[locale]}»`
        : `Dish replaced with "${newDish.name[locale]}"`
    );
    setSwapModalState(null);
  };

  const handleOrder = () => {
    const swapIdMap: Record<string, string> = {};
    Object.entries(customSwaps).forEach(([k, dish]) => {
      swapIdMap[k] = dish.id;
    });

    setCart({
      id: `sub-${Date.now()}`,
      type: 'subscription',
      programId: selectedProgram.id,
      programTitle: selectedProgram.title[locale],
      daysDuration: durationDays,
      dailyCalories: selectedCalories,
      dailyPrice,
      totalPriceGEL: basePrice,
      deliverySlot: 'morning',
      deliveryZoneId: 'zone-batumi-center',
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      allergiesStopList: fullStopList,
      customSwaps: swapIdMap,
    });

    showToast(selectedProgram.title[locale]);
    setIsCartOpen(true);
  };

  const getProgramIcon = (progId: string) => {
    switch (progId) {
      case 'prog-slim': return <IconFlame size={20} />;
      case 'prog-balance': return <IconZap size={20} />;
      case 'prog-power': return <IconDumbbell size={20} />;
      case 'prog-detox': return <IconLeaf size={20} />;
      default: return <IconFlame size={20} />;
    }
  };

  return (
    <section className="configurator-section" id="programs" ref={sectionRef}>
      <div className="container">
        {/* Section Title */}
        <div className="section-header-row">
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0F172A',
              color: '#CCFF00',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px'
            }}>
              <span>FITFOOD SMART CONFIGURATOR</span>
            </div>
            <h2 className="section-title">
              {locale === 'ru' ? 'Выбор программы питания' : locale === 'ka' ? 'პროგრამის შერჩევა' : 'Choose Your Meal Plan'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
            <IconTruck size={18} style={{ color: '#10B981' }} />
            <span>{locale === 'ru' ? 'Бесплатная доставка по Батуми' : 'Free Batumi Delivery'}</span>
          </div>
        </div>

        {/* 2-Column Configurator Grid (Level Kitchen Layout) */}
        <div className="configurator-layout-grid">
          {/* Left Column: Options Configurator */}
          <div className="config-options-panel">
            {/* 1. Goal Cards */}
            <div className="config-group">
              <div className="config-group-title">
                <span>{locale === 'ru' ? '1. Ваша цель' : locale === 'ka' ? '1. თქვენი მიზანი' : '1. Your Goal'}</span>
              </div>

              <div className="goal-cards-grid">
                {programs.map((prog) => {
                  const isActive = selectedProgram.id === prog.id;
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => handleProgramSelect(prog)}
                      className={`goal-card-btn ${isActive ? 'active' : ''}`}
                    >
                      <div className="goal-card-icon-badge" style={{ background: prog.accentColor }}>
                        {getProgramIcon(prog.id)}
                      </div>
                      <div className="goal-card-title">
                        {prog.slug.toUpperCase()}
                      </div>
                      <div className="goal-card-desc">
                        {prog.target[locale]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Calorie Volume Selection */}
            <div className="config-group">
              <div className="config-group-title">
                <span>{locale === 'ru' ? '2. Объём калорий и приёмов пищи' : locale === 'ka' ? '2. კალორიები & კვების რაოდენობა' : '2. Daily Calories & Meals'}</span>
                <span className="config-group-subtitle">
                  {selectedCalories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'} ({targetMealsCount} {locale === 'ru' ? 'приёма' : locale === 'ka' ? 'კვება' : 'meals'})
                </span>
              </div>

              <div className="calories-pills-row">
                {(calorieOptionsByProgram[selectedProgram.id] || []).map((opt) => {
                  const isActive = selectedCalories === opt.cal;
                  return (
                    <button
                      key={opt.cal}
                      type="button"
                      onClick={() => setSelectedCalories(opt.cal)}
                      className={`cal-pill-btn ${isActive ? 'active' : ''}`}
                    >
                      <div className="cal-pill-val">{opt.cal} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</div>
                      <div className="cal-pill-sub">{opt.meals} {locale === 'ru' ? 'приёма' : locale === 'ka' ? 'კვება' : 'meals'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Allergens & Stop-List Section */}
            <div className="config-group">
              <div className="config-group-title">
                <span>{locale === 'ru' ? '3. Исключить аллергены и ингредиенты' : locale === 'ka' ? '3. ალერგენები და გამორიცხვა' : '3. Exclude Allergens & Ingredients'}</span>
                {fullStopList.length > 0 && (
                  <span className="badge badge-coral" style={{ fontSize: '11px', textTransform: 'none' }}>
                    {fullStopList.length} {locale === 'ru' ? 'исключено' : locale === 'ka' ? 'გამორიცხულია' : 'excluded'}
                  </span>
                )}
              </div>

              {/* Trigger Box with Modal Launch */}
              <div className={`allergens-trigger-box ${fullStopList.length > 0 ? 'has-selections' : ''}`}>
                <button
                  type="button"
                  className="allergens-trigger-main-btn"
                  onClick={() => setIsAllergensModalOpen(true)}
                >
                  <div className="allergens-trigger-left">
                    <div className="allergens-trigger-icon-badge">
                      <IconShield size={22} />
                    </div>
                    <div className="allergens-trigger-text-block">
                      <div className="allergens-trigger-title">
                        {locale === 'ru'
                          ? 'Исключить аллергены и продукты'
                          : locale === 'ka'
                          ? 'ალერგენების გამორიცხვა'
                          : 'Exclude Allergens & Foods'}
                      </div>
                      <div className="allergens-trigger-desc">
                        {fullStopList.length === 0
                          ? (locale === 'ru'
                              ? 'Без ограничений (нажмите для выбора)'
                              : locale === 'ka'
                              ? 'შეზღუდვის გარეშე (დააჭირეთ ასარჩევად)'
                              : 'No exclusions (click to select)')
                          : (locale === 'ru'
                              ? `Исключено (${fullStopList.length}): ${fullStopList.slice(0, 2).join(', ')}${fullStopList.length > 2 ? ` +${fullStopList.length - 2}` : ''}`
                              : locale === 'ka'
                              ? `გამორიცხულია (${fullStopList.length}): ${fullStopList.slice(0, 2).join(', ')}${fullStopList.length > 2 ? ` +${fullStopList.length - 2}` : ''}`
                              : `Excluded (${fullStopList.length}): ${fullStopList.slice(0, 2).join(', ')}${fullStopList.length > 2 ? ` +${fullStopList.length - 2}` : ''}`)}
                      </div>
                    </div>
                  </div>

                  <span className="allergens-trigger-action-badge">
                    {fullStopList.length === 0
                      ? (locale === 'ru' ? '+ Выбрать' : locale === 'ka' ? '+ არჩევა' : '+ Select')
                      : (locale === 'ru' ? `Изменить (${fullStopList.length})` : locale === 'ka' ? `შეცვლა (${fullStopList.length})` : `Edit (${fullStopList.length})`)}
                  </span>
                </button>

                {/* Selected Items Tags Wrap */}
                {fullStopList.length > 0 && (
                  <div className="allergens-trigger-selected-wrap">
                    {selectedAllergenIds.map(id => {
                      const item = ALLERGENS_DATABASE.find(a => a.id === id);
                      if (!item) return null;
                      return (
                        <span key={item.id} className="allergens-selected-chip">
                          <span>{item.name[locale]}</span>
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => handleRemoveAllergenId(item.id)}
                            title={locale === 'ru' ? 'Удалить' : 'Remove'}
                          >
                            <IconClose size={12} />
                          </button>
                        </span>
                      );
                    })}

                    {customAllergens.map(custom => (
                      <span key={custom} className="allergens-selected-chip" style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}>
                        <span>{custom}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveCustomAllergen(custom)}
                          title={locale === 'ru' ? 'Удалить' : 'Remove'}
                        >
                          <IconClose size={12} />
                        </button>
                      </span>
                    ))}

                    <button
                      type="button"
                      className="allergens-add-more-link"
                      onClick={() => setIsAllergensModalOpen(true)}
                    >
                      {locale === 'ru' ? '+ Добавить ещё' : locale === 'ka' ? '+ კიდევ დამატება' : '+ Add more'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Duration Selector with Real Discounts */}
            <div className="config-group">
              <div className="config-group-title">
                <span>{locale === 'ru' ? '4. Продолжительность' : locale === 'ka' ? '4. ხანგრძლივობა' : '4. Duration'}</span>
                <span className="config-group-subtitle">
                  {durationDays === 2
                    ? (locale === 'ru' ? 'Пробный сет' : locale === 'ka' ? 'სატესტო სეტი' : 'Trial Set')
                    : `${durationDays} ${locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'days'}`}
                </span>
              </div>

              <div className="duration-grid">
                {[
                  { days: 2, discount: '', labelRu: '2 дня', labelKa: '2 დღე' },
                  { days: 6, discount: '-5%', labelRu: '6 дней', labelKa: '6 დღე' },
                  { days: 12, discount: '-10%', labelRu: '12 дней', labelKa: '12 დღე' },
                  { days: 24, discount: '-15%', labelRu: '24 дня', labelKa: '24 დღე' },
                  { days: 30, discount: '-20%', labelRu: '30 дней', labelKa: '30 დღე' },
                ].map((item) => {
                  const isActive = durationDays === item.days;
                  return (
                    <button
                      key={item.days}
                      type="button"
                      onClick={() => setDurationDays(item.days)}
                      className={`duration-pill-btn ${isActive ? 'active' : ''}`}
                    >
                      <div className="dur-val">{locale === 'ka' ? item.labelKa : locale === 'ru' ? item.labelRu : `${item.days} days`}</div>
                      {item.discount && (
                        <div className="dur-badge">{item.discount}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Cheat Meal Toggle */}
            <div className="config-group" style={{ marginBottom: 0 }}>
              <label className="cheat-meal-toggle-row">
                <input
                  type="checkbox"
                  checked={cheatMeal}
                  onChange={(e) => setCheatMeal(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <div className={`custom-switch ${cheatMeal ? 'active' : ''}`}>
                  <div className="switch-knob" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                    {locale === 'ru' ? 'Читмил по воскресеньям' : locale === 'ka' ? 'ჩითმილი კვირა დღეს' : 'Sunday Cheat Meal'} (+0 ₾)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {locale === 'ru'
                      ? 'Замена одного приёма пищи на ПП-пиццу или десерт'
                      : locale === 'ka'
                      ? '1 კვების შეცვლა კვირას ფიტ-პიცით ან დესერტით'
                      : 'Swap 1 meal on Sunday with a fit pizza/dessert'}
                  </div>
                </div>
              </label>
            </div>

            {/* Bonus Gift Banner */}
            <div style={{
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#FEF08A',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconGift size={18} />
              </div>
              <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                {locale === 'ru'
                  ? 'Онлайн-консультация диетолога и тренировки в подарок при заказе от 12 дней!'
                  : locale === 'ka'
                  ? 'დიეტოლოგის უფასო კონსულტაცია და ვარჯიშები 12+ დღიან პაკეტებზე!'
                  : 'Free dietitian review and home workouts on 12+ day plans!'}
              </div>
            </div>

            {/* Health & Safety Advice */}
            <div style={{
              fontSize: '11px',
              color: '#94A3B8',
              lineHeight: 1.5,
              padding: '0 4px',
            }}>
              {locale === 'ru'
                ? 'Результаты индивидуальны. Мы не гарантируем конкретную динамику веса. Перед переходом на специализированный рацион рекомендуется проконсультироваться с эндокринологом.'
                : locale === 'ka'
                ? 'შედეგი ინდივიდუალურია. წონის კლების გარანტია არ გაიცემა. სპეციალურ რაციონზე გადასვლამდე რეკომენდებულია ენდოკრინოლოგის კონსულტაცია.'
                : 'Results vary individually. Weight loss guarantees are not provided. Consulting an endocrinologist before starting a specialized nutrition plan is recommended.'}
            </div>
          </div>

          {/* Right Column: Interactive Meal Showcase for Selected Program */}
          <div className="config-showcase-panel">
            {/* Days Horizontal Tabs */}
            <div className="days-horizontal-scroll">
              {dayKeys.map((day) => {
                const isActive = selectedDay === day;
                const label = locale === 'ka' ? dayLabelsKa[day] : locale === 'ru' ? dayLabelsRu[day] : dayLabelsEn[day];
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`day-tab-pill ${isActive ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Showcase Header with Real-Time Recalculated Macros */}
            <div className="showcase-header-bar">
              <div className="showcase-header-left">
                <span className="showcase-date-badge">
                  {locale === 'ka' ? dayLabelsKa[selectedDay] : locale === 'ru' ? dayLabelsRu[selectedDay] : dayLabelsEn[selectedDay]}
                </span>
                <div className="showcase-macros-pill">
                  <span className="cal-val"><IconFlame size={14} style={{ display: 'inline', verticalAlign: '-2px', color: '#CCFF00', marginRight: '4px' }} />{totalCalories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</span>
                  <span className="macro-sep">•</span>
                  <span>{totalProtein}{locale === 'ru' ? 'г Б' : locale === 'ka' ? 'გ ცილა' : 'g P'}</span>
                  <span>{totalFat}{locale === 'ru' ? 'г Ж' : locale === 'ka' ? 'გ ცხ' : 'g F'}</span>
                  <span>{totalCarbs}{locale === 'ru' ? 'г У' : locale === 'ka' ? 'გ ნახ' : 'g C'}</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                {activeDayDishes.length} {locale === 'ru' ? 'приёма пищи в день' : locale === 'ka' ? 'კვება დღეში' : 'meals per day'}
              </div>
            </div>

            {/* Meal Prep Boxes Grid (Exact N meals displayed for selected calories!) */}
            <div className="dishes-grid-dark">
              {activeDayDishes.map((dish, idx) => {
                const mealSlotTitle = getMealSlotLabel(dish, idx);
                const isSwapped = Boolean(customSwaps[`${selectedDay}-${idx}`]);
                const allergenCheck = checkDishAllergens(dish);
                const containsClientAllergen = allergenCheck.hasAllergen;

                return (
                  <div
                    key={`${dish.id}-${idx}`}
                    className={`dish-card-modern ${containsClientAllergen ? 'dish-has-warning' : ''}`}
                    onClick={() => setActiveDishModal(dish)}
                  >
                    <div className="dish-card-image-wrap">
                      <img
                        src={dish.image}
                        alt={dish.name[locale]}
                        loading="lazy"
                      />
                      <div className="dish-meal-type-tag">
                        {mealSlotTitle}
                      </div>

                      {/* Swap Action Button */}
                      <button
                        type="button"
                        className="dish-swap-trigger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwapModalState({
                            slotIndex: idx,
                            dish,
                            title: mealSlotTitle,
                          });
                        }}
                        title={locale === 'ru' ? 'Заменить это блюдо на другое' : locale === 'ka' ? 'ამ კერძის შეცვლა' : 'Replace this meal'}
                      >
                        <IconRepeat size={13} />
                        <span>{isSwapped ? (locale === 'ru' ? 'Заменено' : locale === 'ka' ? 'შეცვლილია' : 'Swapped') : (locale === 'ru' ? 'Заменить' : locale === 'ka' ? 'შეცვლა' : 'Swap')}</span>
                      </button>

                      <div className="dish-info-btn-badge" title={locale === 'ru' ? 'Состав и КБЖУ' : locale === 'ka' ? 'შემადგენლობა და კალორიები' : 'Recipe & Macros'}>
                        <IconInfo size={14} />
                      </div>
                    </div>

                    <div className="dish-card-content">
                      <h4 className="dish-card-title">
                        {dish.name[locale]}
                      </h4>

                      {containsClientAllergen && (
                        <div className="dish-allergen-alert-inline" title={allergenCheck.matchedNames.join(', ')}>
                          <IconAlertTriangle size={12} />
                          <span>
                            {locale === 'ru'
                              ? `Содержит: ${allergenCheck.matchedNames.slice(0, 2).join(', ')}`
                              : locale === 'ka'
                              ? `შეიცავს: ${allergenCheck.matchedNames.slice(0, 2).join(', ')}`
                              : `Contains: ${allergenCheck.matchedNames.slice(0, 2).join(', ')}`}
                          </span>
                        </div>
                      )}

                      <div className="dish-card-macros-row">
                        <span className="k">{dish.macros.calories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</span>
                        <span>•</span>
                        <span>{dish.macros.protein}{locale === 'ru' ? 'Б' : locale === 'ka' ? 'ც' : 'P'}</span>
                        <span>{dish.macros.fat}{locale === 'ru' ? 'Ж' : locale === 'ka' ? 'ცხ' : 'F'}</span>
                        <span>{dish.macros.carbs}{locale === 'ru' ? 'У' : locale === 'ka' ? 'ნ' : 'C'}</span>
                        <span>•</span>
                        <span>{dish.macros.weightGrams}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Order Bar (Floating CTA - only shown when actively in configurator) */}
      {isStickyVisible && (
        <div className="sticky-order-bar-wrap animate-fade-in">
          <div className="sticky-order-bar">
            <div className="sticky-bar-info">
              <div className="sticky-bar-icon-badge" style={{ background: selectedProgram.accentColor }}>
                {getProgramIcon(selectedProgram.id)}
              </div>
              <div>
                <div className="sticky-bar-title">
                  <span>
                    {selectedProgram.title[locale] || selectedProgram.slug.toUpperCase()} • {selectedCalories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'} ({targetMealsCount} {locale === 'ru' ? 'приёма' : locale === 'ka' ? 'კვება' : 'meals'})
                  </span>
                  <span className="discount-badge-neon" style={{ fontSize: '10px' }}>
                    {durationDays} {locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'days'}
                  </span>
                </div>
                <div className="sticky-bar-sub">
                  {fullStopList.length > 0 ? (
                    <span>
                      {locale === 'ru'
                        ? `Стоп-лист (${fullStopList.length}): ${fullStopList.slice(0, 2).join(', ')}${fullStopList.length > 2 ? '...' : ''}`
                        : locale === 'ka'
                        ? `გამორიცხულია (${fullStopList.length}): ${fullStopList.slice(0, 2).join(', ')}${fullStopList.length > 2 ? '...' : ''}`
                        : `Stop-list (${fullStopList.length}): ${fullStopList.slice(0, 2).join(', ')}${fullStopList.length > 2 ? '...' : ''}`}
                    </span>
                  ) : (
                    <span>
                      {locale === 'ru'
                        ? 'Бесплатная утренняя доставка • Батуми'
                        : locale === 'ka'
                        ? 'უფასო დილის მიტანა • ბათუმი'
                        : 'Free morning delivery • Batumi'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky-bar-actions">
              <div className="sticky-bar-price-wrap">
                <div className="sticky-bar-bonus">
                  +{bonusPoints} ₾ {locale === 'ru' ? 'бонусов' : locale === 'ka' ? 'ქულა' : 'cashback'}
                </div>
                <div className="sticky-bar-price">
                  <span>{basePrice} ₾</span>
                  {oldPrice > basePrice && (
                    <span className="sticky-bar-old-price">{oldPrice} ₾</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '15px' }}
              >
                <span>{locale === 'ru' ? 'Заказать' : locale === 'ka' ? 'შეკვეთა' : 'Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Details Modal */}
      {activeDishModal && (
        <DishModal
          dish={activeDishModal}
          onClose={() => setActiveDishModal(null)}
        />
      )}

      {/* Dish Swap Modal */}
      {swapModalState && (
        <DishSwapModal
          isOpen={Boolean(swapModalState)}
          onClose={() => setSwapModalState(null)}
          currentDish={swapModalState.dish}
          mealSlotTitle={swapModalState.title}
          clientAllergens={fullStopList}
          onSelectDish={handleSelectSwap}
        />
      )}

      {/* Allergens & Stop-List Modal */}
      <AllergensModal
        isOpen={isAllergensModalOpen}
        onClose={() => setIsAllergensModalOpen(false)}
        selectedAllergenIds={selectedAllergenIds}
        customAllergens={customAllergens}
        onSave={handleAllergensSave}
      />
    </section>
  );
};
