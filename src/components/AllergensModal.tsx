'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ALLERGENS_DATABASE, ALLERGEN_CATEGORIES, AllergenItem } from '@/data/allergensList';
import { IconSearch, IconClose, IconCheck, IconTrash, IconPlus, IconShield } from '@/components/Icons';

interface AllergensModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAllergenIds: string[];
  customAllergens: string[];
  onSave: (allergenIds: string[], customList: string[]) => void;
}

export const AllergensModal: React.FC<AllergensModalProps> = ({
  isOpen,
  onClose,
  selectedAllergenIds,
  customAllergens,
  onSave,
}) => {
  const { locale } = useLanguage();

  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedAllergenIds);
  const [tempCustomList, setTempCustomList] = useState<string[]>(customAllergens);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customInputText, setCustomInputText] = useState('');

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedAllergenIds);
      setTempCustomList(customAllergens);
      setSearchQuery('');
      setActiveCategory('all');
      setCustomInputText('');
    }
  }, [isOpen, selectedAllergenIds, customAllergens]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Toggle Standard Allergen
  const handleToggleAllergen = (id: string) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Add Custom Ingredient
  const handleAddCustom = (valueToAdd?: string) => {
    const text = (valueToAdd || customInputText).trim();
    if (!text) return;
    if (!tempCustomList.includes(text) && !tempSelectedIds.includes(text)) {
      setTempCustomList(prev => [...prev, text]);
    }
    setCustomInputText('');
    if (valueToAdd) {
      setSearchQuery('');
    }
  };

  // Remove Custom
  const handleRemoveCustom = (itemToRemove: string) => {
    setTempCustomList(prev => prev.filter(item => item !== itemToRemove));
  };

  // Clear All
  const handleClearAll = () => {
    setTempSelectedIds([]);
    setTempCustomList([]);
  };

  // Save and Close
  const handleApply = () => {
    onSave(tempSelectedIds, tempCustomList);
    onClose();
  };

  // Filtered Allergens
  const filteredAllergens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return ALLERGENS_DATABASE.filter(item => {
      // Category filter
      if (activeCategory === 'popular') {
        if (!item.isCommonAllergen) return false;
      } else if (activeCategory !== 'all') {
        if (item.categoryId !== activeCategory) return false;
      }

      // Search Query filter
      if (!query) return true;

      const nameRu = item.name.ru.toLowerCase();
      const nameKa = item.name.ka.toLowerCase();
      const nameEn = item.name.en.toLowerCase();

      const kwRu = item.keywords.ru.some(k => k.toLowerCase().includes(query));
      const kwKa = item.keywords.ka.some(k => k.toLowerCase().includes(query));
      const kwEn = item.keywords.en.some(k => k.toLowerCase().includes(query));

      return nameRu.includes(query) || nameKa.includes(query) || nameEn.includes(query) || kwRu || kwKa || kwEn;
    });
  }, [searchQuery, activeCategory]);

  // Check if search query matches any existing name or items are found in current list
  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      filteredAllergens.some(
        a =>
          a.name.ru.toLowerCase().includes(q) ||
          a.name.ka.toLowerCase().includes(q) ||
          a.name.en.toLowerCase().includes(q) ||
          a.keywords.ru.some(k => k.toLowerCase() === q || q.includes(k.toLowerCase())) ||
          a.keywords.ka.some(k => k.toLowerCase() === q || q.includes(k.toLowerCase())) ||
          a.keywords.en.some(k => k.toLowerCase() === q || q.includes(k.toLowerCase()))
      ) || tempCustomList.some(c => c.toLowerCase() === q)
    );
  }, [searchQuery, filteredAllergens, tempCustomList]);

  const totalSelectedCount = tempSelectedIds.length + tempCustomList.length;

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="allergens-modal-window"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="allergens-modal-header">
          <div className="allergens-modal-title-wrap">
            <div className="allergens-modal-icon-badge">
              <IconShield size={22} style={{ color: '#CCFF00' }} />
            </div>
            <div>
              <h3 className="allergens-modal-title">
                {locale === 'ru'
                  ? 'Исключить аллергены и ингредиенты'
                  : locale === 'ka'
                  ? 'ალერგენები & ინგრედიენტების გამორიცხვა'
                  : 'Exclude Allergens & Ingredients'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="dish-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Search Bar & Custom Ingredient Input */}
        <div className="allergens-search-container">
          <div className="allergens-search-box">
            <IconSearch size={18} className="allergens-search-icon" />
            <input
              type="text"
              className="allergens-search-input"
              placeholder={
                locale === 'ru'
                  ? 'Быстрый поиск: кунжут, орехи, яйца, рыба, сельдерей...'
                  : locale === 'ka'
                  ? 'ძებნა: სეზამი, თხილი, კვერცხი, თევზი, ნიახური...'
                  : 'Quick search: sesame, nuts, eggs, fish, celery...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="allergens-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <IconClose size={16} />
              </button>
            )}
          </div>

          {/* Quick Add Custom from Search Query if no exact match */}
          {!exactMatchExists && searchQuery.trim().length > 1 && (
            <div className="allergens-quick-add-suggestion">
              <span className="allergens-suggestion-text">
                {locale === 'ru'
                  ? `Нет в списке? Добавить «${searchQuery.trim()}» в стоп-лист:`
                  : locale === 'ka'
                  ? `ვერ იპოვეთ? დაამატეთ «${searchQuery.trim()}» სიას:`
                  : `Not found? Add "${searchQuery.trim()}" to stop-list:`}
              </span>
              <button
                type="button"
                className="allergens-quick-add-btn"
                onClick={() => handleAddCustom(searchQuery.trim())}
              >
                <IconPlus size={14} />
                <span>
                  {locale === 'ru' ? 'Добавить продукт' : locale === 'ka' ? 'დამატება' : 'Add custom'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Categories Bar */}
        <div className="allergens-categories-scroll">
          {ALLERGEN_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const label = cat.label[locale];
            return (
              <button
                key={cat.id}
                type="button"
                className={`allergens-cat-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Allergens Cards Grid */}
        <div className="allergens-cards-scrollable">
          {filteredAllergens.length > 0 ? (
            <div className="allergens-cards-grid">
              {filteredAllergens.map(item => {
                const isSelected = tempSelectedIds.includes(item.id);
                const categoryObj = ALLERGEN_CATEGORIES.find(c => c.id === item.categoryId);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`allergen-modal-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleAllergen(item.id)}
                  >
                    <div className="allergen-card-left">
                      <div className="allergen-card-texts">
                        <div className="allergen-card-name">{item.name[locale]}</div>
                        <div className="allergen-card-category-sub">
                          {item.isCommonAllergen && (
                            <span className="allergen-major-pill">
                              {locale === 'ru' ? 'Топ-аллерген' : locale === 'ka' ? 'ძირითადი' : 'Major'}
                            </span>
                          )}
                          <span>{categoryObj?.label[locale]}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`allergen-card-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected ? <IconCheck size={14} /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="allergens-empty-state">
              <div style={{ color: '#94A3B8', marginBottom: '8px' }}>
                <IconSearch size={36} />
              </div>
              <p className="allergens-empty-title">
                {locale === 'ru' ? 'Ничего не найдено' : locale === 'ka' ? 'ვერაფერი მოიძებნა' : 'No allergens found'}
              </p>
              <p className="allergens-empty-desc">
                {locale === 'ru'
                  ? `Вы можете добавить «${searchQuery}» как собственный ингредиент`
                  : `შეგიძლიათ დაამატოთ «${searchQuery}» საკუთარ ინგრედიენტად`}
              </p>
              {searchQuery.trim() && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: '12px', padding: '8px 18px', fontSize: '14px' }}
                  onClick={() => handleAddCustom(searchQuery.trim())}
                >
                  <IconPlus size={16} />
                  <span>
                    {locale === 'ru'
                      ? `Исключить «${searchQuery.trim()}»`
                      : locale === 'ka'
                      ? `გამორიცხვა «${searchQuery.trim()}»`
                      : `Exclude "${searchQuery.trim()}"`}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Add Custom Ingredient Bottom Row */}
          <div className="allergens-custom-add-bottom">
            <div className="allergens-custom-add-title">
              {locale === 'ru'
                ? 'Добавить свой нелюбимый продукт / ингредиент:'
                : locale === 'ka'
                ? 'დაამატეთ თქვენი ინდივიდუალური ინგრედიენტი:'
                : 'Add custom unwanted ingredient:'}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddCustom();
              }}
              className="allergens-custom-form-row"
            >
              <input
                type="text"
                className="config-input-text allergens-custom-input"
                placeholder={
                  locale === 'ru'
                    ? 'Например: болгарский перец, кинза, горчица, карри...'
                    : locale === 'ka'
                    ? 'მაგ: ბულგარული წიწაკა, ქინძი, მდოგვი, კარი...'
                    : 'E.g. bell pepper, cilantro, mustard, curry...'
                }
                value={customInputText}
                onChange={e => setCustomInputText(e.target.value)}
              />
              <button
                type="submit"
                className="btn-secondary allergens-custom-submit-btn"
                disabled={!customInputText.trim()}
              >
                <IconPlus size={16} />
                <span>{locale === 'ru' ? 'Добавить' : locale === 'ka' ? 'დამატება' : 'Add'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="allergens-modal-footer">
          <div className="allergens-footer-info">
            <span className="allergens-footer-count">
              {totalSelectedCount === 0 ? (
                locale === 'ru'
                  ? 'Ограничений нет (полный рацион)'
                  : locale === 'ka'
                  ? 'შეზღუდვების გარეშე'
                  : 'No restrictions (full menu)'
              ) : (
                <>
                  <span className="allergens-footer-dot" />
                  {locale === 'ru'
                    ? `Выбрано исключений: ${totalSelectedCount}`
                    : locale === 'ka'
                    ? `გამორიცხულია: ${totalSelectedCount}`
                    : `Excluded items: ${totalSelectedCount}`}
                </>
              )}
            </span>
          </div>

          <div className="allergens-footer-actions">
            <button
              type="button"
              className="btn-secondary allergens-footer-cancel-btn"
              onClick={onClose}
            >
              {locale === 'ru' ? 'Отмена' : locale === 'ka' ? 'გაუქმება' : 'Cancel'}
            </button>
            <button
              type="button"
              className="btn-primary allergens-footer-save-btn"
              onClick={handleApply}
            >
              <IconCheck size={18} />
              <span>
                {locale === 'ru'
                  ? totalSelectedCount > 0 ? `Применить (${totalSelectedCount})` : 'Применить'
                  : locale === 'ka'
                  ? totalSelectedCount > 0 ? `შენახვა (${totalSelectedCount})` : 'შენახვა'
                  : totalSelectedCount > 0 ? `Apply (${totalSelectedCount})` : 'Apply'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
