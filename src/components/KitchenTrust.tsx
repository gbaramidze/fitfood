'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { IconShield, IconChef, IconTruck, IconBox, IconLeaf, IconCheck } from '@/components/Icons';

export const KitchenTrust: React.FC = () => {
  const { locale } = useLanguage();

  return (
    <section className="section-pad" id="kitchen" style={{ padding: '80px 0', background: '#FFFFFF' }}>
      <div className="container">
        {/* Title */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 56px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0F172A',
            color: '#CCFF00',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '14px'
          }}>
            <IconShield size={14} />
            <span>
              {locale === 'ru'
                ? 'СТАНДАРТЫ КАЧЕСТВА И ПРОИЗВОДСТВА'
                : locale === 'ka'
                ? 'ხარისხისა და წარმოების სტანდარტები'
                : 'QUALITY & PRODUCTION STANDARDS'}
            </span>
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A', marginBottom: '16px', lineHeight: 1.25 }}>
            {locale === 'ru'
              ? 'Современный технологичный цех в Батуми с контролем пищевой безопасности'
              : locale === 'ka'
              ? 'თანამედროვე ტექნოლოგიური სამზარეულო ბათუმში სურსათის უვნებლობის კონტროლით'
              : 'State-of-the-Art Certified Production Kitchen in Batumi'}
          </h2>

          <p style={{ fontSize: '16px', color: '#64748B', lineHeight: 1.6 }}>
            {locale === 'ru'
              ? 'Фильтруем воздух, обеззараживаем воду, готовим по технологии sous-vide и соблюдаем идеальную стерильность на каждом этапе.'
              : locale === 'ka'
              ? 'ჰაერის HEPA ფილტრაცია, გასუფთავებული წყალი, Sous-Vide მომზადება და იდეალური სტერილურობა ყოველ ეტაპზე.'
              : 'Clean air filtration, purified water, precision sous-vide cooking, and hospital-grade sterility at every step.'}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '24px',
            padding: '32px 24px',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <IconLeaf size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {locale === 'ru' ? 'Свежие продукты каждое утро' : locale === 'ka' ? 'ახალი ფერმერული პროდუქტები' : 'Daily Fresh Farm Produce'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>
              {locale === 'ru'
                ? 'Ежедневные утренние поставки отборного фермерского мяса, свежей рыбы и местных овощей. Никаких замороженных полуфабрикатов.'
                : locale === 'ka'
                ? 'ყოველდღიური დილის მოწოდება: ფერმერული ხორცი, ახალი თევზი და ადგილობრივი ბოსტნეული. არანაირი გაყინული ნახევარფაბრიკატები.'
                : 'Daily morning deliveries of fresh farm meats, fish and organic greens with strict quality inspection.'}
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '24px',
            padding: '32px 24px',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <IconChef size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {locale === 'ru' ? 'Технология Sous-Vide' : locale === 'ka' ? 'Sous-Vide ტექნოლოგია' : 'Gentle Sous-Vide Cooking'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>
              {locale === 'ru'
                ? 'Приготовление при точной низкой температуре в вакууме. Мясо остается нежным и сочным, сохраняя все аминокислоты и микроэлементы.'
                : locale === 'ka'
                ? 'მომზადება ზუსტ დაბალ ტემპერატურაზე ვაკუუმში. ხორცი რჩება წვნიანი და ინარჩუნებს ყველა ვიტამინსა და ცილას.'
                : 'Low-temperature vacuum cooking retains maximum nutrients, juiciness, and authentic delicate flavor.'}
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '24px',
            padding: '32px 24px',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <IconBox size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {locale === 'ru' ? 'Газомодифицированная среда (ГМС)' : locale === 'ka' ? 'MAP უჟანგბადო შეფუთვა' : 'Modified Atmosphere Sealing'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>
              {locale === 'ru'
                ? 'Стерильная запайка контейнеров без доступа кислорода сохраняет блюда свежими до 72 часов в холодильнике без капли консервантов.'
                : locale === 'ka'
                ? 'სტერილური დალუქვა უჟანგბადო გარემოში ინარჩუნებს კერძებს 72 საათის განმავლობაში მაცივარში კონსერვანტების გარეშე.'
                : 'Oxygen-free sealed containers keep your meals restaurant-fresh in the fridge up to 72 hours with zero preservatives.'}
            </p>
          </div>

          {/* Card 4 */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '24px',
            padding: '32px 24px',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#F3E8FF',
              color: '#9333EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <IconTruck size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {locale === 'ru' ? 'Доставка в термосумках' : locale === 'ka' ? 'მიტანა თერმოჩანთებით' : 'Thermal Courier Delivery'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>
              {locale === 'ru'
                ? 'Собственные курьеры привозят рацион в удобный утренний интервал с 06:00 до 11:00 прямо к вашей двери или на ресепшн отеля.'
                : locale === 'ka'
                ? 'ჩვენი კურიერები მოგართმევენ რაციონს დილის 06:00-დან 11:00-მდე კარამდე ან სასტუმროს რეცეფციაზე.'
                : 'Dedicated couriers with temperature-controlled bags deliver directly to your door in morning slots 06:00–11:00.'}
            </p>
          </div>
        </div>

        {/* Link to Quality Page */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link
            href="/quality"
            className="btn-secondary"
            style={{ display: 'inline-flex', padding: '12px 28px', fontSize: '14px', fontWeight: 700 }}
          >
            <span>
              {locale === 'ru'
                ? 'Подробнее о стандартах и производстве →'
                : locale === 'ka'
                ? 'დეტალურად წარმოებისა და სტანდარტების შესახებ →'
                : 'Learn More About Kitchen Standards & Production →'}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};
