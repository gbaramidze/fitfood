'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { IconUser, IconZap, IconGift, IconBox } from '@/components/Icons';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { locale } = useLanguage();

  return (
    <nav className="mobile-nav-bar">
      <div className="mobile-nav-grid">
        <Link
          href="/"
          className={`mobile-nav-link ${pathname === '/' ? 'active' : ''}`}
        >
          <IconBox size={20} />
          <span>{locale === 'ru' ? 'Главная' : locale === 'ka' ? 'მთავარი' : 'Home'}</span>
        </Link>

        <Link
          href="/menu"
          className={`mobile-nav-link ${pathname === '/menu' ? 'active' : ''}`}
        >
          <IconZap size={20} />
          <span>{locale === 'ru' ? 'Меню' : locale === 'ka' ? 'მენიუ' : 'Menu'}</span>
        </Link>

        <Link
          href="/certificates"
          className={`mobile-nav-link ${pathname === '/certificates' ? 'active' : ''}`}
        >
          <IconGift size={20} />
          <span>{locale === 'ru' ? 'Сертификаты' : locale === 'ka' ? 'სასაჩუქრე' : 'Gifts'}</span>
        </Link>

        <Link
          href="/account"
          className={`mobile-nav-link ${pathname === '/account' ? 'active' : ''}`}
        >
          <IconUser size={20} />
          <span>{locale === 'ru' ? 'Кабинет' : locale === 'ka' ? 'კაბინეტი' : 'Account'}</span>
        </Link>
      </div>
    </nav>
  );
};
