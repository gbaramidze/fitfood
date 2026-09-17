'use client';

import React from 'react';
import { WeeklyMenu } from '@/components/WeeklyMenu';
import { useLanguage } from '@/context/LanguageContext';

export default function MenuPage() {
  const { t } = useLanguage();

  return (
    <div style={{ paddingTop: '24px', minHeight: '80vh' }}>
      <WeeklyMenu />
    </div>
  );
}
