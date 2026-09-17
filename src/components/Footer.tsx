'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { IconTelegram, IconWhatsApp, IconPhone, IconShield } from '@/components/Icons';

export const Footer: React.FC = () => {
  const { locale } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid-3col">
          {/* Col 1: Brand & Values */}
          <div>
            <Link href="/" className="header-logo" style={{ color: '#FFFFFF', marginBottom: '16px', display: 'inline-flex' }}>
              <span className="header-logo-badge">FIT</span>
              <span>FOOD</span>
            </Link>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, marginBottom: '20px', color: '#94A3B8', maxWidth: '360px' }}>
              {locale === 'ru'
                ? 'Сервис умной доставки готового правильного питания в Батуми. Точный расчет КБЖУ, ресторанный вкус блюд и ежедневный контроль пищевой безопасности.'
                : locale === 'ka'
                ? 'ჯანსაღი მზა კვების მიტანის სერვისი ბათუმში. ზუსტი კალორიების გათვლა, რესტორნის დონის გემო და სურსათის უვნებლობის უმაღლესი სტანდარტები.'
                : 'Smart gourmet meal-prep delivery in Batumi. Precision macro balance, restaurant-grade flavor, and daily food safety inspections.'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="https://t.me/fitfood_batumi"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn tg"
                title="Telegram"
                style={{ background: '#1E293B', color: '#FFFFFF' }}
              >
                <IconTelegram size={18} />
              </a>
              <a
                href="https://wa.me/995599000000"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn wa"
                title="WhatsApp"
                style={{ background: '#1E293B', color: '#FFFFFF' }}
              >
                <IconWhatsApp size={18} />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="footer-col-title">
              {locale === 'ru' ? 'Разделы сайта' : locale === 'ka' ? 'ნავიგაცია' : 'Navigation'}
            </h4>
            <ul className="footer-links-list">
              <li>
                <Link href="/#programs" className="footer-link">
                  {locale === 'ru' ? 'Программы питания' : locale === 'ka' ? 'რაციონები' : 'Meal Plans'}
                </Link>
              </li>
              <li>
                <Link href="/menu" className="footer-link">
                  {locale === 'ru' ? 'Меню на неделю' : locale === 'ka' ? 'კვირის მენიუ' : 'Weekly Menu'}
                </Link>
              </li>
              <li>
                <Link href="/quality" className="footer-link">
                  {locale === 'ru' ? 'Стандарты качества и цех' : locale === 'ka' ? 'ხარისხის სტანდარტები' : 'Quality Standards'}
                </Link>
              </li>
              <li>
                <Link href="/certificates" className="footer-link">
                  {locale === 'ru' ? 'Подарочные сертификаты' : locale === 'ka' ? 'სასაჩუქრე ბარათები' : 'Gift Cards'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="footer-link">
                  {locale === 'ru' ? 'Вопросы и ответы (FAQ)' : locale === 'ka' ? 'კითხვა-პასუხი (FAQ)' : 'FAQ'}
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="footer-link">
                  {locale === 'ru' ? 'Контакты и доставка' : locale === 'ka' ? 'კონტაქტი & მიტანა' : 'Contacts & Delivery'}
                </Link>
              </li>
              <li>
                <Link href="/account" className="footer-link">
                  {locale === 'ru' ? 'Личный кабинет' : locale === 'ka' ? 'პირადი კაბინეტი' : 'Dashboard'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Contacts */}
          <div>
            <h4 className="footer-col-title">
              {locale === 'ru' ? 'Служба заботы' : locale === 'ka' ? 'კონტაქტები' : 'Customer Care'}
            </h4>
            <div style={{ fontSize: '13.5px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <a href="tel:+995599000000" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '16px' }}>
                +995 599 00-00-00
              </a>
              <div>support@fitfood.ge</div>
              <div>
                {locale === 'ru'
                  ? 'Служба заботы: ежедневно 07:00 – 22:00'
                  : locale === 'ka'
                  ? 'მხარდაჭერა: ყოველდღე 07:00 – 22:00'
                  : 'Support: Daily 07:00 – 22:00'}
              </div>
              <div>
                {locale === 'ru'
                  ? 'г. Батуми, пр. Руставели, 24'
                  : locale === 'ka'
                  ? 'ბათუმი, რუსთაველის გამზ. 24'
                  : '24 Rustaveli Ave, Batumi, Georgia'}
              </div>
            </div>

            {/* Payment badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', background: '#181C22', border: '1px solid #262C36', borderRadius: '6px', fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                Apple Pay / Google Pay
              </span>
              <span style={{ padding: '4px 10px', background: '#181C22', border: '1px solid #262C36', borderRadius: '6px', fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                Visa / MasterCard
              </span>
              <span style={{ padding: '4px 10px', background: '#181C22', border: '1px solid #262C36', borderRadius: '6px', fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                TBC & BOG
              </span>
            </div>
          </div>
        </div>

        {/* Medical & Nutrition Guidance Disclaimer */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px',
          marginTop: '32px',
          marginBottom: '20px',
          fontSize: '11.5px',
          lineHeight: 1.6,
          color: '#64748B',
        }}>
          <strong style={{ color: '#94A3B8' }}>
            {locale === 'ru' ? 'Предупреждение:' : locale === 'ka' ? 'გაფრთხილება:' : 'Health Disclaimer:'}
          </strong>{' '}
          {locale === 'ru'
            ? 'Информация на сайте и расчеты рациона носят исключительно ознакомительный и рекомендательный характер и не являются медицинской консультацией. Индивидуальные результаты снижения веса могут отличаться. Перед началом программы рекомендуется консультация врача-эндокринолога или диетолога.'
            : locale === 'ka'
            ? 'საიტზე განთავსებული ინფორმაცია და კალორიების გათვლები ატარებს სარეკომენდაციო ხასიათს და არ წარმოადგენს სამედიცინო დანიშნულებას. შედეგი ინდივიდუალურია. რეკომენდებულია ექიმ-ენდოკრინოლოგის კონსულტაცია.'
            : 'The information and nutritional calculations on this site are for guidance purposes only and do not constitute medical advice. Individual results may vary. Consulting an endocrinologist or dietitian is recommended.'}
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} FitFood Georgia. {locale === 'ru' ? 'Все права защищены.' : locale === 'ka' ? 'ყველა უფლება დაცულია.' : 'All rights reserved.'}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconShield size={14} style={{ color: '#CCFF00' }} />
              HACCP & ISO 22000 Certified
            </span>
            <span>Food-Tech Smart Delivery Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
