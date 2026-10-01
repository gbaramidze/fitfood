'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { IconClose, IconCheck, IconTrash, IconCart, IconGift, IconArrowRight } from '@/components/Icons';
import { getAllergenDisplayName } from '@/data/allergensList';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { cart, isCartOpen, setIsCartOpen, clearCart, showToast } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  if (!isCartOpen) return null;

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'MEALBOX' || code === 'FIT2026' || code === 'FITFOOD' || code === 'ACADEMY') {
      setDiscountPercent(10);
      showToast(t.cart.promoSuccess);
    } else {
      showToast(locale === 'ru' ? 'Неверный промокод' : locale === 'ka' ? 'არასწორი პრომოკოდი' : 'Invalid promo code');
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
    <div className="cart-minimal-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-minimal-drawer" onClick={e => e.stopPropagation()}>
        {/* Minimalist Header */}
        <div className="cart-minimal-header">
          <div className="cart-minimal-title-group">
            <h3>{t.cart.title}</h3>
            {cart && (
              <span className="cart-minimal-counter">
                1 {locale === 'ru' ? 'заказ' : locale === 'ka' ? 'შეკვეთა' : 'item'}
              </span>
            )}
          </div>

          <button
            type="button"
            className="cart-minimal-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Minimalist Body */}
        <div className="cart-minimal-body">
          {!cart ? (
            <div className="cart-minimal-empty">
              <div className="cart-minimal-empty-icon">
                <IconCart size={32} />
              </div>
              <h4>{t.cart.empty}</h4>
              <p>{t.cart.emptySub}</p>
              <div className="cart-minimal-empty-actions">
                <Link
                  href="/menu"
                  className="cart-minimal-primary-btn"
                  onClick={() => setIsCartOpen(false)}
                >
                  {t.nav.menu}
                </Link>
                <Link
                  href="/certificates"
                  className="cart-minimal-secondary-btn"
                  onClick={() => setIsCartOpen(false)}
                >
                  <IconGift size={15} />
                  <span>{t.nav.certificates}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-minimal-content">
              {/* Item Card */}
              <div className="cart-minimal-item-card">
                <div className="cart-minimal-item-top">
                  <div className="cart-minimal-item-title-box">
                    <span className="cart-minimal-item-type">
                      {cart.type === 'certificate' ? '🎁 Подарочный сертификат' : '🥗 Программа питания'}
                    </span>
                    <h4 className="cart-minimal-item-title">
                      {cart.type === 'certificate' ? t.certificates.badge : cart.programTitle}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="cart-minimal-remove-btn"
                    title={locale === 'ru' ? 'Удалить' : locale === 'ka' ? 'წაშლა' : 'Remove'}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>

                {cart.type === 'certificate' && cart.certificateDetails ? (
                  <div className="cart-minimal-meta-block">
                    <div className="meta-line">
                      <span>{locale === 'ru' ? 'Получатель:' : locale === 'ka' ? 'მიმღები:' : 'Recipient:'}</span>
                      <strong>{cart.certificateDetails.recipientName}</strong>
                    </div>
                    <div className="meta-line">
                      <span>{locale === 'ru' ? 'Рацион:' : locale === 'ka' ? 'რაციონი:' : 'Tier:'}</span>
                      <span>{cart.certificateDetails.calorieTier} kcal • {cart.certificateDetails.cardDesign}</span>
                    </div>
                  </div>
                ) : (
                  <div className="cart-minimal-meta-block">
                    <div className="meta-line">
                      <span>{locale === 'ru' ? 'Калорийность:' : locale === 'ka' ? 'კალორიები:' : 'Calories:'}</span>
                      <strong>{cart.dailyCalories} {locale === 'ru' ? 'ккал/день' : locale === 'ka' ? 'კკალ/დღე' : 'kcal/day'}</strong>
                    </div>
                    <div className="meta-line">
                      <span>{locale === 'ru' ? 'Длительность:' : locale === 'ka' ? 'ხანგრძლივობა:' : 'Duration:'}</span>
                      <strong>{cart.daysDuration} {locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'days'} ({cart.dailyPrice} ₾/день)</strong>
                    </div>

                    {/* Allergies / Stop-list tags */}
                    {cart.allergiesStopList && cart.allergiesStopList.length > 0 && (
                      <div className="cart-minimal-stoplist-tag">
                        <span className="stoplist-label">Исключено:</span>
                        <span className="stoplist-items">
                          {cart.allergiesStopList.map(item => getAllergenDisplayName(item, locale)).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Custom Swaps tag */}
                    {cart.customSwaps && Object.keys(cart.customSwaps).length > 0 && (
                      <div className="cart-minimal-swaps-tag">
                        <span>✓ Замен блюд: {Object.keys(cart.customSwaps).length}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="cart-minimal-item-price-row">
                  <span className="price-label">Сумма за рацион:</span>
                  <span className="price-val">{cart.totalPriceGEL} GEL</span>
                </div>
              </div>

              {/* Minimalist Promo code */}
              <div className="cart-minimal-promo-box">
                <div className="cart-minimal-promo-row">
                  <input
                    type="text"
                    placeholder={locale === 'ru' ? 'Промокод (ACADEMY, FIT2026)' : 'Promo code'}
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    className="cart-minimal-promo-input"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="cart-minimal-promo-btn"
                  >
                    {t.cart.applyPromo}
                  </button>
                </div>

                {discountPercent > 0 && (
                  <div className="cart-minimal-discount-badge">
                    <IconCheck size={14} />
                    <span>Скидка {discountPercent}% применена (-{Math.round(cart.totalPriceGEL * (discountPercent / 100))} GEL)</span>
                  </div>
                )}
              </div>

              {/* Minimalist Delivery Assurance */}
              <div className="cart-minimal-delivery-note">
                <span className="dot" />
                <span>Бесплатная доставка каждые 2 дня в Батуми (06:00 – 11:00)</span>
              </div>
            </div>
          )}
        </div>

        {/* Minimalist Footer */}
        {cart && (
          <div className="cart-minimal-footer">
            <div className="cart-minimal-total-row">
              <span className="total-label">{t.cart.total}</span>
              <div className="total-prices">
                {discountPercent > 0 && (
                  <span className="total-old">{cart.totalPriceGEL} GEL</span>
                )}
                <span className="total-main">
                  {finalTotal} <span className="total-currency">GEL</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="cart-minimal-checkout-btn"
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
