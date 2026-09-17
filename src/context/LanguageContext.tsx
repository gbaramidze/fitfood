'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale } from '@/types';
import { translations } from '@/data/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.ru;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('fitfood_locale') as Locale;
    if (saved && (saved === 'ka' || saved === 'ru' || saved === 'en')) {
      setLocaleState(saved);
    } else {
      // Check browser language or default to 'ru' or 'ka'
      const navLang = navigator.language.toLowerCase();
      if (navLang.includes('ka')) {
        setLocaleState('ka');
      } else if (navLang.includes('en')) {
        setLocaleState('en');
      } else {
        setLocaleState('ru');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('fitfood_locale', newLocale);
  };

  const t = translations[locale] || translations.ru;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
