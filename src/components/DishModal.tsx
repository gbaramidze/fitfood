'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { Dish } from '@/types';
import { IconClose, IconStar, IconInfo, IconShield } from '@/components/Icons';

interface DishModalProps {
  dish?: Dish | null;
  onClose?: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({ dish: propDish, onClose: propOnClose }) => {
  const { locale } = useLanguage();
  const { selectedDish, setSelectedDish } = useStore();

  const activeDish = propDish || selectedDish;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    if (setSelectedDish) setSelectedDish(null);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!activeDish) return null;

  const mealTag = activeDish.mealType === 'breakfast'
    ? (locale === 'ru' ? 'Завтрак' : locale === 'ka' ? 'საუზმე' : 'Breakfast')
    : activeDish.mealType === 'snack'
    ? (locale === 'ru' ? 'Снек' : locale === 'ka' ? 'სნექი' : 'Snack')
    : activeDish.mealType === 'lunch'
    ? (locale === 'ru' ? 'Обед' : locale === 'ka' ? 'სადილი' : 'Lunch')
    : (locale === 'ru' ? 'Ужин' : locale === 'ka' ? 'ვახშამი' : 'Dinner');

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-window-modern" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleClose}
          aria-label={locale === 'ru' ? 'Закрыть' : locale === 'ka' ? 'დახურვა' : 'Close'}
        >
          <IconClose size={18} />
        </button>

        {/* Dish Photo */}
        <div style={{ position: 'relative', width: '100%', height: '260px', background: '#0B0F19' }}>
          <img
            src={activeDish.image}
            alt={activeDish.name[locale]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 800
          }}>
            {mealTag}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
              {activeDish.name[locale]}
            </h3>
            <span style={{
              background: '#DCFCE7',
              color: '#15803D',
              fontWeight: 800,
              fontSize: '13px',
              padding: '4px 10px',
              borderRadius: '8px',
              whiteSpace: 'nowrap'
            }}>
              ★ {activeDish.rating || 4.9}
            </span>
          </div>

          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
            {activeDish.description[locale]}
          </p>

          {/* Macros Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '12px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{activeDish.macros.calories}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#059669' }}>{activeDish.macros.protein}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{locale === 'ru' ? 'Белки' : locale === 'ka' ? 'ცილები' : 'Protein'}</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#D97706' }}>{activeDish.macros.fat}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{locale === 'ru' ? 'Жиры' : locale === 'ka' ? 'ცხიმები' : 'Fats'}</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#2563EB' }}>{activeDish.macros.carbs}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{locale === 'ru' ? 'Углеводы' : locale === 'ka' ? 'ნახშირწყლები' : 'Carbs'}</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{activeDish.macros.weightGrams}{locale === 'ru' ? 'г' : locale === 'ka' ? 'გ' : 'g'}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{locale === 'ru' ? 'Вес' : locale === 'ka' ? 'წონა' : 'Weight'}</div>
            </div>
          </div>

          {/* Ingredients */}
          {activeDish.ingredients && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {locale === 'ru' ? 'Состав блюда:' : locale === 'ka' ? 'შემადგენლობა:' : 'Ingredients:'}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                {(activeDish.ingredients[locale] || []).join(', ')}
              </div>
            </div>
          )}

          {/* Allergens warning */}
          {activeDish.allergens && activeDish.allergens.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#92400E'
            }}>
              <IconInfo size={16} />
              <span>
                {locale === 'ru' ? 'Аллергены:' : locale === 'ka' ? 'ალერგენები:' : 'Allergens:'} <b>{activeDish.allergens.join(', ')}</b>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
