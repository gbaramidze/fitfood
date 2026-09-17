'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { IconPhone, IconCheck } from '@/components/Icons';

interface CallbackModalProps {
  onClose: () => void;
}

export const CallbackModal: React.FC<CallbackModalProps> = ({ onClose }) => {
  const { locale } = useLanguage();
  const [phone, setPhone] = useState('+995 ');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length > 6) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window-modern" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '32px' }}>
        <button type="button" className="modal-close-btn" onClick={onClose} style={{ top: '16px', right: '16px', background: '#F1F5F9', color: '#0F172A' }}>
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              {locale === 'ru' ? 'Заявка принята!' : locale === 'ka' ? 'მოთხოვნა მიღებულია!' : 'Request Received!'}
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              {locale === 'ru' ? 'Наш менеджер свяжется с вами в течение 5 минут.' : locale === 'ka' ? 'მენეჯერი დაგიკავშირდებათ 5 წუთში.' : 'Our manager will contact you within 5 minutes.'}
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F1F5F9',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '16px'
            }}>
              <IconPhone size={14} />
              <span>{locale === 'ru' ? 'Быстрая консультация' : locale === 'ka' ? 'კონსულტაცია' : 'Quick Call'}</span>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#0F172A' }}>
              {locale === 'ru' ? 'Перезвоните мне' : locale === 'ka' ? 'დამირეკეთ' : 'Request a Callback'}
            </h3>
            
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
              {locale === 'ru' ? 'Оставьте номер телефона, и мы поможем подобрать идеальную программу питания.' : locale === 'ka' ? 'დატოვეთ ნომერი და დაგეხმარებით რაციონის შერჩევაში.' : 'Leave your phone number and we will help you choose the ideal meal plan.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  {locale === 'ru' ? 'Ваше имя' : locale === 'ka' ? 'თქვენი სახელი' : 'Your Name'}
                </label>
                <input
                  type="text"
                  placeholder={locale === 'ru' ? 'Например, Георгий' : 'Name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  {locale === 'ru' ? 'Номер телефона' : locale === 'ka' ? 'ტელეფონის ნომერი' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '14px' }}
              >
                {locale === 'ru' ? 'Заказать звонок' : locale === 'ka' ? 'ზარის მოთხოვნა' : 'Call Me Back'}
              </button>

              <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '4px' }}>
                {locale === 'ru' ? 'Нажимая кнопку, вы соглашаетесь на обработку персональных данных' : 'By clicking you agree to our privacy policy'}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
