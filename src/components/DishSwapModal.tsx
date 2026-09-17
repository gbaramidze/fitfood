'use client';

import React, { useState } from 'react';
import { Dish, MealType } from '@/types';
import { dishes } from '@/data/dishes';
import { useLanguage } from '@/context/LanguageContext';
import {
  IconClose,
  IconCheck,
  IconFlame,
  IconSparkles,
  IconRepeat,
  IconAlertTriangle,
  IconInfo,
} from '@/components/Icons';

interface DishSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDish: Dish | null;
  mealSlotTitle: string;
  clientAllergens?: string[];
  onSelectDish: (dish: Dish) => void;
}

export const DishSwapModal: React.FC<DishSwapModalProps> = ({
  isOpen,
  onClose,
  currentDish,
  mealSlotTitle,
  clientAllergens = [],
  onSelectDish,
}) => {
  const { locale } = useLanguage();
  const [filterQuery, setFilterQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'high_protein'>('all');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentDish) return null;

  // Find all dishes of the same mealType (or dessert/snack flexibility)
  const isSnackLike = currentDish.mealType === 'snack' || currentDish.mealType === 'dessert' || currentDish.mealType === 'smoothie';
  
  const candidateDishes = dishes.filter(d => {
    if (isSnackLike) {
      return d.mealType === 'snack' || d.mealType === 'dessert' || d.mealType === 'smoothie';
    }
    return d.mealType === currentDish.mealType;
  });

  // Filter candidates
  const filteredDishes = candidateDishes.filter(d => {
    // Text search
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const matchName = d.name[locale]?.toLowerCase().includes(q) || d.name.ru.toLowerCase().includes(q);
      const matchDesc = d.description[locale]?.toLowerCase().includes(q) || d.description.ru.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    // Safe filter: excludes anything containing client's allergens
    if (activeFilter === 'safe' && clientAllergens.length > 0) {
      const hasConflict = d.allergens.some(a => 
        clientAllergens.some(ca => a.toLowerCase().includes(ca.toLowerCase()) || ca.toLowerCase().includes(a.toLowerCase()))
      );
      if (hasConflict) return false;
    }

    // High protein filter: > 28g protein
    if (activeFilter === 'high_protein' && d.macros.protein < 28) {
      return false;
    }

    return true;
  });

  const checkDishHasAllergen = (dish: Dish) => {
    if (!clientAllergens || clientAllergens.length === 0) return false;
    return dish.allergens.some(a => 
      clientAllergens.some(ca => a.toLowerCase().includes(ca.toLowerCase()) || ca.toLowerCase().includes(a.toLowerCase()))
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-window-modern dish-swap-modal-window"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="dish-swap-header">
          <div>
            <div className="badge badge-emerald" style={{ marginBottom: '6px' }}>
              <IconRepeat size={14} />
              <span>{locale === 'ru' ? 'Выбор замены блюда' : locale === 'ka' ? 'კერძის შეცვლა' : 'Meal Replacement'}</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              {mealSlotTitle}: {currentDish.name[locale]}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              {locale === 'ru'
                ? 'Выберите любое понравившееся альтернативное блюдо из нашего авторского меню'
                : locale === 'ka'
                ? 'შეარჩიეთ ნებისმიერი სასურველი ალტერნატიული კერძი ჩვენი შეფ-მენიუდან'
                : 'Choose any chef alternative for this meal slot'}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={locale === 'ru' ? 'Закрыть' : locale === 'ka' ? 'დახურვა' : 'Close'}
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="dish-swap-filter-bar">
          <div className="dish-swap-filter-pills">
            <button
              type="button"
              className={`swap-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              {locale === 'ru' ? 'Все варианты' : locale === 'ka' ? 'ყველა' : 'All'} ({candidateDishes.length})
            </button>
            {clientAllergens.length > 0 && (
              <button
                type="button"
                className={`swap-filter-pill ${activeFilter === 'safe' ? 'active' : ''}`}
                onClick={() => setActiveFilter('safe')}
              >
                {locale === 'ru' ? 'Без моих аллергенов' : locale === 'ka' ? 'ალერგენების გარეშე' : 'Without Allergens'}
              </button>
            )}
            <button
              type="button"
              className={`swap-filter-pill ${activeFilter === 'high_protein' ? 'active' : ''}`}
              onClick={() => setActiveFilter('high_protein')}
            >
              {locale === 'ru' ? 'Высокий белок (28г+)' : locale === 'ka' ? 'მაღალი ცილა (28გ+)' : 'High Protein (28g+)'}
            </button>
          </div>

          <input
            type="text"
            className="config-input-text"
            placeholder={locale === 'ru' ? 'Поиск блюда...' : locale === 'ka' ? 'კერძის ძიება...' : 'Search dish...'}
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            style={{ padding: '8px 14px', fontSize: '13px', width: '200px' }}
          />
        </div>

        {/* Dish List */}
        <div className="dish-swap-list-body">
          {filteredDishes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
              <p style={{ fontSize: '15px', fontWeight: 600 }}>
                {locale === 'ru' ? 'Блюд по заданному фильтру не найдено' : locale === 'ka' ? 'შესაბამისი კერძი ვერ მოიძებნა' : 'No dishes matching filter'}
              </p>
            </div>
          ) : (
            <div className="dish-swap-grid">
              {filteredDishes.map((dish) => {
                const isCurrent = dish.id === currentDish.id;
                const hasAllergenWarning = checkDishHasAllergen(dish);
                const calDiff = dish.macros.calories - currentDish.macros.calories;

                return (
                  <div
                    key={dish.id}
                    className={`dish-swap-card ${isCurrent ? 'selected' : ''} ${hasAllergenWarning ? 'has-allergen' : ''}`}
                    onClick={() => {
                      onSelectDish(dish);
                      onClose();
                    }}
                  >
                    <div className="dish-swap-card-img-wrap">
                      <img src={dish.image} alt={dish.name[locale]} loading="lazy" />
                      {isCurrent && (
                        <div className="dish-swap-current-badge">
                          <IconCheck size={14} />
                          <span>{locale === 'ru' ? 'Текущее' : locale === 'ka' ? 'მიმდინარე' : 'Current'}</span>
                        </div>
                      )}
                      {hasAllergenWarning && (
                        <div className="dish-swap-warning-badge" title={locale === 'ru' ? 'Содержит ингредиент из вашего стоп-листа' : locale === 'ka' ? 'შეიცავს ალერგენს თქვენი სიიდან' : 'Contains allergen from your stop-list'}>
                          <IconAlertTriangle size={13} />
                          <span>{locale === 'ru' ? 'Аллерген' : locale === 'ka' ? 'ალერგენი' : 'Allergen'}</span>
                        </div>
                      )}
                    </div>

                    <div className="dish-swap-card-content">
                      <div className="dish-swap-card-top">
                        <h4 className="dish-swap-card-title">{dish.name[locale]}</h4>
                        <p className="dish-swap-card-desc">{dish.description[locale]}</p>
                      </div>

                      <div className="dish-swap-card-bottom">
                        <div className="dish-swap-macros-row">
                          <span className="cal-val">{dish.macros.calories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</span>
                          {calDiff !== 0 && !isCurrent && (
                            <span className={`cal-diff ${calDiff > 0 ? 'plus' : 'minus'}`}>
                              {calDiff > 0 ? `+${calDiff}` : `${calDiff}`}
                            </span>
                          )}
                          <span className="dot">•</span>
                          <span>{dish.macros.protein}{locale === 'ru' ? 'Б' : locale === 'ka' ? 'ც' : 'P'}</span>
                          <span className="dot">•</span>
                          <span>{dish.macros.fat}{locale === 'ru' ? 'Ж' : locale === 'ka' ? 'ცხ' : 'F'}</span>
                          <span className="dot">•</span>
                          <span>{dish.macros.carbs}{locale === 'ru' ? 'У' : locale === 'ka' ? 'ნ' : 'C'}</span>
                          <span className="dot">•</span>
                          <span>{dish.macros.weightGrams}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}</span>
                        </div>

                        <button
                          type="button"
                          className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'} dish-swap-select-btn`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDish(dish);
                            onClose();
                          }}
                        >
                          {isCurrent ? (
                            <>
                              <IconCheck size={16} />
                              <span>{locale === 'ru' ? 'Выбрано' : locale === 'ka' ? 'არჩეულია' : 'Selected'}</span>
                            </>
                          ) : (
                            <>
                              <IconRepeat size={16} />
                              <span>{locale === 'ru' ? 'Выбрать' : locale === 'ka' ? 'არჩევა' : 'Choose'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
