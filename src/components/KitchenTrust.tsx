'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import {
  IconShield,
  IconChef,
  IconTruck,
  IconBox,
  IconLeaf,
  IconCheck,
  IconSparkles,
  IconFlame,
  IconClock,
  IconAward,
  IconArrowRight,
  IconDumbbell,
  IconStar,
} from '@/components/Icons';

export const KitchenTrust: React.FC = () => {
  const { locale } = useLanguage();
  const [activeGym, setActiveGym] = useState<number | null>(null);

  const metrics = [
    {
      val: '100%',
      label: locale === 'ru' ? 'Стерильная зона HACCP' : locale === 'ka' ? 'სტერილური HACCP ზონა' : 'Sterile HACCP Facility',
      sub: locale === 'ru' ? 'Санитарный контроль' : locale === 'ka' ? 'სანიტარული კონტროლი' : 'Hospital-grade hygiene',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      val: '58–64°C',
      label: locale === 'ru' ? 'Щадящий Sous-Vide' : locale === 'ka' ? 'Sous-Vide ტექნოლოგია' : 'Precision Sous-Vide',
      sub: locale === 'ru' ? 'Сохранение сочности и белка' : locale === 'ka' ? 'ცილის და ვიტამინების შენარჩუნება' : 'Locks in 98% nutrients',
      color: '#0284C7',
      bg: 'rgba(2, 132, 199, 0.1)',
    },
    {
      val: '72 ч',
      label: locale === 'ru' ? 'Свежесть в MAP-среде' : locale === 'ka' ? 'სიახლე MAP-შეფუთვაში' : 'MAP Freshness',
      sub: locale === 'ru' ? '0% консервантов' : locale === 'ka' ? '0% კონსერვანტები' : 'Zero preservatives',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      val: '06:00–11:00',
      label: locale === 'ru' ? 'Утренняя термо-доставка' : locale === 'ka' ? 'დილის თერმო-მიტანა' : 'Morning Thermal Delivery',
      sub: locale === 'ru' ? 'Холодная цепь до двери' : locale === 'ka' ? 'კარამდე ან სასტუმროში' : 'Cold-chain directly to door',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
  ];

  const cards = [
    {
      id: 'fresh-produce',
      step: '01',
      badge: locale === 'ru' ? '🌿 Эко-фермы' : locale === 'ka' ? '🌿 ეკო-ფერმები' : '🌿 Eco Farms',
      title: locale === 'ru' ? 'Свежие продукты каждое утро' : locale === 'ka' ? 'ახალი ფერმერული პროდუქტები' : 'Daily Fresh Farm Produce',
      desc:
        locale === 'ru'
          ? 'Ежедневные утренние поставки отборного фермерского мяса, свежей рыбы и сезонных овощей. Никаких замороженных полуфабрикатов.'
          : locale === 'ka'
          ? 'ყოველდღიური დილის მოწოდება: ფერმერული ხორცი, ახალი თევზი და ადგილობრივი ბოსტნეული. არანაირი გაყინული ნახევარფაბრიკატები.'
          : 'Daily morning deliveries of fresh farm meats, ocean fish and organic greens with strict quality inspection.',
      icon: <IconLeaf size={28} />,
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.3)',
      tagBg: '#ECFDF5',
      tagColor: '#065F46',
      borderAccent: '#10B981',
      pills: [
        locale === 'ru' ? 'Без заморозки' : locale === 'ka' ? 'გაუყინავი ინგრედიენტები' : 'Never frozen',
        locale === 'ru' ? 'Входной контроль' : locale === 'ka' ? 'ლაბორატორიული შემოწმება' : 'Lab inspected',
        locale === 'ru' ? 'Фермерское сырье' : locale === 'ka' ? 'ადგილობრივი ფერმები' : 'Local organic farms',
      ],
    },
    {
      id: 'sous-vide',
      step: '02',
      badge: locale === 'ru' ? '🍳 Sous-Vide & Гриль' : locale === 'ka' ? '🍳 Sous-Vide & გრილი' : '🍳 Precision Sous-Vide',
      title: locale === 'ru' ? 'Технология Sous-Vide' : locale === 'ka' ? 'Sous-Vide ტექნოლოგია' : 'Gentle Sous-Vide Cooking',
      desc:
        locale === 'ru'
          ? 'Приготовление при точной низкой температуре в вакууме. Мясо остается невероятно нежным и сочным, сохраняя все аминокислоты и микроэлементы.'
          : locale === 'ka'
          ? 'მომზადება ზუსტ დაბალ ტემპერატურაზე ვაკუუმში. ხორცი რჩება წვნიანი და ინარჩუნებს ყველა ვიტამინსა და ცილას.'
          : 'Low-temperature vacuum cooking retains maximum nutrients, juiciness, and authentic delicate flavor.',
      icon: <IconChef size={28} />,
      gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      shadowColor: 'rgba(2, 132, 199, 0.3)',
      tagBg: '#E0F2FE',
      tagColor: '#075985',
      borderAccent: '#0284C7',
      pills: [
        locale === 'ru' ? 'Без жарки на масле' : locale === 'ka' ? 'ზეთის გარეშე' : 'Zero burnt oil',
        locale === 'ru' ? 'Точность ±0.5°C' : locale === 'ka' ? 'სიზუსტე ±0.5°C' : '±0.5°C Precision',
        locale === 'ru' ? '98% витаминов' : locale === 'ka' ? '98% ვიტამინები' : '98% Nutrients retained',
      ],
    },
    {
      id: 'gmc-map',
      step: '03',
      badge: locale === 'ru' ? '🛡️ MAP-среда' : locale === 'ka' ? '🛡️ MAP-შეფუთვა' : '🛡️ Sterile MAP Sealing',
      title: locale === 'ru' ? 'Газомодифицированная среда (ГМС)' : locale === 'ka' ? 'MAP უჟანგბადო შეფუთვა' : 'Modified Atmosphere Packaging',
      desc:
        locale === 'ru'
          ? 'Стерильная запайка контейнеров без доступа кислорода сохраняет блюда свежими до 72 часов в холодильнике без единой капли консервантов.'
          : locale === 'ka'
          ? 'სტერილური დალუქვა უჟანგბადო გარემოში ინარჩუნებს კერძებს 72 საათის განმავლობაში მაცივარში კონსერვანტების გარეშე.'
          : 'Oxygen-free sealed containers keep your meals restaurant-fresh in the fridge up to 72 hours with zero preservatives.',
      icon: <IconBox size={28} />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.3)',
      tagBg: '#FEF3C7',
      tagColor: '#92400E',
      borderAccent: '#F59E0B',
      pills: [
        locale === 'ru' ? 'До 72ч в холодильнике' : locale === 'ka' ? '72 სთ მაცივარში' : '72h in fridge',
        locale === 'ru' ? '0% химии и консервантов' : locale === 'ka' ? '0% კონსერვანტები' : '0% Preservatives',
        locale === 'ru' ? 'Эко BPA-Free боксы' : locale === 'ka' ? 'BPA-Free ეკო-ბოქსები' : 'BPA-Free Eco boxes',
      ],
    },
    {
      id: 'thermal-delivery',
      step: '04',
      badge: locale === 'ru' ? '⚡ Термо-контроль' : locale === 'ka' ? '⚡ თერმო-კონტროლი' : '⚡ Cold-Chain Delivery',
      title: locale === 'ru' ? 'Доставка в термосумках' : locale === 'ka' ? 'მიტანა თერმოჩანთებით' : 'Thermal Courier Delivery',
      desc:
        locale === 'ru'
          ? 'Собственные курьеры привозят рацион в удобный утренний интервал с 06:00 до 11:00 прямо к вашей двери, в офис или на ресепшн отеля в Батуми.'
          : locale === 'ka'
          ? 'ჩვენი კურიერები მოგართმევენ რაციონს დილის 06:00-დან 11:00-მდე კარამდე ან სასტუმროს რეცეფციაზე.'
          : 'Dedicated couriers with temperature-controlled bags deliver directly to your door in morning slots 06:00–11:00.',
      icon: <IconTruck size={28} />,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.3)',
      tagBg: '#F3E8FF',
      tagColor: '#6B21A8',
      borderAccent: '#8B5CF6',
      pills: [
        locale === 'ru' ? 'Слоты 06:00–11:00' : locale === 'ka' ? 'ინტერვალი 06:00–11:00' : 'Slots 06:00–11:00',
        locale === 'ru' ? 'Холодовые аккумуляторы' : locale === 'ka' ? 'ტემპერატურის შენარჩუნება' : 'Thermal ice-packs',
        locale === 'ru' ? 'Курьер до двери' : locale === 'ka' ? 'კარამდე მიტანა' : 'Doorstep / Reception',
      ],
    },
  ];

  // Gyms & Fight Academies that co-developed and support FitFood
  const gyms = [
    {
      id: 'batumi-fight-night',
      name: 'Batumi Fight Night',
      category: locale === 'ru' ? 'Бойцовский промоушен' : locale === 'ka' ? 'საბრძოლო პრომოუშენი' : 'MMA Championship Promotion',
      tag: locale === 'ru' ? '🏆 Титульные турниры' : locale === 'ka' ? '🏆 სატიტულო ტურნირები' : '🏆 Title Tournaments',
      desc:
        locale === 'ru'
          ? 'Совместная разработка рационов для весогонки и пиковой взрывной выносливости бойцов турниров Batumi Fight Night.'
          : locale === 'ka'
          ? 'წონის კლებისა და მაქსიმალური გამძლეობის სპეციალური რაციონების შემუშავება Batumi Fight Night-ის მებრძოლებისთვის.'
          : 'High-performance weight-cut and explosive stamina nutrition engineering for professional Batumi Fight Night champions.',
      imgSrc: '/images/gyms/gym-1-batumi-fight-night.webp',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      borderColor: '#EAB308',
      accentBg: 'rgba(234, 179, 8, 0.1)',
    },
    {
      id: 'mega-gym',
      name: 'Mega Gym Batumi',
      category: locale === 'ru' ? 'Флагманский спорткомплекс' : locale === 'ka' ? 'პრემიუმ ფიტნეს ცენტრი' : 'Premier Fitness & Gym Center',
      tag: locale === 'ru' ? '💪 Силовой тренинг & масса' : locale === 'ka' ? '💪 ძალისმიერი ვარჯიში & მასა' : '💪 Strength & Hypertrophy',
      desc:
        locale === 'ru'
          ? 'Калибровка КБЖУ с тренерским составом Mega Gym для набора сухой мышечной массы и эффективного рельефа.'
          : locale === 'ka'
          ? 'კალორიებისა და ცილების ზუსტი გათვლა Mega Gym-ის მწვრთნელებთან ერთად კუნთოვანი მასის მომატებისა და რელიეფისთვის.'
          : 'Macro formulas calibrated with Mega Gym master trainers for lean muscle mass building and rapid body recomp.',
      imgSrc: '/images/gyms/gym-2-mega-gym.webp',
      glowColor: 'rgba(236, 72, 153, 0.45)',
      borderColor: '#EC4899',
      accentBg: 'rgba(236, 72, 153, 0.1)',
    },
    {
      id: 'fitness-academy',
      name: 'Fitness Academy',
      category: locale === 'ru' ? 'Академия фитнеса' : locale === 'ka' ? 'ფიტნეს აკადემია' : 'Fitness & Nutrition Academy',
      tag: locale === 'ru' ? '⚡ Научная нутрициология' : locale === 'ka' ? '⚡ მეცნიერული ნუტრიციოლოგია' : '⚡ Certified Nutrition Science',
      desc:
        locale === 'ru'
          ? 'Научный расчет витаминно-минерального профиля, гликемического баланса и чистых белков без сахара и трансжиров.'
          : locale === 'ka'
          ? 'ვიტამინების, გლიკემიური ბალანსისა და სუფთა ცილების მეცნიერული გათვლა შაქრისა და მავნე ცხიმების გარეშე.'
          : 'Laboratory-grade micro & macronutrient formulation, zero refined sugars, and optimum glycemic load.',
      imgSrc: '/images/gyms/gym-3-fitness-academy.webp',
      glowColor: 'rgba(248, 250, 252, 0.4)',
      borderColor: '#94A3B8',
      accentBg: 'rgba(248, 250, 252, 0.1)',
    },
    {
      id: 'batumi-fight-academy',
      name: 'Batumi Fight Academy',
      category: locale === 'ru' ? 'Академия единоборств и ММА' : locale === 'ka' ? 'საბრძოლო აკადემია და MMA' : 'Martial Arts & MMA Academy',
      tag: locale === 'ru' ? '🥊 Скорость и выносливость' : locale === 'ka' ? '🥊 სისწრაფე და გამძლეობა' : '🥊 Speed & Conditioning',
      desc:
        locale === 'ru'
          ? 'Специализированные рационы для быстрого восстановления мышечных волокон между интенсивными спаррингами.'
          : locale === 'ka'
          ? 'სპეციალიზებული კვება ინტენსიურ სპარინგებს შორის კუნთების სწრაფი აღდგენისა და ენერგიისთვის.'
          : 'Targeted recovery nutrition engineered for rapid post-sparring glycogen replenishment and muscle protection.',
      imgSrc: '/images/gyms/gym-4-batumi-fight-academy.webp',
      glowColor: 'rgba(239, 68, 68, 0.45)',
      borderColor: '#EF4444',
      accentBg: 'rgba(239, 68, 68, 0.1)',
    },
    {
      id: 'batumi-boxing-academy',
      name: 'Batumi Boxing Academy',
      category: locale === 'ru' ? 'Академия бокса (BBA)' : locale === 'ka' ? 'კრივის აკადემია (BBA)' : 'Boxing Academy (BBA)',
      tag: locale === 'ru' ? '🥇 Профи и олимпийский бокс' : locale === 'ka' ? '🥇 პროფესიონალური კრივი' : '🥇 Pro & Olympic Boxing',
      desc:
        locale === 'ru'
          ? 'Сбалансированная подпитка для сохранения боевой весовой категории без потери скорости удара и силовой выносливости.'
          : locale === 'ka'
          ? 'ბალანსირებული კვება სატურნირო წონის შესანარჩუნებლად დარტყმის სიჩქარისა და ძალისმიერი გამძლეობის დაკარგვის გარეშე.'
          : 'Sustained endurance nutrition to maintain strict championship weight classes while preserving punch velocity.',
      imgSrc: '/images/gyms/gym-5-batumi-boxing-academy.webp',
      glowColor: 'rgba(217, 119, 6, 0.45)',
      borderColor: '#D97706',
      accentBg: 'rgba(217, 119, 6, 0.1)',
    },
  ];

  const techFeatures = [
    {
      icon: '💨',
      title: locale === 'ru' ? 'HEPA H14 фильтрация' : locale === 'ka' ? 'HEPA H14 ფილტრაცია' : 'HEPA H14 Cleanroom',
      desc: locale === 'ru' ? 'Воздух в цехе очищается до 99.995%, как в лаборатории' : locale === 'ka' ? 'ჰაერის 99.995% სისუფთავე წარმოებაში' : 'Air is filtered to 99.995% purity',
    },
    {
      icon: '💧',
      title: locale === 'ru' ? '3-ступенчатый осмос' : locale === 'ka' ? 'წყლის 3-დონიანი წმენდა' : 'Reverse Osmosis + UV',
      desc: locale === 'ru' ? 'Ультрафиолетовая очистка и обеззараживание всей воды' : locale === 'ka' ? 'ულტრაიისფერი დეზინფექცია და წყლის გაწმენდა' : 'UV-sterilization and mineral purification',
    },
    {
      icon: '⚖️',
      title: locale === 'ru' ? 'Точность порций 1г' : locale === 'ka' ? '1 გრამის სიზუსტე' : '1g Micro-Portioning',
      desc: locale === 'ru' ? '100% соответствие заявленному КБЖУ в каждом блюде' : locale === 'ka' ? '100% შესაბამისობა გამოთვლილ კალორიებთან' : 'Guaranteed 100% macro accuracy',
    },
    {
      icon: '❄️',
      title: locale === 'ru' ? 'Шок-охлаждение -35°C' : locale === 'ka' ? 'შოკური გაგრილება -35°C' : 'Blast Chilling -35°C',
      desc: locale === 'ru' ? 'Мгновенная фиксация сочности, структуры и вкуса' : locale === 'ka' ? 'გემოსა და სტრუქტურის მომენტალური ფიქსაცია' : 'Instant lock-in of flavor and texture',
    },
  ];

  return (
    <section
      className="section-pad"
      id="kitchen"
      style={{
        padding: '120px 0 90px',
        scrollMarginTop: '100px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(204, 255, 0, 0.15) 0%, rgba(16, 185, 129, 0.08) 45%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '55%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(204, 255, 0, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 52px' }}>
          {/* Top Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0F172A',
              color: '#CCFF00',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#CCFF00',
                boxShadow: '0 0 10px #CCFF00',
                display: 'inline-block',
                animation: 'pulseGlow 2s infinite ease-in-out',
              }}
            />
            <IconShield size={14} />
            <span>
              {locale === 'ru'
                ? 'СТАНДАРТЫ КАЧЕСТВА И БЕЗОПАСНОСТИ'
                : locale === 'ka'
                ? 'ხარისხისა და უსაფრთხოების სტანდარტები'
                : 'QUALITY & SAFETY STANDARDS'}
            </span>
          </div>

          {/* Section Main Title */}
          <h2
            style={{
              fontSize: 'clamp(28px, 4.2vw, 44px)',
              fontWeight: 900,
              color: '#0F172A',
              marginBottom: '18px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {locale === 'ru' ? (
              <>
                Современный технологичный цех в Батуми.{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Ресторанный вкус, аптечная чистота
                </span>
              </>
            ) : locale === 'ka' ? (
              <>
                თანამედროვე ტექნოლოგიური სამზარეულო ბათუმში.{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  რესტორნის გემო და იდეალური სისუფთავე
                </span>
              </>
            ) : (
              <>
                High-Tech Production Kitchen in Batumi.{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Restaurant Taste, Hospital Cleanliness
                </span>
              </>
            )}
          </h2>

          <p style={{ fontSize: '16px', color: '#64748B', lineHeight: 1.65, maxWidth: '720px', margin: '0 auto' }}>
            {locale === 'ru'
              ? 'Готовим по международным стандартам HACCP: чистый воздух, 3-ступенчатая очистка воды, щадящий Sous-Vide и стерильная запайка в защитную среду.'
              : locale === 'ka'
              ? 'ვამზადებთ HACCP სტანდარტებით: სუფთა ჰაერი, წყლის მრავალდონიანი წმენდა, Sous-Vide და სტერილური დალუქვა.'
              : 'Cooked to certified HACCP standards: HEPA filtered cleanroom air, purified water, sous-vide slow cooking, and sterile MAP sealing.'}
          </p>
        </div>

        {/* Quick Numbers / Metrics Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          {metrics.map((m, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '20px 22px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.25s ease',
              }}
              className="metric-trust-card"
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: m.color }}>{m.val}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '2px' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        {/* 4 Production Pillars Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}
        >
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="kitchen-trust-card"
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '32px 26px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
              }}
            >
              {/* Subtle top color accent border */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: card.gradient,
                }}
              />

              {/* Watermark Step Number */}
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  fontSize: '32px',
                  fontWeight: 900,
                  color: 'rgba(15, 23, 42, 0.06)',
                  lineHeight: 1,
                  fontFamily: 'var(--font-heading)',
                  userSelect: 'none',
                  zIndex: 0,
                }}
              >
                {card.step}
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header Row: Icon + Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '22px',
                    paddingRight: '36px',
                  }}
                >
                  <div
                    className="trust-icon-wrap"
                    style={{
                      width: '58px',
                      height: '58px',
                      borderRadius: '16px',
                      background: card.gradient,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 20px -4px ${card.shadowColor}`,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    {card.icon}
                  </div>

                  <span
                    style={{
                      background: card.tagBg,
                      color: card.tagColor,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Card Title */}
                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 800,
                    color: '#0F172A',
                    marginBottom: '12px',
                    lineHeight: 1.3,
                  }}
                >
                  {card.title}
                </h3>

                {/* Card Description */}
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748B',
                    lineHeight: 1.6,
                    marginBottom: '24px',
                  }}
                >
                  {card.desc}
                </p>
              </div>

              {/* Mini Feature Pills List */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(226, 232, 240, 0.6)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {card.pills.map((pill, pIdx) => (
                  <span
                    key={pIdx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      background: '#F8FAFC',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <span style={{ color: card.borderAccent, display: 'flex' }}>
                      <IconCheck size={13} />
                    </span>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* NEW SECTION: CO-CREATORS & PARTNER GYMS / FIGHT ACADEMIES SHOWCASE */}
        {/* ========================================================================= */}
        <div
          style={{
            background: 'radial-gradient(100% 120% at 50% 0%, #1E293B 0%, #0F172A 50%, #080C14 100%)',
            borderRadius: '32px',
            padding: '52px 36px 44px',
            color: '#FFFFFF',
            marginBottom: '48px',
            boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="gym-partners-box"
        >
          {/* Atmospheric ambient glows in box */}
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '700px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(204, 255, 0, 0.12) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 40px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(204, 255, 0, 0.12)',
                color: '#CCFF00',
                padding: '7px 18px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '16px',
                border: '1px solid rgba(204, 255, 0, 0.3)',
                boxShadow: '0 0 20px rgba(204, 255, 0, 0.15)',
              }}
            >
              <IconDumbbell size={15} />
              <span>
                {locale === 'ru'
                  ? 'СОЗДАНО СОВМЕСТНО С ЧЕМПИОНАМИ И ТРЕНЕРАМИ'
                  : locale === 'ka'
                  ? 'შემუშავებულია ჩემპიონებთან და მწვრთნელებთან ერთად'
                  : 'CO-DEVELOPED WITH CHAMPIONS & GYMS'}
              </span>
            </div>

            <h3
              style={{
                fontSize: 'clamp(24px, 3.2vw, 36px)',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '14px',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
              }}
            >
              {locale === 'ru' ? (
                <>
                  Официальный рацион ведущих{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    спортзалов и бойцовских академий Батуми
                  </span>
                </>
              ) : locale === 'ka' ? (
                <>
                  ბათუმის წამყვანი{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    სპორტული დარბაზებისა და საბრძოლო აკადემიების
                  </span>{' '}
                  ოფიციალური რაციონი
                </>
              ) : (
                <>
                  Official Nutrition Partner of Batumi’s{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Top Fight Academies & Fitness Gyms
                  </span>
                </>
              )}
            </h3>

            <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
              {locale === 'ru'
                ? 'Наши рационы были созданы при непосредственном участии главных фитнес-клубов города. Профессиональные тренеры и диетологи рассчитали баланс белков, углеводов и микроэлементов для реальных спортивных побед.'
                : locale === 'ka'
                ? 'ჩვენი რაციონები შეიქმნა ქალაქის მთავარი სპორტული კლუბების მონაწილეობით. პროფესიონალმა მწვრთნელებმა და დიეტოლოგებმა შეიმუშავეს ცილებისა და ენერგიის იდეალური ბალანსი.'
                : 'Formulated and endorsed in direct collaboration with Batumi’s top athletic institutions. Precision macros engineered for championship performance, muscle recovery, and stamina.'}
            </p>
          </div>

          {/* 5 Gyms Horizontal Grid Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '20px',
              position: 'relative',
              zIndex: 1,
              marginBottom: '32px',
            }}
          >
            {gyms.map((gym, gIdx) => (
              <div
                key={gym.id}
                className="gym-card-item"
                onMouseEnter={() => setActiveGym(gIdx)}
                onMouseLeave={() => setActiveGym(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '22px',
                  padding: '24px 20px',
                  border: `1px solid ${activeGym === gIdx ? gym.borderColor : 'rgba(255, 255, 255, 0.1)'}`,
                  boxShadow: activeGym === gIdx ? `0 14px 35px -5px ${gym.glowColor}` : '0 6px 20px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Gym Circular Glowing Logo */}
                <div
                  className="gym-logo-frame"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    position: 'relative',
                    marginBottom: '16px',
                    padding: '4px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
                    boxShadow: `0 0 25px ${gym.glowColor}`,
                    border: `2px solid ${gym.borderColor}`,
                    transition: 'all 0.35s ease',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#000000',
                    }}
                  >
                    <Image
                      src={gym.imgSrc}
                      alt={gym.name}
                      width={120}
                      height={120}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: activeGym === gIdx ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Badge */}
                <div
                  style={{
                    background: gym.accentBg,
                    color: gym.borderColor,
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '10px',
                    border: `1px solid ${gym.borderColor}40`,
                  }}
                >
                  {gym.tag}
                </div>

                {/* Gym Title */}
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    marginBottom: '4px',
                    lineHeight: 1.25,
                  }}
                >
                  {gym.name}
                </h4>

                {/* Category */}
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#94A3B8',
                    marginBottom: '12px',
                  }}
                >
                  {gym.category}
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '12px',
                    color: '#CBD5E1',
                    lineHeight: 1.5,
                  }}
                >
                  {gym.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Endorsement Guarantee Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CCFF00', fontSize: '13px', fontWeight: 700 }}>
              <IconAward size={18} />
              <span>
                {locale === 'ru'
                  ? 'Одобрено тренерскими штабами главных клубов Батуми'
                  : locale === 'ka'
                  ? 'მოწონებულია ბათუმის წამყვანი კლუბების მწვრთნელების მიერ'
                  : 'Endorsed by head coaches across Batumi'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0', fontSize: '13px', fontWeight: 500 }}>
              <span style={{ color: '#10B981', display: 'flex' }}>
                <IconCheck size={16} />
              </span>
              <span>
                {locale === 'ru'
                  ? 'Скидки и спец-рационы для резидентов и членов клубов'
                  : locale === 'ka'
                  ? 'ფასდაკლებები და სპეციალური მენიუ დარბაზის წევრებისთვის'
                  : 'Exclusive nutrition protocols for club members'}
              </span>
            </div>
          </div>
        </div>

        {/* Tech Highlights Strip (Mini-Features) */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: '24px',
            padding: '32px',
            color: '#FFFFFF',
            marginBottom: '40px',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow inside dark block */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(204, 255, 0, 0.12) 0%, rgba(15, 23, 42, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(204, 255, 0, 0.15)',
                  color: '#CCFF00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                  {locale === 'ru'
                    ? 'Технологический контроль цеха 24/7'
                    : locale === 'ka'
                    ? 'წარმოების ტექნოლოგიური კონტროლი 24/7'
                    : '24/7 Precision Facility Control'}
                </h4>
                <p style={{ fontSize: '13px', color: '#94A3B8' }}>
                  {locale === 'ru'
                    ? 'Каждый этап производства оцифрован и контролируется шеф-технологом'
                    : locale === 'ka'
                    ? 'ყველა ეტაპი კონტროლდება მთავარი ტექნოლოგის მიერ'
                    : 'Every production stage is calibrated and certified daily'}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#CCFF00',
                border: '1px solid rgba(204, 255, 0, 0.25)',
              }}
            >
              <IconAward size={14} />
              <span>HACCP & ISO 22000 Ready</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {techFeatures.map((tf, tIdx) => (
              <div
                key={tIdx}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '16px',
                  padding: '18px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                }}
                className="tech-micro-card"
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{tf.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', marginBottom: '4px' }}>
                  {tf.title}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
                  {tf.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link to Quality Page and Trust Guarantee */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <Link
            href="/quality"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 36px',
              borderRadius: '9999px',
              background: '#0F172A',
              color: '#CCFF00',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '0.02em',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
              transition: 'all 0.25s ease',
            }}
            className="quality-cta-btn"
          >
            <span>
              {locale === 'ru'
                ? 'Подробнее о стандартах и производстве'
                : locale === 'ka'
                ? 'დეტალურად წარმოებისა და სტანდარტების შესახებ'
                : 'Learn More About Kitchen Standards & Production'}
            </span>
            <span className="cta-arrow" style={{ display: 'flex', transition: 'transform 0.2s ease' }}>
              <IconArrowRight size={18} />
            </span>
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#94A3B8',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#10B981', display: 'flex' }}>
              <IconCheck size={16} />
            </span>
            <span>
              {locale === 'ru'
                ? 'Каждый рацион сопровождается сертификатом свежести и точным расчетом КБЖУ'
                : locale === 'ka'
                ? 'ყველა რაციონს ერთვის სიახლის სერტიფიკატი და ზუსტი კალორიების გათვლა'
                : 'Every meal pack includes a freshness certificate and verified macro count'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.85);
          }
        }

        .kitchen-trust-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.12);
          border-color: rgba(203, 213, 225, 1);
        }

        .kitchen-trust-card:hover .trust-icon-wrap {
          transform: scale(1.08) rotate(3deg);
        }

        .metric-trust-card:hover {
          transform: translateY(-4px);
          border-color: #CBD5E1;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
        }

        .gym-card-item:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .gym-card-item:hover .gym-logo-frame {
          transform: scale(1.08);
        }

        .tech-micro-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(204, 255, 0, 0.3);
          transform: translateY(-2px);
        }

        .quality-cta-btn:hover {
          background: #B8E600;
          transform: translateY(-2px);
          box-shadow: 0 15px 35px -5px rgba(204, 255, 0, 0.5);
        }

        .quality-cta-btn:hover .cta-arrow {
          transform: translateX(4px);
        }
      `}</style>
    </section>
  );
};
