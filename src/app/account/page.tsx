'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { IconPause, IconCalendar, IconGift, IconCheck, IconChef, IconShield, IconSparkles } from '@/components/Icons';

export default function AccountPage() {
  const { locale, t } = useLanguage();
  const { userSubscription, freezeTomorrow, orders, showToast } = useStore();
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://mealbox.ge/?ref=${userSubscription.referralCode}`);
    setCopied(true);
    showToast(locale === 'ru' ? 'Ссылка скопирована!' : locale === 'ka' ? 'ბმული კოპირებულია!' : 'Link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate 10 upcoming days for the delivery schedule
  const scheduleDays = [...Array(10)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(locale === 'ka' ? 'ka-GE' : locale === 'en' ? 'en-US' : 'ru-RU', { weekday: 'short', month: 'numeric', day: 'numeric' });

    const isFrozen = userSubscription.frozenDates.includes(dateStr);
    let status = 'upcoming';
    if (i === 0) status = 'delivered';
    else if (i === 1) status = isFrozen ? 'frozen' : 'cooking';
    else if (isFrozen) status = 'frozen';

    return {
      dateStr,
      dayName,
      status,
      calories: userSubscription.calories,
    };
  });

  return (
    <div className="section-pad" style={{ padding: '60px 0 100px', background: 'var(--bg-page)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-heading)' }}>
              {t.account.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {locale === 'ru'
                ? 'Управление подпиской, график доставки и бонусы'
                : locale === 'ka'
                ? 'გამოწერის მართვა, მიტანის გრაფიკი და ბონუსები'
                : 'Manage your subscription, delivery calendar and bonuses'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', padding: '10px 18px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {locale === 'ru' ? 'Бонусный баланс:' : locale === 'ka' ? 'ბონუს ბალანსი:' : 'Bonus Balance:'}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {userSubscription.bonusPointsGEL} GEL
            </span>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="account-subscription-card">
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>
              <IconSparkles size={14} />
              <span>{locale === 'ru' ? 'АКТИВНЫЙ РАЦИОН' : locale === 'ka' ? 'აქტიური რაციონი' : 'ACTIVE SUBSCRIPTION'}</span>
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
              {userSubscription.programTitle}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {locale === 'ru' ? 'Адрес доставки:' : locale === 'ka' ? 'მიტანის მისამართი:' : 'Delivery address:'} {userSubscription.address} ({userSubscription.zoneName})
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: '#FFFFFF', padding: '12px 20px', borderRadius: '14px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {locale === 'ru' ? 'Осталось дней' : locale === 'ka' ? 'დარჩენილი დღეები' : 'Remaining Days'}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                  {userSubscription.remainingDays} / {userSubscription.totalDays}
                </div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px 20px', borderRadius: '14px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {locale === 'ru' ? 'Калораж' : locale === 'ka' ? 'კალორიულობა' : 'Calories'}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                  {userSubscription.calories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}
                </div>
              </div>
            </div>
          </div>

          {/* Freeze Fast Action Box */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <IconPause size={18} style={{ color: 'var(--accent-gold)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)' }}>
                {locale === 'ru' ? 'Быстрая заморозка' : locale === 'ka' ? 'სწრაფი გაყინვა' : 'Fast Freeze'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
              {locale === 'ru'
                ? 'Заморозьте доставку на завтра бесплатно (до 21:00 сегодня). Дни не сгорают.'
                : locale === 'ka'
                ? 'გაყინეთ ხვალინდელი მიტანა უფასოდ (დღეს 21:00-მდე). დღეები არ იკარგება.'
                : 'Pause tomorrow delivery for free (before 21:00 today). Your days are saved.'}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={freezeTomorrow}
            >
              {locale === 'ru' ? 'Заморозить день' : locale === 'ka' ? 'დღის გაყინვა' : 'Freeze Day'}
            </button>
          </div>
        </div>

        {/* Delivery Schedule Calendar */}
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <IconCalendar size={22} style={{ color: 'var(--accent-green)' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)' }}>
              {locale === 'ru' ? 'График и статус доставки' : locale === 'ka' ? 'მიტანის გრაფიკი & სტატუსი' : 'Delivery Schedule & Status'}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
            {scheduleDays.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: item.status === 'frozen' ? 'var(--accent-coral-light)' : 'var(--bg-surface)',
                  border: item.status === 'cooking' ? '1.5px solid var(--accent-green)' : '1px solid var(--border)',
                  padding: '16px',
                  borderRadius: '14px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px', color: 'var(--text-heading)', textTransform: 'capitalize' }}>
                  {item.dayName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {item.calories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}
                </div>

                {item.status === 'delivered' && (
                  <span className="badge badge-emerald" style={{ fontSize: '10px' }}>
                    <IconCheck size={12} />
                    <span>{locale === 'ru' ? 'Доставлен' : locale === 'ka' ? 'მიტანილია' : 'Delivered'}</span>
                  </span>
                )}
                {item.status === 'cooking' && (
                  <span className="badge badge-gold" style={{ fontSize: '10px' }}>
                    <IconChef size={12} />
                    <span>{locale === 'ru' ? 'На кухне' : locale === 'ka' ? 'მზადდება' : 'Cooking'}</span>
                  </span>
                )}
                {item.status === 'frozen' && (
                  <span className="badge badge-coral" style={{ fontSize: '10px' }}>
                    {locale === 'ru' ? 'Пауза' : locale === 'ka' ? 'შეჩერებულია' : 'Frozen'}
                  </span>
                )}
                {item.status === 'upcoming' && (
                  <span className="badge badge-dark" style={{ fontSize: '10px' }}>
                    {locale === 'ru' ? 'По расписанию' : locale === 'ka' ? 'დაგეგმილია' : 'Scheduled'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gift & Referral Program Section */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconGift size={20} style={{ color: 'var(--accent-gold)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                {locale === 'ru' ? 'Подарите другу скидку 10%' : locale === 'ka' ? 'აჩუქეთ მეგობარს 10% ფასდაკლება' : 'Gift 10% Discount to a Friend'}
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '520px' }}>
              {locale === 'ru'
                ? 'Делитесь промокодом: друг получит скидку 10% на первый заказ, а вы — 30 GEL на бонусный баланс.'
                : locale === 'ka'
                ? 'გაუზიარეთ პრომოკოდი: მეგობარი მიიღებს 10%-იან ფასდაკლებას, თქვენ კი 30 GEL ბონუს ბალანსზე.'
                : 'Share your code: your friend gets 10% off their first order, and you get 30 GEL bonus points.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '15px',
              color: 'var(--text-heading)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
            }}>
              {userSubscription.referralCode}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCopyReferral}
            >
              {copied
                ? (locale === 'ru' ? 'Скопировано!' : locale === 'ka' ? 'კოპირებულია!' : 'Copied!')
                : (locale === 'ru' ? 'Копировать' : locale === 'ka' ? 'კოპირება' : 'Copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
