'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { IconSparkles, IconShield, IconTruck, IconFlame } from '@/components/Icons';

export const HeroSection: React.FC = () => {
  const { locale } = useLanguage();
  const { setIsQuizOpen } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      badge: locale === 'ru' ? 'МЕНЮ СНИЖЕНИЕ' : locale === 'ka' ? 'წონის კლება' : 'SLIM MENU',
      title: locale === 'ru' ? 'ВНИЗ ПО ВЕСУ, ВВЕРХ ПО НАСТРОЕНИЮ' : locale === 'ka' ? 'დაიკელი წონაში ენერგიულად' : 'LEAN BODY, PEAK ENERGY',
      subtitle: locale === 'ru' ? 'Вкусная еда для комфортного похудения в Батуми. Без голода, без подсчета калорий и без плиты.' : locale === 'ka' ? 'ჯანსაღი რაციონი კომფორტული წონის კლებისთვის ბათუმში. მომზადების გარეშე.' : 'Gourmet meal prep for effortless fat loss in Batumi. Zero cooking, zero hassle.',
      dishImg: '/images/meals/chicken-ptitim.webp',
      dishName: locale === 'ru' ? 'Куриное филе су-вид и птитим с овощами' : locale === 'ka' ? 'ქათმის ფილე Sous-Vide და პტიტიმი' : 'Chicken Fillet with Ptitim',
      dishMacros: `483 ${locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'} • 44${locale === 'ru' ? 'Б' : locale === 'ka' ? 'ც' : 'P'} • 12${locale === 'ru' ? 'Ж' : locale === 'ka' ? 'ცხ' : 'F'} • 50${locale === 'ru' ? 'У' : locale === 'ka' ? 'ნ' : 'C'}`,
      bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
    },
    {
      badge: locale === 'ru' ? 'СИСТЕМА ПИТАНИЯ ДЛЯ ПОБЕД' : locale === 'ka' ? 'ბალანსი & ენერგია' : 'POWER & BALANCE',
      title: locale === 'ru' ? 'ОСВОБОДИ 15 ЧАСОВ В НЕДЕЛЮ' : locale === 'ka' ? 'დაზოგე 15 საათი კვირაში' : 'SAVE 15 HOURS EVERY WEEK',
      subtitle: locale === 'ru' ? 'Полноценный сбалансированный рацион на весь день. Доставляем свежие наборы каждые 2 дня.' : locale === 'ka' ? 'სრულფასოვანი ჯანსაღი რაციონი მთელი დღისთვის. უფასო მიტანა.' : 'Chef-crafted daily nutrition delivered fresh every 2 days across Batumi.',
      dishImg: '/images/meals/meatloaf-bbq.webp',
      dishName: locale === 'ru' ? 'Митлоф из говядины с BBQ соусом и пюре' : locale === 'ka' ? 'საქონლის მიტლოფი BBQ სოუსით' : 'Beef Meatloaf with BBQ Mash',
      dishMacros: `430 ${locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'} • 36${locale === 'ru' ? 'Б' : locale === 'ka' ? 'ც' : 'P'} • 12${locale === 'ru' ? 'Ж' : locale === 'ka' ? 'ცხ' : 'F'} • 44${locale === 'ru' ? 'У' : locale === 'ka' ? 'ნ' : 'C'}`,
      bgGradient: 'linear-gradient(135deg, #064E3B 0%, #0F172A 70%, #022C22 100%)',
    },
  ];

  const current = slides[activeSlide];

  const scrollToPrograms = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('programs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-slider-section">
      <div className="container">
        <div className="hero-banner-card" style={{ background: current.bgGradient }}>
          {/* Left Hero Content */}
          <div className="hero-content">
            <div className="hero-tagline-badge">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CCFF00', display: 'inline-block' }} />
              <span>{current.badge}</span>
            </div>

            <h1 className="hero-main-title">
              {current.title}
            </h1>

            <p className="hero-subtitle">
              {current.subtitle}
            </p>

            <div className="hero-actions">
              <button
                type="button"
                onClick={scrollToPrograms}
                className="btn-primary"
                style={{ fontSize: '16px', padding: '16px 36px' }}
              >
                <span>{locale === 'ru' ? 'Выбрать программу' : locale === 'ka' ? 'პროგრამის არჩევა' : 'Choose Meal Plan'}</span>
                <span style={{ fontSize: '18px' }}>→</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuizOpen(true)}
                className="btn-dark-pill"
                style={{
                  fontSize: '15px',
                  padding: '16px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                <IconSparkles size={18} />
                <span>{locale === 'ru' ? 'Рассчитать калории за 1 мин' : locale === 'ka' ? 'კალორიების კალკულატორი' : 'Diet Calculator'}</span>
              </button>
            </div>

            {/* Feature Trust Pills */}
            <div className="hero-feature-tags">
              <div className="hero-feature-item">
                <IconTruck size={18} />
                <span>{locale === 'ru' ? 'Доставка от 0 ₾ каждые 2 дня' : locale === 'ka' ? 'უფასო მიტანა ყოველ 2 დღეში' : 'Free delivery every 2 days'}</span>
              </div>
              <div className="hero-feature-item">
                <IconShield size={18} />
                <span>{locale === 'ru' ? '30 дней без повторов блюд' : locale === 'ka' ? 'მენიუ არ მეორდება 30 დღე' : '30 days non-repeating'}</span>
              </div>
              <div className="hero-feature-item">
                <IconFlame size={18} />
                <span>{locale === 'ru' ? 'Точное КБЖУ от диетологов' : locale === 'ka' ? 'ზუსტი კბჟუ დიეტოლოგებისგან' : 'Dietitian certified macros'}</span>
              </div>
            </div>
          </div>

          {/* Right Featured Dish Showcase */}
          <div className="hero-image-wrapper">
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <img
                src={current.dishImg}
                alt={current.dishName}
                className="hero-promo-dish-img"
              />
              
              {/* Floating meal badge */}
              <div className="hero-dish-badge">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CCFF00', flexShrink: 0 }} />
                <span className="hero-dish-badge-title">{current.dishName}</span>
                <span className="hero-dish-badge-dot">•</span>
                <span className="hero-dish-badge-macros">{current.dishMacros}</span>
              </div>
            </div>
          </div>

          {/* Slider Dots */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                style={{
                  width: activeSlide === idx ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '9999px',
                  background: activeSlide === idx ? '#CCFF00' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
