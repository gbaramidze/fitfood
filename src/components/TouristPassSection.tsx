'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { programs } from '@/data/programs';
import { IconSparkles, IconCheck } from '@/components/Icons';

export const TouristPassSection: React.FC = () => {
  const { locale } = useLanguage();
  const { setCart, setIsCartOpen, showToast } = useStore();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [arrivalDate, setArrivalDate] = useState(tomorrowStr);
  const [selectedDuration, setSelectedDuration] = useState<number>(6);

  const targetProgram = programs.find(p => p.id === 'prog-slim') || programs[0];

  const handleBookPass = () => {
    const price = selectedDuration === 2 ? targetProgram.prices.trialTwoDays : targetProgram.prices.sixDays;
    const dailyPrice = Math.round(price / selectedDuration);

    setCart({
      id: `order-trial-${Date.now()}`,
      type: 'subscription',
      programId: targetProgram.id,
      programTitle: `Batumi Express Pass (${selectedDuration} ${locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'days'})`,
      daysDuration: selectedDuration,
      dailyCalories: 1500,
      dailyPrice,
      totalPriceGEL: price,
      deliverySlot: 'morning',
      deliveryZoneId: 'zone-batumi-center',
      startDate: arrivalDate,
      allergiesStopList: [],
    });

    showToast('Express Trial Pass');
    setIsCartOpen(true);
  };

  return (
    <section className="section-pad" id="tourist-pass" style={{ padding: '60px 0', background: '#F8FAFC' }}>
      <div className="container">
        <div className="tourist-card-wrap">
          <div className="tourist-grid-layout">
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#CCFF00',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px'
              }}>
                <IconSparkles size={14} />
                <span>EXPATS & TRAVELERS PASS</span>
              </div>

              <h2 style={{ fontSize: '34px', fontWeight: 900, marginBottom: '16px', lineHeight: 1.2, color: '#FFFFFF' }}>
                {locale === 'ru'
                  ? 'Приехали в Батуми на отдых или работу? Питайтесь ресторанной едой без плиты!'
                  : locale === 'ka'
                  ? 'ჩამოხვედით ბათუმში დასასვენებლად? იკვებეთ ჯანსაღად მომზადების გარეშე!'
                  : 'Visiting Batumi for holiday or remote work? Clean nutrition at your hotel or apartment!'}
              </h2>

              <p style={{ fontSize: '16px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px' }}>
                {locale === 'ru'
                  ? 'Доставка прямо на ресепшн отеля (Orbi City, Courtyard Marriott, Radisson, Alliance Palace) или к двери апартаментов. Без обязательств и автоматических продлений.'
                  : locale === 'ka'
                  ? 'მიტანა პირდაპირ სასტუმროს რეცეფციაზე (Orbi City, Courtyard Marriott, Radisson, Alliance Palace) ან აპარტამენტის კარამდე.'
                  : 'Direct delivery to reception (Orbi City, Courtyard, Radisson, Alliance) or your private apartment door with zero commitments.'}
              </p>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#E2E8F0', fontWeight: 600 }}>
                  <IconCheck size={16} style={{ color: '#CCFF00' }} />
                  <span>
                    {locale === 'ru'
                      ? 'Оплата картой или наличными курьеру'
                      : locale === 'ka'
                      ? 'გადახდა ბარათით ან ნაღდი ანგარიშსწორებით'
                      : 'Card or cash payment on delivery'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#E2E8F0', fontWeight: 600 }}>
                  <IconCheck size={16} style={{ color: '#CCFF00' }} />
                  <span>
                    {locale === 'ru'
                      ? 'Поддержка на русском, грузинском и английском'
                      : locale === 'ka'
                      ? 'მხარდაჭერა ქართულ, რუსულ და ინგლისურ ენებზე'
                      : 'Support in English, Georgian & Russian'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px',
              color: '#0F172A',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>
                {locale === 'ru' ? 'Оформить экспресс-сет' : locale === 'ka' ? 'ექსპრეს-სეტის შეკვეთა' : 'Book Express Pass'}
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  {locale === 'ru' ? 'Длительность:' : locale === 'ka' ? 'ხანგრძლივობა:' : 'Duration:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDuration(2)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: selectedDuration === 2 ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: selectedDuration === 2 ? '#0F172A' : '#F8FAFC',
                      color: selectedDuration === 2 ? '#FFFFFF' : '#0F172A',
                      fontWeight: 800,
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                  >
                    {locale === 'ru' ? '2 дня (78 ₾)' : locale === 'ka' ? '2 დღე (78 ₾)' : '2 Days (78 GEL)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDuration(6)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: selectedDuration === 6 ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: selectedDuration === 6 ? '#0F172A' : '#F8FAFC',
                      color: selectedDuration === 6 ? '#FFFFFF' : '#0F172A',
                      fontWeight: 800,
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                  >
                    {locale === 'ru' ? '6 дней (222 ₾)' : locale === 'ka' ? '6 დღე (222 ₾)' : '6 Days (222 GEL)'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  {locale === 'ru' ? 'Дата первой доставки:' : locale === 'ka' ? 'პირველი მიტანის თარიღი:' : 'First delivery date:'}
                </label>
                <input
                  type="date"
                  value={arrivalDate}
                  min={tomorrowStr}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleBookPass}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              >
                <span>{locale === 'ru' ? 'Заказать доставку' : locale === 'ka' ? 'შეკვეთის გაფორმება' : 'Order Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
