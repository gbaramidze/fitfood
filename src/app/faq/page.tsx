'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  IconSearch,
  IconChevronDown,
  IconPhone,
  IconTelegram,
  IconWhatsApp,
  IconShield,
  IconCheck,
} from '@/components/Icons';

interface FAQItem {
  id: string;
  category: 'delivery' | 'nutrition' | 'allergens' | 'storage' | 'payment' | 'certificates';
  question: {
    ru: string;
    ka: string;
    en: string;
  };
  answer: {
    ru: string;
    ka: string;
    en: string;
  };
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'del-1',
    category: 'delivery',
    question: {
      ru: 'Как и в какое время осуществляется доставка в Батуми?',
      ka: 'როგორ და რომელ საათებში ხორციელდება მიტანა ბათუმში?',
      en: 'How and at what hours does delivery operate in Batumi?',
    },
    answer: {
      ru: 'Доставка рационов осуществляется каждые 2 дня в утренний интервал с 06:00 до 11:00. Курьер привозит свежий набор на 2 дня вперед в термосумке прямо к вашей двери или на ресепшн отеля.',
      ka: 'მიტანა ხორციელდება ყოველ 2 დღეში ერთხელ დილის 06:00-დან 11:00 საათამდე. კურიერს მოაქვს 2 დღის ულუფა სპეციალური თერმოჩანთით თქვენს კარამდე ან სასტუმროს რეცეფციაზე.',
      en: 'Deliveries run every 2 days in the morning window between 06:00 and 11:00 AM. Couriers deliver fresh meals for 2 days in thermal insulated bags directly to your door or hotel front desk.',
    },
  },
  {
    id: 'del-2',
    category: 'delivery',
    question: {
      ru: 'Входит ли доставка в стоимость рационов?',
      ka: 'შედის თუ არა მიტანა რაციონის საფასურში?',
      en: 'Is delivery included in the meal plan price?',
    },
    answer: {
      ru: 'Да, доставка по Батуми (включая Новый Бульвар, Старый Город, Вокзал и Махинджаури) абсолютно бесплатна для всех программ от 2 дней.',
      ka: 'დიახ, მიტანა ბათუმის მასშტაბით (ახალი ბულვარი, ძველი ქალაქი, რკინიგზის სადგური, მახინჯაური) სრულიად უფასოა ყველა 2+ დღიან პაკეტზე.',
      en: 'Yes, delivery across Batumi (including New Boulevard, Old Town, Railway Station, and Makhinjauri) is 100% free on all plans from 2 days.',
    },
  },
  {
    id: 'nut-1',
    category: 'nutrition',
    question: {
      ru: 'Насколько точно рассчитаны калории и БЖУ?',
      ka: 'რამდენად ზუსტადაა დათვლილი კალორიები და ნუტრიენტები?',
      en: 'How accurate are the calories and macro calculations?',
    },
    answer: {
      ru: 'Каждая порция взвешивается на калиброванных весах с погрешностью не более ±3%. Меню составляется дипломированными нутрициологами с учетом точного баланса аминокислот, ненасыщенных жиров и сложных углеводов.',
      ka: 'თითოეული ულუფა იწონება კალიბრირებულ სასწორზე ±3% სიზუსტით. მენიუ შექმნილია დიეტოლოგების მიერ ცილების, ცხიმებისა და რთული ნახშირწყლების ზუსტი ბალანსით.',
      en: 'Every portion is measured on precision scales with a margin of under ±3%. Menus are developed by certified nutritionists with ideal balance of proteins, healthy fats, and low-GI complex carbs.',
    },
  },
  {
    id: 'nut-2',
    category: 'nutrition',
    question: {
      ru: 'Используете ли вы сахар или полуфабрикаты?',
      ka: 'იყენებთ თუ არა შაქარს ან ნახევარფაბრიკატებს?',
      en: 'Do you use refined sugar or frozen pre-made foods?',
    },
    answer: {
      ru: 'Категорически нет. Мы не используем рафинированный сахар, усилители вкуса (глутамат) или замороженные полуфабрикаты. Для сладости десертов применяются натуральные фрукты, ягоды и эритритол/стевия.',
      ka: 'კატეგორიულად არა. ჩვენ არ ვიყენებთ რაფინირებულ შაქარს, არომატიზატორებს ან გაყინულ ნახევარფაბრიკატებს. დესერტებში გამოიყენება მხოლოდ ნატურალური ხილი და სტევია.',
      en: 'Strictly no. We never use refined sugars, MSG flavor enhancers, or frozen factory pre-mixes. Desserts are sweetened exclusively with fresh fruits, berries, and natural erythritol/stevia.',
    },
  },
  {
    id: 'alg-1',
    category: 'allergens',
    question: {
      ru: 'Как исключить продукты, которые я не ем (аллергены и нелюбимые ингредиенты)?',
      ka: 'როგორ გამოვრიცხო პროდუქტები, რომლებსაც არ მივირთმევ (ალერგენები)?',
      en: 'How can I exclude ingredients I dislike or am allergic to?',
    },
    answer: {
      ru: 'В конфигураторе программ на шаге 3 нажмите «Исключить аллергены и продукты». Вы можете выбрать любые топ-аллергены (орехи, кунжут, молоко, яйца, рыбу) или ввести свои ингредиенты (например, кинзу или перец). Блюда с этими продуктами будут помечены предупреждением и их можно заменить в 1 клик.',
      ka: 'პროგრამის შერჩევისას მე-3 ეტაპზე დააჭირეთ «ალერგენების გამორიცხვა». შეგიძლიათ მონიშნოთ ალერგენები (თხილი, სეზამი, რძე, თევზი) ან ჩაწეროთ საკუთარი პროდუქტი (მაგ: ქინძი). ასეთი კერძები მოინიშნება და ჩანაცვლდება 1 კლიკით.',
      en: 'In the program configurator under Step 3, click "Exclude Allergens & Foods". You can check any major allergens (nuts, sesame, dairy, seafood) or type custom ingredients (e.g. cilantro, bell pepper). Dishes containing them are flagged and swappable in 1 click.',
    },
  },
  {
    id: 'sto-1',
    category: 'storage',
    question: {
      ru: 'Сколько хранятся блюда и как их разогревать?',
      ka: 'რამდენ ხანს ინახება კერძები და როგორ გავაცხელოთ?',
      en: 'How long do meals stay fresh and how to reheat them?',
    },
    answer: {
      ru: 'Благодаря технологии шокового охлаждения и газомодифицированной герметичной запайке (ГМС), блюда сохраняют свежесть и витамины до 72 часов в холодильнике при температуре +2...+4°C. Контейнеры изготовлены из безопасного пищевого полипропилена (05 PP) — снимите верхнюю пленку и разогревайте в микроволновке 1.5–2 минуты.',
      ka: 'შოკური გაგრილებისა და უჟანგბადო MAP-შეფუთვის წყალობით, კერძები ინარჩუნებს სიახლეს 72 საათის განმავლობაში მაცივარში (+2...+4°C). კონტეინერები დამზადებულია 05 PP პლასტმასისგან — მოხსენით ფირი და გააცხელეთ მიკროტალღურში 1.5–2 წუთი.',
      en: 'Thanks to blast chilling and oxygen-free MAP atmosphere sealing, dishes stay completely fresh in the fridge for up to 72 hours (+2...+4°C). The containers are certified food-grade 05 PP — just peel back the film and microwave for 1.5–2 minutes.',
    },
  },
  {
    id: 'pay-1',
    category: 'payment',
    question: {
      ru: 'Как оплатить заказ и можно ли заморозить доставку на время отъезда?',
      ka: 'როგორ გადავიხადო და შესაძლებელია თუ არა მიტანის გაყინვა გამგზავრებისას?',
      en: 'How can I pay and is it possible to pause/freeze deliveries while traveling?',
    },
    answer: {
      ru: 'Оплата доступна банковской картой онлайн (TBC / BOG / Visa / Mastercard), через Apple Pay или наличными курьеру при получении. Заморозить дни питания можно бесплатно в Личном кабинете или через Telegram за 24 часа до даты доставки.',
      ka: 'გადახდა შესაძლებელია ონლაინ საბანკო ბარათით (TBC / BOG / Visa / Mastercard), Apple Pay-ით ან ნაღდი ანგარიშსწორებით კურიერთან. მიტანის გაყინვა უფასოა პირად კაბინეტში ან Telegram-ით 24 საათით ადრე.',
      en: 'You can pay online via debit/credit cards (TBC / BOG / Visa / Mastercard), Apple Pay, or cash on delivery. You can pause/freeze delivery days for free in your Dashboard or via Telegram 24 hours in advance.',
    },
  },
  {
    id: 'crt-1',
    category: 'certificates',
    question: {
      ru: 'Как работают подарочные сертификаты и какой у них срок действия?',
      ka: 'როგორ მუშაობს სასაჩუქრე ბარათები და რა ვადა აქვთ?',
      en: 'How do gift certificates work and how long are they valid?',
    },
    answer: {
      ru: 'Вы можете заказать электронный сертификат (доставляется моментально) или премиальную пластиковую карту в подарочном боксе. Получатель может активировать рацион в любой день в течение 12 месяцев и выбрать любые удобные даты и адрес доставки.',
      ka: 'შეგიძლიათ შეიძინოთ ელექტრონული ბარათი (მყისიერად) ან პრემიუმ პლასტიკური ბარათი სასაჩუქრე ყუთით. მიმღებს შეუძლია გაააქტიუროს რაციონი 12 თვის განმავლობაში ნებისმიერ მისამართზე.',
      en: 'You can purchase an instant digital certificate or a luxury plastic card in an embossed gift box. The recipient can activate their nutrition plan anytime within 12 months for any delivery address.',
    },
  },
];

export default function FAQPage() {
  const { locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<string[]>(['del-1', 'nut-1']);

  const categories = [
    { id: 'all', label: { ru: 'Все вопросы', ka: 'ყველა კითხვა', en: 'All Questions' } },
    { id: 'delivery', label: { ru: 'Доставка и время', ka: 'მიტანა და დრო', en: 'Delivery & Timing' } },
    { id: 'nutrition', label: { ru: 'КБЖУ и рационы', ka: 'კალორიები და მენიუ', en: 'Macros & Menus' } },
    { id: 'allergens', label: { ru: 'Аллергены и стоп-лист', ka: 'ალერგენები & სტოპ-სია', en: 'Allergens & Exclusions' } },
    { id: 'storage', label: { ru: 'Хранение и разогрев', ka: 'შენახვა & გაცხელება', en: 'Storage & Microwave' } },
    { id: 'payment', label: { ru: 'Оплата и заморозка', ka: 'გადახდა & გაყინვა', en: 'Payment & Freeze' } },
    { id: 'certificates', label: { ru: 'Подарочные карты', ka: 'სასაჩუქრე ბარათები', en: 'Gift Cards' } },
  ];

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATA.filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const questionText = item.question[locale].toLowerCase();
      const answerText = item.answer[locale].toLowerCase();
      return questionText.includes(q) || answerText.includes(q);
    });
  }, [searchQuery, activeCategory, locale]);

  const toggleItem = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="faq-page">
      <div className="container">
        {/* Header */}
        <div className="faq-header">
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
            <IconShield size={14} />
            <span>
              {locale === 'ru' ? 'База знаний и помощь' : locale === 'ka' ? 'კითხვა-პასუხი & დახმარება' : 'Help & Knowledge Base'}
            </span>
          </div>

          <h1 className="faq-title">
            {locale === 'ru'
              ? 'Часто задаваемые вопросы'
              : locale === 'ka'
              ? 'ხშირად დასმული კითხვები'
              : 'Frequently Asked Questions'}
          </h1>

          <p className="faq-subtitle">
            {locale === 'ru'
              ? 'Все, что нужно знать о доставке, расчете КБЖУ, хранении и замене блюд в сервисе FitFood.'
              : locale === 'ka'
              ? 'ყველაფერი მიტანის, კალორიების გათვლის, შენახვისა და კერძების შეცვლის შესახებ.'
              : 'Everything you need to know about delivery windows, precision macros, storage, and meal swaps.'}
          </p>

          {/* Search Box */}
          <div className="faq-search-wrapper">
            <IconSearch size={18} className="faq-search-icon" />
            <input
              type="text"
              className="faq-search-input"
              placeholder={
                locale === 'ru'
                  ? 'Поиск по вопросам: доставка, калории, аллергены, разогрев...'
                  : locale === 'ka'
                  ? 'ძებნა კითხვებში: მიტანა, კალორიები, ალერგენები, გაცხელება...'
                  : 'Search questions: delivery, calories, allergens, microwave...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="faq-categories-row">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`faq-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.label[locale]}</span>
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="faq-accordion-list">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => {
              const isOpen = openIds.includes(item.id);
              return (
                <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-item-header"
                    onClick={() => toggleItem(item.id)}
                  >
                    <span className="faq-item-question">{item.question[locale]}</span>
                    <IconChevronDown size={18} className="faq-item-chevron" />
                  </button>
                  {isOpen && (
                    <div className="faq-item-body">
                      {item.answer[locale]}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {locale === 'ru' ? 'Ничего не найдено' : locale === 'ka' ? 'ვერაფერი მოიძებნა' : 'No results found'}
              </p>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
                {locale === 'ru'
                  ? 'Попробуйте изменить поисковый запрос или свяжитесь с поддержкой'
                  : locale === 'ka'
                  ? 'სცადეთ შეცვალოთ საძიებო სიტყვა ან დაუკავშირდით მხარდაჭერას'
                  : 'Try changing your search keywords or contact support'}
              </p>
              <a
                href="https://t.me/fitfood_batumi"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-flex', padding: '10px 22px', fontSize: '14px' }}
              >
                <span>{locale === 'ru' ? 'Написать в Telegram' : locale === 'ka' ? 'Telegram-ში მიწერა' : 'Message Telegram'}</span>
              </a>
            </div>
          )}
        </div>

        {/* Bottom Support Box */}
        <div style={{
          marginTop: '60px',
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '24px',
          padding: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          maxWidth: '800px',
          margin: '60px auto 0'
        }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
              {locale === 'ru'
                ? 'Остались вопросы? Служба заботы на связи'
                : locale === 'ka'
                ? 'გაქვთ კითხვები? ჩვენი გუნდი მზადაა დასახმარებლად'
                : 'Still have questions? Our care team is here'}
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              {locale === 'ru'
                ? 'Отвечаем за 2–3 минуты ежедневно с 07:00 до 22:00'
                : locale === 'ka'
                ? 'გპასუხობთ 2–3 წუთში ყოველდღე 07:00-დან 22:00-მდე'
                : 'We respond in 2–3 minutes daily 07:00 – 22:00'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://t.me/fitfood_batumi"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <IconTelegram size={16} />
              <span>Telegram</span>
            </a>
            <a
              href="tel:+995599000000"
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '14px', background: '#1E293B', color: '#FFFFFF', borderColor: '#334155' }}
            >
              <IconPhone size={16} />
              <span>+995 599 00-00-00</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
