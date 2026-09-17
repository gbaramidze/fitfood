'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { dishes } from '@/data/dishes';
import { programs } from '@/data/programs';
import { DayOfWeek, MealType, Dish } from '@/types';
import { IconSparkles, IconInfo, IconRepeat } from '@/components/Icons';
import { DishModal } from '@/components/DishModal';
import { DishSwapModal } from '@/components/DishSwapModal';

const dayKeys: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const dayNamesRu: Record<DayOfWeek, string> = {
  mon: 'Пн 21',
  tue: 'Вт 22',
  wed: 'Ср 23',
  thu: 'Чт 24',
  fri: 'Пт 25',
  sat: 'Сб 26',
  sun: 'Вс 27',
};

const dayNamesKa: Record<DayOfWeek, string> = {
  mon: 'ორშ 21',
  tue: 'სამშ 22',
  wed: 'ოთხშ 23',
  thu: 'ხუთშ 24',
  fri: 'პარ 25',
  sat: 'შაბ 26',
  sun: 'კვი 27',
};

const dayNamesEn: Record<DayOfWeek, string> = {
  mon: 'Mon 21',
  tue: 'Tue 22',
  wed: 'Wed 23',
  thu: 'Thu 24',
  fri: 'Fri 25',
  sat: 'Sat 26',
  sun: 'Sun 27',
};

export const WeeklyMenu: React.FC = () => {
  const { locale } = useLanguage();
  const { setCart, setIsCartOpen, showToast } = useStore();

  const [activeDay, setActiveDay] = useState<DayOfWeek>('mon');
  const [activeCategory, setActiveCategory] = useState<MealType | 'all'>('all');
  const [activeDishModal, setActiveDishModal] = useState<Dish | null>(null);
  const [customSwaps, setCustomSwaps] = useState<Record<string, Dish>>({});
  const [swapModalState, setSwapModalState] = useState<{
    dish: Dish;
    title: string;
    key: string;
  } | null>(null);

  const dayDishes = dishes.filter(d => d.day === activeDay).map(d => customSwaps[d.id] || d);
  const filteredDishes = dayDishes.filter(d => activeCategory === 'all' || d.mealType === activeCategory);

  const totalCalories = dayDishes.reduce((acc, d) => acc + d.macros.calories, 0);
  const totalProtein = dayDishes.reduce((acc, d) => acc + d.macros.protein, 0);
  const totalFat = dayDishes.reduce((acc, d) => acc + d.macros.fat, 0);
  const totalCarbs = dayDishes.reduce((acc, d) => acc + d.macros.carbs, 0);

  const getMealTypeLabel = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return locale === 'ru' ? 'Завтрак' : locale === 'ka' ? 'საუზმე' : 'Breakfast';
      case 'snack':
        return locale === 'ru' ? 'Снек / Полдник' : locale === 'ka' ? 'სამხარი' : 'Snack';
      case 'lunch':
        return locale === 'ru' ? 'Обед' : locale === 'ka' ? 'სადილი' : 'Lunch';
      case 'dinner':
        return locale === 'ru' ? 'Ужин' : locale === 'ka' ? 'ვახშამი' : 'Dinner';
      case 'dessert':
        return locale === 'ru' ? 'Десерт' : locale === 'ka' ? 'დესერტი' : 'Dessert';
      case 'smoothie':
        return locale === 'ru' ? 'Смузи' : locale === 'ka' ? 'სმუზი' : 'Smoothie';
      default:
        return locale === 'ru' ? 'Приём' : locale === 'ka' ? 'კვება' : 'Meal';
    }
  };

  const handleSelectSwap = (newDish: Dish) => {
    if (!swapModalState) return;
    setCustomSwaps(prev => ({
      ...prev,
      [swapModalState.key]: newDish,
    }));
    showToast(
      locale === 'ru'
        ? `Блюдо заменено на «${newDish.name[locale]}»`
        : locale === 'ka'
        ? `კერძი შეიცვალა: «${newDish.name[locale]}»`
        : `Dish replaced with "${newDish.name[locale]}"`
    );
    setSwapModalState(null);
  };

  const handleQuickOrder = () => {
    const defaultProg = programs[0];
    const swapMap: Record<string, string> = {};
    Object.entries(customSwaps).forEach(([k, dish]) => {
      swapMap[k] = dish.id;
    });

    setCart({
      id: `order-menu-${Date.now()}`,
      type: 'subscription',
      programId: defaultProg.id,
      programTitle: defaultProg.title[locale],
      daysDuration: 12,
      dailyCalories: 1500,
      dailyPrice: 35,
      totalPriceGEL: 420,
      deliverySlot: 'morning',
      deliveryZoneId: 'zone-batumi-center',
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      allergiesStopList: [],
      customSwaps: swapMap,
    });

    showToast(defaultProg.title[locale]);
    setIsCartOpen(true);
  };

  return (
    <section className="section-pad" style={{ padding: '40px 0 80px', background: '#F8FAFC' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 40px' }}>
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
            marginBottom: '12px'
          }}>
            <IconSparkles size={14} />
            <span>{locale === 'ru' ? 'МЕНЮ НА 30 ДНЕЙ' : locale === 'ka' ? '30-დღიანი მენიუ' : '30-DAY MENU'}</span>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            {locale === 'ru' ? 'Меню правильного питания на каждый день' : locale === 'ka' ? 'ყოველდღიური ჯანსაღი მენიუ' : 'Daily Chef Meal Prep Menu'}
          </h1>

          <p style={{ fontSize: '16px', color: '#64748B' }}>
            {locale === 'ru'
              ? 'Каждое блюдо готовится из отборных продуктов по технологии су-вид. Нажмите «Заменить», чтобы выбрать альтернативу на свой вкус.'
              : locale === 'ka'
              ? 'ყველა კერძი მზადდება Sous-Vide ტექნოლოგიით. დააჭირეთ «შეცვლა», რათა აირჩიოთ ალტერნატივა თქვენი გემოვნებით.'
              : 'Every meal is prepared with fresh ingredients. Click "Swap" to choose any alternative meal.'}
          </p>
        </div>

        {/* Dark Container Showcase */}
        <div className="dark-menu-showcase" style={{ maxWidth: '1080px', margin: '0 auto' }}>
          {/* Day Switcher */}
          <div className="day-switcher-bar">
            {dayKeys.map((day) => {
              const isActive = activeDay === day;
              const label = locale === 'ka' ? dayNamesKa[day] : locale === 'ru' ? dayNamesRu[day] : dayNamesEn[day];
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`day-pill-btn ${isActive ? 'active' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Daily Macros Total */}
          <div className="daily-macros-header">
            <div className="daily-macros-text">
              <span>{locale === 'ru' ? 'СУТОЧНОЕ КБЖУ:' : locale === 'ka' ? 'დღიური კალორიები:' : 'DAILY MACROS:'}</span>
              <span className="val">{totalCalories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</span>
              <span className="dot">•</span>
              <span>{totalProtein}{locale === 'ru' ? 'г Белки' : locale === 'ka' ? 'გ ცილა' : 'g Protein'}</span>
              <span className="dot">•</span>
              <span>{totalFat}{locale === 'ru' ? 'г Жиры' : locale === 'ka' ? 'გ ცხიმი' : 'g Fat'}</span>
              <span className="dot">•</span>
              <span>{totalCarbs}{locale === 'ru' ? 'г Углеводы' : locale === 'ka' ? 'გ ნახშირწყალი' : 'g Carbs'}</span>
            </div>

            <button
              type="button"
              onClick={handleQuickOrder}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              <span>{locale === 'ru' ? 'Заказать этот рацион' : locale === 'ka' ? 'ამ რაციონის შეკვეთა' : 'Order This Plan'}</span>
            </button>
          </div>

          {/* Dishes Grid */}
          <div className="dishes-grid-dark" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {filteredDishes.map((dish) => {
              const mealTag = getMealTypeLabel(dish.mealType);
              const isSwapped = Boolean(customSwaps[dish.id]);

              return (
                <div
                  key={dish.id}
                  className="dish-card-modern"
                  onClick={() => setActiveDishModal(dish)}
                >
                  <div className="dish-card-image-wrap">
                    <img
                      src={dish.image}
                      alt={dish.name[locale]}
                      loading="lazy"
                    />
                    <div className="dish-meal-type-tag">
                      {mealTag}
                    </div>

                    {/* Swap Trigger Button */}
                    <button
                      type="button"
                      className="dish-swap-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSwapModalState({
                          dish,
                          title: mealTag,
                          key: dish.id,
                        });
                      }}
                      title={locale === 'ru' ? 'Заменить блюдо' : locale === 'ka' ? 'კერძის შეცვლა' : 'Swap meal'}
                    >
                      <IconRepeat size={13} />
                      <span>{isSwapped ? (locale === 'ru' ? 'Заменено' : locale === 'ka' ? 'შეცვლილია' : 'Swapped') : (locale === 'ru' ? 'Заменить' : locale === 'ka' ? 'შეცვლა' : 'Swap')}</span>
                    </button>

                    <div className="dish-info-btn-badge" title={locale === 'ru' ? 'КБЖУ и состав' : locale === 'ka' ? 'შემადგენლობა' : 'Nutrition & Recipe'}>
                      <IconInfo size={14} />
                    </div>
                  </div>

                  <div className="dish-card-content">
                    <h4 className="dish-card-title">
                      {dish.name[locale]}
                    </h4>

                    <div className="dish-card-macros-row">
                      <span className="k">{dish.macros.calories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</span>
                      <span>•</span>
                      <span>{dish.macros.protein}{locale === 'ru' ? 'Б' : locale === 'ka' ? 'ცილა' : 'P'}</span>
                      <span>{dish.macros.fat}{locale === 'ru' ? 'Ж' : locale === 'ka' ? 'ცხ' : 'F'}</span>
                      <span>{dish.macros.carbs}{locale === 'ru' ? 'У' : locale === 'ka' ? 'ნახ' : 'C'}</span>
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

      {/* Dish Modal */}
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
          clientAllergens={[]}
          onSelectDish={handleSelectSwap}
        />
      )}
    </section>
  );
};
