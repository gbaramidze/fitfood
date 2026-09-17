'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { CardDesignTheme, CertificateDeliveryType, GiftCertificate } from '@/types';
import {
  IconGift,
  IconCheck,
  IconSparkles,
  IconRepeat,
  IconCreditCard,
  IconShield,
  IconMealBoxLogo,
  IconClock,
  IconArrowRight,
} from '@/components/Icons';

export default function CertificatesPage() {
  const { t, locale } = useLanguage();
  const { setCart, setIsCartOpen, showToast } = useStore();

  // Customizer State
  const defaultInitialName = locale === 'ka' ? 'ალექსანდრე' : locale === 'ru' ? 'Александр' : 'Alexander';
  const [recipientName, setRecipientName] = useState(defaultInitialName);
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [cardTheme, setCardTheme] = useState<CardDesignTheme>('obsidian-gold');
  const [calorieTier, setCalorieTier] = useState('1500');
  const [durationDays, setDurationDays] = useState(12);
  const [deliveryFormat, setDeliveryFormat] = useState<CertificateDeliveryType>('digital');
  const [isFlipped, setIsFlipped] = useState(false);

  React.useEffect(() => {
    setRecipientName(locale === 'ka' ? 'ალექსანდრე' : locale === 'ru' ? 'Александр' : 'Alexander');
  }, [locale]);

  // 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -14;
    const rY = ((x - centerX) / centerX) * 14;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Pricing calculation
  const getDayPrice = (cals: string) => {
    switch (cals) {
      case '1000': return 36;
      case '1500': return 39;
      case '2000': return 45;
      case '2500': return 49;
      default: return 42;
    }
  };

  const basePrice = getDayPrice(calorieTier) * durationDays;
  const boxSurcharge = deliveryFormat === 'luxury-box' ? 15 : 0;
  const totalPrice = basePrice + boxSurcharge;

  const handleAddToCart = () => {
    const certItem: GiftCertificate = {
      id: `cert-${Date.now()}`,
      recipientName: recipientName.trim() || 'Гость MealBox',
      senderName: senderName.trim(),
      message: message.trim(),
      calorieTier,
      durationDays,
      cardDesign: cardTheme,
      deliveryFormat,
      priceGEL: totalPrice,
      cardCode: `MB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setCart({
      id: certItem.id,
      type: 'certificate',
      totalPriceGEL: totalPrice,
      daysDuration: durationDays,
      certificateDetails: certItem,
    });

    showToast(t.certificates.badge);
    setIsCartOpen(true);
  };

  return (
    <div className="certificates-section">
      <div className="container">
        {/* Hero Title */}
        <div className="cert-hero-header">
          <div className="badge badge-gold">
            <IconSparkles size={14} />
            <span>{t.certificates.badge}</span>
          </div>
          <h1>{t.certificates.title}</h1>
          <p>{t.certificates.subtitle}</p>
        </div>

        {/* 2-Column Grid: 3D Interactive Card + Configurator */}
        <div className="cert-grid-layout">
          {/* Left Column: 3D Card Stage */}
          <div className="card-3d-stage">
            <div
              ref={cardRef}
              className={`card-3d-wrapper ${isFlipped ? 'flipped' : ''}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                transform: isFlipped
                  ? 'rotateY(180deg)'
                  : `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              }}
            >
              {/* Card Front */}
              <div className={`card-face card-front card-theme-${cardTheme}`}>
                <div className="card-front-top">
                  <div className="card-brand-group">
                    <IconMealBoxLogo size={32} />
                    <span className="card-brand-title foil-text">MealBox</span>
                  </div>
                  <div className="card-badge-tier foil-border">
                    <span className="foil-text">
                      {calorieTier === 'custom'
                        ? 'ALL ACCESS'
                        : `${calorieTier} KCAL`}
                    </span>
                  </div>
                </div>

                <div className="card-chip-row">
                  <div className="card-emv-chip" />
                  <svg className="card-nfc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 10a4 4 0 0 1 0 4" />
                    <path d="M12 7a8 8 0 0 1 0 10" />
                    <path d="M15.5 4a12 12 0 0 1 0 16" />
                  </svg>
                  <span className="card-pass-label foil-text" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.85, marginLeft: 'auto', textTransform: 'uppercase' }}>
                    GIFT PASS
                  </span>
                </div>

                <div className="card-front-bottom">
                  <div className="card-holder-group">
                    <span className="card-label-small">CARDHOLDER / GIFT FOR</span>
                    <span className="card-holder-name">
                      {recipientName.trim() || 'RECIPIENT NAME'}
                    </span>
                  </div>
                  <div className="card-duration-tag">
                    {durationDays} DAYS PASS
                  </div>
                </div>
              </div>

              {/* Card Back */}
              <div className={`card-face card-back card-theme-${cardTheme}`}>
                <div className="card-back-content">
                  <div className="card-back-header">
                    <div className="card-brand-group">
                      <IconMealBoxLogo size={22} />
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '14px' }}>MealBox Concierge</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>
                      PASS ID: MB-8840
                    </span>
                  </div>

                  <div className="card-signature-row">
                    <div className="card-signature-panel">
                      {recipientName.trim() || 'MealBox Premium'}
                    </div>
                  </div>

                  <div className="card-message-box">
                    {message.trim()
                      ? `«${message}»`
                      : (locale === 'ru'
                        ? 'Активируйте сертификат на сайте mealbox.ge в личном кабинете или через Telegram-бота.'
                        : locale === 'ka'
                        ? 'ბარათის აქტივაცია შესაძლებელია საიტზე mealbox.ge პირად კაბინეტში.'
                        : 'Activate your gift pass on mealbox.ge dashboard or via Telegram.')}
                  </div>

                  <div className="card-back-footer">
                    <span>MEALBOX CONCIERGE SERVICE</span>
                    <span>VALID 12 MONTHS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flip / Interaction Controls */}
            <div className="card-controls-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <IconRepeat size={16} />
                <span>{t.certificates.flipButton}</span>
              </button>
              <span className="card-controls-hint">
                {t.certificates.card3dHint}
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Configurator */}
          <div className="cert-configurator-card">
            <h2>{t.certificates.customizerTitle}</h2>

            {/* 1. Theme / Finish Select */}
            <div className="config-form-group">
              <label className="config-label">{t.certificates.styleSelectLabel}</label>
              <div className="theme-pill-grid">
                <button
                  type="button"
                  className={`theme-pill-btn ${cardTheme === 'obsidian-gold' ? 'active' : ''}`}
                  onClick={() => setCardTheme('obsidian-gold')}
                >
                  <div className="theme-dot theme-dot-obsidian" />
                  <span>Obsidian Gold</span>
                </button>
                <button
                  type="button"
                  className={`theme-pill-btn ${cardTheme === 'holo-aurora' ? 'active' : ''}`}
                  onClick={() => setCardTheme('holo-aurora')}
                >
                  <div className="theme-dot theme-dot-holo" />
                  <span>Holo Aurora</span>
                </button>
                <button
                  type="button"
                  className={`theme-pill-btn ${cardTheme === 'emerald-cyber' ? 'active' : ''}`}
                  onClick={() => setCardTheme('emerald-cyber')}
                >
                  <div className="theme-dot theme-dot-emerald" />
                  <span>Emerald Cyber</span>
                </button>
                <button
                  type="button"
                  className={`theme-pill-btn ${cardTheme === 'titanium-silver' ? 'active' : ''}`}
                  onClick={() => setCardTheme('titanium-silver')}
                >
                  <div className="theme-dot theme-dot-titanium" />
                  <span>Titanium Silver</span>
                </button>
              </div>
            </div>

            {/* 2. Recipient Name Input */}
            <div className="config-form-group">
              <label className="config-label">{t.certificates.recipientNameLabel}</label>
              <input
                type="text"
                className="config-input-text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={t.certificates.recipientNamePlaceholder}
                maxLength={26}
              />
            </div>

            {/* 3. Personal Message */}
            <div className="config-form-group">
              <label className="config-label">{t.certificates.messageLabel}</label>
              <input
                type="text"
                className="config-input-text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.certificates.messagePlaceholder}
                maxLength={80}
              />
            </div>

            {/* 4. Calorie Program Select */}
            <div className="config-form-group">
              <label className="config-label">{t.certificates.calorieSelectLabel}</label>
              <div className="calorie-select-grid">
                <button
                  type="button"
                  className={`calorie-option-btn ${calorieTier === '1000' ? 'active' : ''}`}
                  onClick={() => setCalorieTier('1000')}
                >
                  <span>{t.certificates.calorieOptions.c1000}</span>
                  {calorieTier === '1000' && <IconCheck size={16} />}
                </button>
                <button
                  type="button"
                  className={`calorie-option-btn ${calorieTier === '1500' ? 'active' : ''}`}
                  onClick={() => setCalorieTier('1500')}
                >
                  <span>{t.certificates.calorieOptions.c1500}</span>
                  {calorieTier === '1500' && <IconCheck size={16} />}
                </button>
                <button
                  type="button"
                  className={`calorie-option-btn ${calorieTier === '2000' ? 'active' : ''}`}
                  onClick={() => setCalorieTier('2000')}
                >
                  <span>{t.certificates.calorieOptions.c2000}</span>
                  {calorieTier === '2000' && <IconCheck size={16} />}
                </button>
                <button
                  type="button"
                  className={`calorie-option-btn ${calorieTier === '2500' ? 'active' : ''}`}
                  onClick={() => setCalorieTier('2500')}
                >
                  <span>{t.certificates.calorieOptions.c2500}</span>
                  {calorieTier === '2500' && <IconCheck size={16} />}
                </button>
              </div>
            </div>

            {/* 5. Duration Days */}
            <div className="config-form-group">
              <label className="config-label">{t.certificates.durationLabel}</label>
              <div className="duration-pill-row">
                {[2, 6, 12, 24, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={`duration-pill-btn ${durationDays === days ? 'active' : ''}`}
                    onClick={() => setDurationDays(days)}
                  >
                    {days} {locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Delivery Format */}
            <div className="config-form-group">
              <label className="config-label">{t.certificates.deliveryFormatLabel}</label>
              <div className="format-choice-grid">
                <button
                  type="button"
                  className={`format-card-btn ${deliveryFormat === 'digital' ? 'active' : ''}`}
                  onClick={() => setDeliveryFormat('digital')}
                >
                  <div className="format-card-title">
                    {locale === 'ru' ? 'Электронный сертификат' : locale === 'ka' ? 'ელექტრონული ბარათი' : 'Digital Certificate'}
                  </div>
                  <div className="format-card-desc">
                    {locale === 'ru' ? 'Мгновенно на Email / Telegram' : locale === 'ka' ? 'მყისიერი მიწოდება Email / Telegram-ით' : 'Instant Email / Telegram delivery'}
                  </div>
                </button>
                <button
                  type="button"
                  className={`format-card-btn ${deliveryFormat === 'luxury-box' ? 'active' : ''}`}
                  onClick={() => setDeliveryFormat('luxury-box')}
                >
                  <div className="format-card-title">
                    {locale === 'ru' ? 'Подарочный бокс (+15 GEL)' : locale === 'ka' ? 'სასაჩუქრე ყუთი (+15 GEL)' : 'Luxury Gift Box (+15 GEL)'}
                  </div>
                  <div className="format-card-desc">
                    {locale === 'ru' ? 'Физическая карта курьером в коробке' : locale === 'ka' ? 'ფიზიკური პლასტიკური ბარათი კურიერით' : 'Physical plastic card in courier box'}
                  </div>
                </button>
              </div>
            </div>

            {/* Summary & Buy CTA */}
            <div className="cert-summary-box">
              <div className="cert-price-row">
                <div>
                  <span className="config-label">{t.certificates.summaryTitle}</span>
                  <div className="cert-price-total">
                    {totalPrice}
                    <span className="cert-price-currency">GEL</span>
                  </div>
                </div>
                <div className="badge badge-emerald">
                  <IconCheck size={14} />
                  <span>{t.certificates.freeDeliveryIncluded}</span>
                </div>
              </div>

              <ul className="cert-features-list">
                {t.certificates.featuresList.map((feature, idx) => (
                  <li key={idx}>
                    <IconCheck size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px 24px', fontSize: '16px' }}
                onClick={handleAddToCart}
              >
                <IconGift size={20} />
                <span>{t.certificates.addToCart}</span>
                <IconArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
