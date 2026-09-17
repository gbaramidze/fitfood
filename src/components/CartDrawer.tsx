'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { IconClose, IconCheck, IconTrash, IconCart, IconGift, IconArrowRight, IconShield } from '@/components/Icons';
import { getAllergenDisplayName } from '@/data/allergensList';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { cart, isCartOpen, setIsCartOpen, clearCart, showToast } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  if (!isCartOpen) return null;

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'MEALBOX' || promoCode.trim().toUpperCase() === 'FIT2026' || promoCode.trim().toUpperCase() === 'FITFOOD') {
      setDiscountPercent(10);
      showToast(t.cart.promoSuccess);
    } else {
      showToast(locale === 'ru' ? 'Неверный промокод' : 'Invalid promo code');
    }
  };

  const finalTotal = cart
    ? Math.round(cart.totalPriceGEL * (1 - discountPercent / 100))
    : 0;

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconCart size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
              {t.cart.title}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            style={{ position: 'static', background: '#F1F5F9', color: '#0F172A' }}
            onClick={() => setIsCartOpen(false)}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cart-drawer-body">
          {!cart ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#94A3B8'
              }}>
                <IconCart size={28} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                {t.cart.empty}
              </h4>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
                {t.cart.emptySub}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  href="/menu"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsCartOpen(false)}
                >
                  {t.nav.menu}
                </Link>
                <Link
                  href="/certificates"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsCartOpen(false)}
                >
                  <IconGift size={16} />
                  <span>{t.nav.certificates}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Item Card */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: cart.type === 'certificate' ? '#FEF3C7' : '#0F172A',
                      color: cart.type === 'certificate' ? '#B45309' : '#CCFF00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {cart.type === 'certificate' ? <IconGift size={16} /> : <IconCart size={16} />}
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      {cart.type === 'certificate' ? t.certificates.badge : cart.programTitle}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                    title={locale === 'ru' ? 'Удалить' : locale === 'ka' ? 'წაშლა' : 'Remove'}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>

                {cart.type === 'certificate' && cart.certificateDetails ? (
                  <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px', lineHeight: 1.5 }}>
                    {locale === 'ru' ? 'Получатель:' : locale === 'ka' ? 'მიმღები:' : 'Recipient:'} <strong style={{ color: '#0F172A' }}>{cart.certificateDetails.recipientName}</strong><br />
                    {locale === 'ru' ? 'Калории:' : locale === 'ka' ? 'კალორიები:' : 'Calories:'} {cart.certificateDetails.calorieTier} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'} • {locale === 'ru' ? 'Стиль:' : locale === 'ka' ? 'დიზაინი:' : 'Style:'} {cart.certificateDetails.cardDesign}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600 }}>
                      {cart.dailyCalories} {locale === 'ru' ? 'ккал/день' : locale === 'ka' ? 'კკალ/დღე' : 'kcal/day'} • {cart.dailyPrice} GEL/{locale === 'ru' ? 'день' : locale === 'ka' ? 'დღე' : 'day'}
                    </div>

                    {cart.allergiesStopList && cart.allergiesStopList.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '11.5px', color: '#991B1B' }}>
                        <strong>{locale === 'ru' ? 'Стоп-лист:' : locale === 'ka' ? 'გამორიცხულია:' : 'Stop-list:'}</strong> {cart.allergiesStopList.map(item => getAllergenDisplayName(item, locale)).join(', ')}
                      </div>
                    )}

                    {cart.customSwaps && Object.keys(cart.customSwaps).length > 0 && (
                      <div style={{ marginTop: '6px', padding: '6px 10px', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '11.5px', color: '#065F46' }}>
                        <strong>{locale === 'ru' ? 'Индивидуальные замены блюд:' : locale === 'ka' ? 'შეცვლილი კერძები:' : 'Custom swaps:'}</strong> {Object.keys(cart.customSwaps).length} {locale === 'ru' ? 'поз.' : locale === 'ka' ? 'კერძი' : 'meals'}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{t.cart.daysCount}:</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                    {cart.daysDuration} {locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'Days'}
                  </span>
                </div>
              </div>

              {/* Promo Code input */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: '#64748B', letterSpacing: '0.04em' }}>
                  {locale === 'ru' ? 'ПРОМОКОД НА СКИДКУ' : locale === 'ka' ? 'ფასდაკლების პრომოკოდი' : 'PROMO CODE'}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={t.cart.promoPlaceholder}
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#0F172A',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      height: '42px',
                    }}
                    onClick={handleApplyPromo}
                  >
                    {t.cart.applyPromo}
                  </button>
                </div>
                {discountPercent > 0 && (
                  <div style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconCheck size={14} />
                    <span>{t.cart.promoSuccess}</span>
                  </div>
                )}
              </div>

              {/* Trust Badge */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '14px 16px',
                borderRadius: '16px',
                fontSize: '12.5px',
                color: '#15803D',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <IconShield size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
                <span>
                  {locale === 'ru' 
                    ? 'Бесплатная утренняя доставка и герметичные боксы' 
                    : locale === 'ka'
                    ? 'უფასო დილის მიტანა და ჰერმეტული ბოქსები'
                    : 'Free morning delivery & sealed fresh boxes'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart && (
          <div className="cart-drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>
                {t.cart.total}:
              </span>
              <div>
                {discountPercent > 0 && (
                  <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#94A3B8', marginRight: '8px', fontWeight: 600 }}>
                    {cart.totalPriceGEL} GEL
                  </span>
                )}
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                  {finalTotal} <span style={{ fontSize: '17px', color: '#10B981' }}>GEL</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '15px' }}
              onClick={handleProceedCheckout}
            >
              <span>{t.cart.checkoutBtn}</span>
              <IconArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
