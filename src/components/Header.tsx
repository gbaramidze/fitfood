'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { 
  IconCart, 
  IconUser, 
  IconPhone, 
  IconTelegram, 
  IconWhatsApp, 
  IconMapPin, 
  IconClock, 
  IconChevronDown, 
  IconCheck 
} from '@/components/Icons';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { CallbackModal } from '@/components/CallbackModal';

export const Header: React.FC = () => {
  const { locale, t } = useLanguage();
  const { cart, setIsCartOpen } = useStore();
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<'Batumi' | 'Tbilisi'>('Batumi');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close city dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    if (showCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCityDropdown]);

  const scrollToPrograms = (e: React.MouseEvent) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('programs');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getCityLabel = (city: 'Batumi' | 'Tbilisi') => {
    if (city === 'Batumi') {
      return locale === 'ka' ? 'ბათუმი' : locale === 'ru' ? 'Батуми' : 'Batumi';
    }
    return locale === 'ka' ? 'თბილისი' : locale === 'ru' ? 'Тбилиси' : 'Tbilisi';
  };

  return (
    <>
      <header className="site-header-wrapper">
        {/* ========================================================
            TOPBAR (Address/City, Delivery note, Phone, Socials, Callback, Language)
            ======================================================== */}
        <div className="site-topbar">
          <div className="container">
            <div className="topbar-container">
              {/* Left: City Selector & Delivery Hint */}
              <div className="topbar-left">
                {/* City / Address Selector */}
                <div className="topbar-city-wrapper" ref={cityDropdownRef}>
                  <button
                    type="button"
                    className="topbar-city-btn"
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    title={locale === 'ru' ? 'Выбрать город доставки' : locale === 'ka' ? 'აირჩიეთ ქალაქი' : 'Select Delivery City'}
                  >
                    <IconMapPin size={13} className="topbar-pin-icon" />
                    <span className="topbar-city-label">{getCityLabel(selectedCity)}</span>
                    <IconChevronDown size={11} className={`topbar-chevron ${showCityDropdown ? 'open' : ''}`} />
                  </button>

                  {showCityDropdown && (
                    <div className="topbar-city-dropdown">
                      <div className="city-dropdown-header">
                        <span>{locale === 'ru' ? 'Город доставки' : locale === 'ka' ? 'მიტანის ქალაქი' : 'Delivery City'}</span>
                      </div>
                      <button
                        type="button"
                        className={`city-dropdown-item ${selectedCity === 'Batumi' ? 'active' : ''}`}
                        onClick={() => { setSelectedCity('Batumi'); setShowCityDropdown(false); }}
                      >
                        <div className="city-item-info">
                          <span className="city-item-name">{locale === 'ka' ? 'ბათუმი' : locale === 'ru' ? 'Батуми' : 'Batumi'}</span>
                          <span className="city-item-badge">{locale === 'ru' ? 'Бесплатная доставка' : locale === 'ka' ? 'უფასო მიტანა' : 'Free Delivery'}</span>
                        </div>
                        {selectedCity === 'Batumi' && <IconCheck size={14} className="city-item-check" />}
                      </button>

                      <button
                        type="button"
                        className={`city-dropdown-item ${selectedCity === 'Tbilisi' ? 'active' : ''}`}
                        onClick={() => { setSelectedCity('Tbilisi'); setShowCityDropdown(false); }}
                      >
                        <div className="city-item-info">
                          <span className="city-item-name">{locale === 'ka' ? 'თბილისი' : locale === 'ru' ? 'Тбилиси' : 'Tbilisi'}</span>
                          <span className="city-item-badge soon">{locale === 'ru' ? 'Скоро открытие' : locale === 'ka' ? 'მალე გაიხსნება' : 'Opening Soon'}</span>
                        </div>
                        {selectedCity === 'Tbilisi' && <IconCheck size={14} className="city-item-check" />}
                      </button>
                    </div>
                  )}
                </div>

                <span className="topbar-separator" />

                {/* Delivery schedule note */}
                <div className="topbar-delivery-hint">
                  <IconClock size={12} className="topbar-clock-icon" />
                  <span>
                    {locale === 'ru' 
                      ? 'Доставка каждые 2 дня: 06:00 – 11:00' 
                      : locale === 'ka' 
                      ? 'მიტანა ყოველ 2 დღეში: 06:00 – 11:00' 
                      : 'Delivery every 2 days: 06:00 – 11:00'}
                  </span>
                </div>
              </div>

              {/* Right: Phone, Messengers, Callback, Language Dropdown */}
              <div className="topbar-right">
                {/* Phone number */}
                <a
                  href="tel:+995599000000"
                  className="topbar-phone-link"
                  title={locale === 'ru' ? 'Позвонить в FitFood' : 'Call FitFood'}
                >
                  <IconPhone size={12} className="topbar-phone-icon" />
                  <span>+995 599 00-00-00</span>
                </a>

                {/* Messengers */}
                <div className="topbar-socials">
                  <a
                    href="https://t.me/fitfood_batumi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="topbar-social-btn tg"
                    title="Telegram Chat"
                  >
                    <IconTelegram size={13} />
                  </a>
                  <a
                    href="https://wa.me/995599000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="topbar-social-btn wa"
                    title="WhatsApp"
                  >
                    <IconWhatsApp size={13} />
                  </a>
                </div>

                <span className="topbar-separator" />

                {/* Callback Modal Trigger */}
                <button
                  type="button"
                  className="topbar-callback-btn"
                  onClick={() => setIsCallbackOpen(true)}
                >
                  {locale === 'ru' ? 'Заказать звонок' : locale === 'ka' ? 'დამირეკეთ' : 'Callback'}
                </button>

                <span className="topbar-separator" />

                {/* Language Switcher Dropdown with Flags */}
                <LanguageDropdown variant="dark" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MAIN STICKY HEADER (Logo, Nav links, Cart, Profile, CTA)
            ======================================================== */}
        <div className="site-header-main">
          <div className="container">
            <div className="header-container">
              {/* Logo */}
              <Link href="/" className="header-logo">
                <span className="header-logo-badge">Academy</span>
                <span>Fitness Food</span>
              </Link>

              {/* Clean Navigation Links */}
              <nav className="header-nav-pills">
                <Link href="/#programs" onClick={scrollToPrograms} className="header-nav-link">
                  {locale === 'ru' ? 'Программы' : locale === 'ka' ? 'პროგრამები' : 'Meal Plans'}
                </Link>
                <Link href="/menu" className="header-nav-link">
                  {locale === 'ru' ? 'Меню' : locale === 'ka' ? 'მენიუ' : 'Menu'}
                </Link>
                <Link href="/quality" className="header-nav-link">
                  {locale === 'ru' ? 'Качество' : locale === 'ka' ? 'ხარისხი' : 'Quality'}
                </Link>
                <Link href="/certificates" className="header-nav-link">
                  {locale === 'ru' ? 'Сертификаты' : locale === 'ka' ? 'ბარათები' : 'Gifts'}
                </Link>
                <Link href="/faq" className="header-nav-link">
                  {locale === 'ru' ? 'FAQ' : locale === 'ka' ? 'FAQ' : 'FAQ'}
                </Link>
                <Link href="/contacts" className="header-nav-link">
                  {locale === 'ru' ? 'Контакты' : locale === 'ka' ? 'კონტაქტი' : 'Contacts'}
                </Link>
              </nav>

              {/* Actions: Cart, Profile, CTA Button */}
              <div className="header-actions">
                {/* Cart Drawer Trigger */}
                <button
                  type="button"
                  className="header-action-btn"
                  onClick={() => setIsCartOpen(true)}
                  title={locale === 'ru' ? 'Корзина' : locale === 'ka' ? 'კალათა' : 'Cart'}
                >
                  <IconCart size={19} />
                  {cart && (
                    <span className="header-cart-badge">1</span>
                  )}
                </button>

                {/* Profile / Account */}
                <Link 
                  href="/account" 
                  className="header-action-btn" 
                  title={locale === 'ru' ? 'Личный кабинет' : locale === 'ka' ? 'კაბინეტი' : 'Profile'}
                >
                  <IconUser size={19} />
                </Link>

                {/* Neon CTA Button (Level Kitchen "Оформить заказ") */}
                <button
                  type="button"
                  className="btn-primary header-cta-btn"
                  onClick={scrollToPrograms}
                >
                  <span>{locale === 'ru' ? 'Оформить заказ' : locale === 'ka' ? 'შეკვეთა' : 'Order Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Callback Modal */}
      {isCallbackOpen && (
        <CallbackModal onClose={() => setIsCallbackOpen(false)} />
      )}
    </>
  );
};
