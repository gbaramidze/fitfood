'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import {
  IconPhone,
  IconTelegram,
  IconWhatsApp,
  IconMapPin,
  IconClock,
  IconCheck,
} from '@/components/Icons';

export default function ContactsPage() {
  const { locale } = useLanguage();
  const { showToast } = useStore();

  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formType, setFormType] = useState('support');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContact.trim()) return;

    setIsSubmitted(true);
    showToast(
      locale === 'ru'
        ? 'Сообщение успешно отправлено! Мы свяжемся с вами в течение 10 минут.'
        : locale === 'ka'
        ? 'შეტყობინება წარმატებით გაიგზავნა! მალე დაგიკავშირდებით.'
        : 'Message sent! We will get in touch within 10 minutes.'
    );
  };

  const deliveryZones = [
    {
      name: {
        ru: 'Зона 1: Центр и Старый Бульвар',
        ka: 'ზონა 1: ცენტრი & ძველი ბულვარი',
        en: 'Zone 1: Center & Old Boulevard',
      },
      coverage: {
        ru: 'Ул. Руставели, Горгиладзе, Меликишвили, Порт',
        ka: 'რუსთაველის, გორგილაძის, მელიქიშვილის ქუჩები, პორტი',
        en: 'Rustaveli, Gorgiladze, Melikishvili, Sea Port',
      },
      price: {
        ru: 'Бесплатная доставка от 2 дней',
        ka: 'უფასო მიტანა 2+ დღეზე',
        en: 'Free delivery (2+ days)',
      },
    },
    {
      name: {
        ru: 'Зона 2: Новый Бульвар и Аэропорт',
        ka: 'ზონა 2: ახალი ბულვარი & აეროპორტი',
        en: 'Zone 2: New Boulevard & Airport',
      },
      coverage: {
        ru: 'Orbi City, Alliance Palace, ул. Тბელ-Абусеридзе',
        ka: 'Orbi City, Alliance Palace, ტბელ-აბუსერიძის ქუჩა',
        en: 'Orbi City, Alliance Palace, Tbel-Abuseridze',
      },
      price: {
        ru: 'Бесплатная доставка от 2 дней',
        ka: 'უფასო მიტანა 2+ დღეზე',
        en: 'Free delivery (2+ days)',
      },
    },
    {
      name: {
        ru: 'Зона 3: Махинджаури и Ботанический Сад',
        ka: 'ზონა 3: მახინჯაური & ბოტანიკური ბაღი',
        en: 'Zone 3: Makhinjauri & Botanical Garden',
      },
      coverage: {
        ru: 'Вокзал, Зеленый Мыс, Махинджаури',
        ka: 'რკინიგზის სადგური, მწვანე კონცხი, მახინჯაური',
        en: 'Railway Station, Mtsvane Kontskhi, Makhinjauri',
      },
      price: {
        ru: 'Бесплатно от 6 дней (5 ₾ на 2 дня)',
        ka: 'უფასო 6+ დღეზე (5 ₾ 2 დღეზე)',
        en: 'Free on 6+ days (5 GEL for 2 days)',
      },
    },
    {
      name: {
        ru: 'Зона 4: Гонио и Квариати',
        ka: 'ზონა 4: გონიო & კვარიათი',
        en: 'Zone 4: Gonio & Kvariati',
      },
      coverage: {
        ru: 'Побережье Гонио, Квариати, Сарпи',
        ka: 'გონიოს სანაპირო, კვარიათი, სარფი',
        en: 'Gonio Coastline, Kvariati, Sarpi',
      },
      price: {
        ru: '10 ₾ за доставку (каждые 2 дня)',
        ka: '10 ₾ ყოველ მიტანაზე',
        en: '10 GEL per delivery',
      },
    },
  ];

  return (
    <div className="contacts-page">
      <div className="container">
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0F172A',
            color: '#CCFF00',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px'
          }}>
            <IconMapPin size={14} />
            <span>
              {locale === 'ru' ? 'Контакты и доставка' : locale === 'ka' ? 'კონტაქტი & მიტანა' : 'Contacts & Delivery'}
            </span>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            {locale === 'ru'
              ? 'Свяжитесь с командой FitFood в Батуми'
              : locale === 'ka'
              ? 'დაუკავშირდით FitFood-ის გუნდს ბათუმში'
              : 'Get in Touch with FitFood in Batumi'}
          </h1>

          <p style={{ fontSize: '16px', color: '#64748B' }}>
            {locale === 'ru'
              ? 'Служба заботы о клиентах, корпоративное питание для IT-компаний и зона доставки.'
              : locale === 'ka'
              ? 'მომხმარებელთა მხარდაჭერა, კორპორატიული კვება კომპანიებისთვის და მიტანის ზონები.'
              : 'Customer care service, corporate catering for businesses, and delivery coverage.'}
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="contacts-grid-layout">
          {/* Left Column: Direct Contacts & Delivery Zones */}
          <div>
            <div className="contacts-card">
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '24px' }}>
                {locale === 'ru' ? 'Служба заботы и офис' : locale === 'ka' ? 'კონტაქტები & ოფისი' : 'Customer Care & Office'}
              </h2>

              <div className="contacts-info-row">
                <div className="contacts-icon-box">
                  <IconPhone size={20} />
                </div>
                <div>
                  <div className="contacts-info-title">{locale === 'ru' ? 'Горячая линия' : locale === 'ka' ? 'ტელეფონი' : 'Direct Line'}</div>
                  <a href="tel:+995599000000" className="contacts-info-text" style={{ color: '#0F172A' }}>
                    +995 599 00-00-00
                  </a>
                  <div className="contacts-info-sub">{locale === 'ru' ? 'Ежедневно 07:00 – 22:00' : locale === 'ka' ? 'ყოველდღე 07:00 – 22:00' : 'Daily 07:00 – 22:00'}</div>
                </div>
              </div>

              <div className="contacts-info-row">
                <div className="contacts-icon-box" style={{ background: '#0284C7', color: '#FFFFFF' }}>
                  <IconTelegram size={20} />
                </div>
                <div>
                  <div className="contacts-info-title">Telegram & WhatsApp</div>
                  <a href="https://t.me/fitfood_batumi" target="_blank" rel="noopener noreferrer" className="contacts-info-text" style={{ color: '#0284C7' }}>
                    @fitfood_batumi
                  </a>
                  <div className="contacts-info-sub">{locale === 'ru' ? 'Быстрый ответ оператора за 2 минуты' : locale === 'ka' ? 'სწრაფი პასუხი 2 წუთში' : 'Quick reply in under 2 mins'}</div>
                </div>
              </div>

              <div className="contacts-info-row">
                <div className="contacts-icon-box">
                  <IconMapPin size={20} />
                </div>
                <div>
                  <div className="contacts-info-title">{locale === 'ru' ? 'Адрес кухни и цеха' : locale === 'ka' ? 'მისამართი' : 'Production Kitchen'}</div>
                  <div className="contacts-info-text">
                    {locale === 'ru'
                      ? 'г. Батуми, пр. Руставели, 24 / ул. Горгиладзе'
                      : locale === 'ka'
                      ? 'ბათუმი, რუსთაველის გამზ. 24 / გორგილაძის ქ.'
                      : '24 Rustaveli Ave / Gorgiladze St, Batumi, Georgia'}
                  </div>
                  <div className="contacts-info-sub">{locale === 'ru' ? 'Курьерский хаб и сертифицированный цех' : locale === 'ka' ? 'სამზარეულო და კურიერული ჰაბი' : 'Courier dispatch hub & certified kitchen'}</div>
                </div>
              </div>

              <div className="contacts-info-row" style={{ marginBottom: 0 }}>
                <div className="contacts-icon-box">
                  <IconClock size={20} />
                </div>
                <div>
                  <div className="contacts-info-title">{locale === 'ru' ? 'Интервал доставки' : locale === 'ka' ? 'მიტანის დრო' : 'Delivery Window'}</div>
                  <div className="contacts-info-text">06:00 – 11:00</div>
                  <div className="contacts-info-sub">{locale === 'ru' ? 'Каждые 2 дня прямо к вашей двери' : locale === 'ka' ? 'ყოველ 2 დღეში ერთხელ კარამდე' : 'Every 2 days to your door'}</div>
                </div>
              </div>
            </div>

            {/* Delivery Zones */}
            <div className="contacts-card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                {locale === 'ru' ? 'Зоны доставки по Батуми' : locale === 'ka' ? 'მიტანის ზონები ბათუმში' : 'Batumi Delivery Zones'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                {locale === 'ru'
                  ? 'Доставляем во все районы города, жилые комплексы и отели'
                  : locale === 'ka'
                  ? 'მიგვაქვს ქალაქის ყველა უბანში, საცხოვრებელ კომპლექსებსა და სასტუმროებში'
                  : 'We deliver to all city districts, residential buildings, and hotels'}
              </p>

              <div className="contacts-zones-grid">
                {deliveryZones.map((z, zi) => (
                  <div key={zi} className="contacts-zone-item">
                    <div className="contacts-zone-name">{z.name[locale]}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{z.coverage[locale]}</div>
                    <div className="contacts-zone-price">{z.price[locale]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Feedback & Corporate Catering Form */}
          <div className="contacts-card">
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              {locale === 'ru' ? 'Напишите нам' : locale === 'ka' ? 'მოგვწერეთ' : 'Send Us a Message'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
              {locale === 'ru'
                ? 'Задайте вопрос, оставьте отзыв или запросите расчет корпоративного питания для компании.'
                : locale === 'ka'
                ? 'დასვით კითხვა ან მოითხოვეთ კორპორატიული კვების გათვლა თქვენი ოფისისთვის.'
                : 'Ask a question, share feedback, or request custom corporate meal prep for your office.'}
            </p>

            {isSubmitted ? (
              <div style={{
                background: '#ECFDF5',
                border: '1.5px solid #10B981',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: '#065F46'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10B981', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <IconCheck size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
                  {locale === 'ru' ? 'Спасибо за обращение!' : locale === 'ka' ? 'მადლობა მომართვისთვის!' : 'Thank you!'}
                </h3>
                <p style={{ fontSize: '14px' }}>
                  {locale === 'ru'
                    ? 'Менеджер свяжется с вами в течение 10 минут.'
                    : locale === 'ka'
                    ? 'მენეჯერი დაგიკავშირდებათ 10 წუთში.'
                    : 'Our manager will contact you within 10 minutes.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {locale === 'ru' ? 'Ваше имя:' : locale === 'ka' ? 'თქვენი სახელი:' : 'Your Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    className="faq-search-input"
                    style={{ padding: '12px 16px' }}
                    placeholder={locale === 'ru' ? 'Например: Георгий' : locale === 'ka' ? 'მაგ: გიორგი' : 'e.g. George'}
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {locale === 'ru' ? 'Телефон или Telegram:' : locale === 'ka' ? 'ტელეფონი ან Telegram:' : 'Phone or Telegram:'}
                  </label>
                  <input
                    type="text"
                    required
                    className="faq-search-input"
                    style={{ padding: '12px 16px' }}
                    placeholder="+995 599 00-00-00 / @username"
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {locale === 'ru' ? 'Тема обращения:' : locale === 'ka' ? 'თემა:' : 'Inquiry Topic:'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'support', label: { ru: 'Вопрос по рациону', ka: 'შეკითხვა კვებაზე', en: 'Diet Inquiry' } },
                      { id: 'corporate', label: { ru: 'Корпоративное / IT', ka: 'კორპორატიული', en: 'Corporate Catering' } },
                      { id: 'feedback', label: { ru: 'Отзыв / Предложение', ka: 'შეფასება', en: 'Feedback' } },
                      { id: 'partner', label: { ru: 'Сотрудничество', ka: 'თანამშრომლობა', en: 'Partnership' } },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormType(t.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: formType === t.id ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: formType === t.id ? '#0F172A' : '#F8FAFC',
                          color: formType === t.id ? '#FFFFFF' : '#0F172A',
                          fontSize: '12px',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}
                      >
                        {t.label[locale]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {locale === 'ru' ? 'Сообщение:' : locale === 'ka' ? 'შეტყობინება:' : 'Message:'}
                  </label>
                  <textarea
                    rows={4}
                    className="faq-search-input"
                    style={{ padding: '12px 16px', resize: 'vertical' }}
                    placeholder={
                      locale === 'ru'
                        ? 'Опишите ваш вопрос или пожелание...'
                        : locale === 'ka'
                        ? 'აღწერეთ თქვენი შეკითხვა...'
                        : 'Describe your inquiry...'
                    }
                    value={formMessage}
                    onChange={e => setFormMessage(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '6px' }}
                >
                  <span>{locale === 'ru' ? 'Отправить сообщение' : locale === 'ka' ? 'გაგზავნა' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
