'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { FlagRU, FlagGE, FlagGB, IconChevronDown, IconCheck } from '@/components/Icons';
import { Locale } from '@/types';

interface LanguageOption {
  code: Locale;
  label: string;
  nativeLabel: string;
  FlagComponent: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'ru',
    label: 'RU',
    nativeLabel: 'Русский',
    FlagComponent: FlagRU,
  },
  {
    code: 'ka',
    label: 'KA',
    nativeLabel: 'ქართული',
    FlagComponent: FlagGE,
  },
  {
    code: 'en',
    label: 'EN',
    nativeLabel: 'English',
    FlagComponent: FlagGB,
  },
];

interface LanguageDropdownProps {
  variant?: 'dark' | 'light';
  className?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ variant = 'dark', className = '' }) => {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const ActiveFlag = activeLang.FlagComponent;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className={`lang-dropdown-wrapper ${variant} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`lang-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Сменить язык / Change Language / ენის შეცვლა"
      >
        <ActiveFlag size={18} />
        <span className="lang-code">{activeLang.label}</span>
        <IconChevronDown size={12} className={`lang-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="lang-dropdown-menu" role="listbox">
          <div className="lang-dropdown-header">
            <span>Язык / Language / ენა</span>
          </div>
          {LANGUAGES.map((item) => {
            const ItemFlag = item.FlagComponent;
            const isSelected = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`lang-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(item.code)}
              >
                <div className="lang-item-left">
                  <ItemFlag size={20} />
                  <div className="lang-item-text">
                    <span className="lang-native-name">{item.nativeLabel}</span>
                    <span className="lang-short-code">{item.label}</span>
                  </div>
                </div>
                {isSelected && <IconCheck size={15} className="lang-check-icon" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
