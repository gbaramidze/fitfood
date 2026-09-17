'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  IconShield,
  IconLeaf,
  IconChef,
  IconBox,
  IconTruck,
  IconCheck,
  IconSparkles,
  IconFlame,
  IconClock,
} from '@/components/Icons';

export default function QualityPage() {
  const { locale } = useLanguage();

  const metrics = [
    {
      val: '15 000+',
      label: {
        ru: 'Доставлено рационов',
        ka: 'მიტანილი რაციონი',
        en: 'Delivered Meal Plans',
      },
      desc: {
        ru: 'Доверие клиентов в Батуми',
        ka: 'მომხმარებელთა ნდობა ბათუმში',
        en: 'Client trust in Batumi',
      },
    },
    {
      val: '100%',
      label: {
        ru: 'Стерильная чистая зона',
        ka: 'სტერილური სუფთა ზონა',
        en: 'Sterile Cleanroom Facility',
      },
      desc: {
        ru: 'Стандарты HACCP и санитарный контроль',
        ka: 'HACCP სტანდარტები და კონტროლი',
        en: 'HACCP & hygiene certifications',
      },
    },
    {
      val: '-35°C',
      label: {
        ru: 'Шоковое охлаждение',
        ka: 'შოკური გაგრილება',
        en: 'Blast Chilling Technology',
      },
      desc: {
        ru: 'Мгновенная остановка бактериальных процессов',
        ka: 'ბაქტერიების განვითარების შეჩერება',
        en: 'Instant lock-in of nutrients & freshness',
      },
    },
    {
      val: '72 ч',
      label: {
        ru: 'Свежесть в ГМС-упаковке',
        ka: 'სიახლე MAP-შეფუთვაში',
        en: 'MAP Sealing Freshness',
      },
      desc: {
        ru: 'Без капли консервантов',
        ka: 'ნულოვანი კონსერვანტები',
        en: 'Zero artificial preservatives',
      },
    },
  ];

  const steps = [
    {
      num: '01',
      icon: <IconLeaf size={28} />,
      title: {
        ru: 'Отборные фермерские продукты и входной контроль',
        ka: 'ფერმერული ინგრედიენტები და კონტროლი',
        en: 'Organic Farm Sourcing & Quality Inspection',
      },
      text: {
        ru: 'Каждое утро к 05:00 на производство поступает свежее фермерское мясо птицы, телятина, лосось, зелень и овощи. Шеф-контролер проверяет сертификаты и органолептические свойства каждой партии.',
        ka: 'ყოველ დილით სამზარეულოში შემოდის ახალი ფერმერული ხორცი, თევზი და ბოსტნეული. მოწმდება თითოეული პარტიის ხარისხი და სერტიფიკატები.',
        en: 'Every morning at 05:00, fresh farm poultry, lean beef, salmon, greens, and produce arrive. Our quality controller inspects batch certifications and freshness.',
      },
      pills: [
        { ru: 'Без заморозки', ka: 'გაუყინავი', en: 'Fresh only' },
        { ru: 'Местные эко-фермы', ka: 'ადგილობრივი ფერმები', en: 'Local farms' },
        { ru: 'Входной ветконтроль', ka: 'ვეტკონტროლი', en: 'Lab certified' },
      ],
    },
    {
      num: '02',
      icon: <IconFlame size={28} />,
      title: {
        ru: 'Точный расчет КБЖУ и рецептуры нутрициологов',
        ka: 'ზუსტი კალორიების და ნუტრიენტების გათვლა',
        en: 'Precision Macro Calculations by Nutritionists',
      },
      text: {
        ru: 'Каждое блюдо взвешивается на калиброванных весах с точностью до 1 грамма. Идеальный баланс нутриентов, минералов и клетчатки без сахара и трансжиров.',
        ka: 'ყველა კერძი იწონება 1 გრამის სიზუსტით. იდეალური ბალანსი ცილების, ცხიმების და ნახშირწყლების შაქრისა და მავნე ცხიმების გარეშე.',
        en: 'Every single meal is portioned on calibrated scales down to 1 gram. Exact macronutrient ratio with zero refined sugar and zero trans fats.',
      },
      pills: [
        { ru: 'Точность ±3%', ka: 'სიზუსტე ±3%', en: '±3% Precision' },
        { ru: 'Ноль сахара', ka: 'ნულოვანი შაქარი', en: 'Zero sugar' },
        { ru: 'Шеф-рецепты', ka: 'შეფ-რეცეპტები', en: 'Chef recipes' },
      ],
    },
    {
      num: '03',
      icon: <IconChef size={28} />,
      title: {
        ru: 'Щадящее приготовление: Sous-Vide, пар и гриль',
        ka: 'მომზადება: Sous-Vide, ორთქლი და გრილი',
        en: 'Gentle Cooking: Sous-Vide, Steam & Grill',
      },
      text: {
        ru: 'Мы не жарим на перегретом масле. Мясо готовится при точной температуре в вакууме методом Sous-Vide, сохраняя природную сочность, витамины и легкоусвояемый белок.',
        ka: 'არ ვიყენებთ ზეთში შეწვას. ხორცი მზადდება დაბალ ტემპერატურაზე ვაკუუმში (Sous-Vide), რაც ინარჩუნებს ვიტამინებსა და ცილას.',
        en: 'We never fry with reused oils. Meats and poultry are gently slow-cooked in vacuum bags (Sous-Vide), preserving natural juiciness and vital amino acids.',
      },
      pills: [
        { ru: 'Без канцерогенов', ka: 'კანცეროგენების გარეშე', en: 'No carcinogens' },
        { ru: 'Sous-Vide 58-64°C', ka: 'Sous-Vide 58-64°C', en: 'Sous-Vide 58-64°C' },
        { ru: 'Максимум витаминов', ka: 'მაქსიმალური ვიტამინები', en: 'Maximum vitamins' },
      ],
    },
    {
      num: '04',
      icon: <IconBox size={28} />,
      title: {
        ru: 'Шоковое охлаждение и запайка в ГМС (MAP)',
        ka: 'შოკური გაგრილება და MAP-შეფუთვა',
        en: 'Blast Chilling & MAP Atmosphere Sealing',
      },
      text: {
        ru: 'Готовое горячее блюдо за 20 минут охлаждается в камере шокового охлаждения от +80°C до +2°C. Затем контейнер герметично запаивается в газомодифицированной среде без кислорода.',
        ka: 'მზა ცხელი კერძი 20 წუთში გრილდება +2°C-მდე და ილუქება უჟანგბადო გარემოში (MAP), რაც უზრუნველყოფს 72-საათიან სიახლეს.',
        en: 'Freshly cooked dishes drop from +80°C to +2°C in 20 minutes inside our blast freezer. Containers are hermetically sealed under food-grade modified atmosphere without oxygen.',
      },
      pills: [
        { ru: 'Хранение 72 часа', ka: 'შენახვა 72 სთ', en: '72h Freshness' },
        { ru: 'Эко-полипропилен (PP 05)', ka: 'ეკო-კონტეინერი (PP 05)', en: 'BPA-Free PP 05' },
        { ru: 'Стерильно', ka: 'სტერილური', en: 'Sterile seal' },
      ],
    },
    {
      num: '05',
      icon: <IconTruck size={28} />,
      title: {
        ru: 'Непрерывная холодовая цепь и утренняя доставка',
        ka: 'უწყვეტი ცივი ჯაჭვი და დილის მიტანა',
        en: 'Continuous Cold Chain & Morning Delivery',
      },
      text: {
        ru: 'От момента упаковки до вашей двери температура контейнера строго поддерживается в диапазоне +2...+4°C благодаря термосумкам с хладагентами и авторефрижераторам.',
        ka: 'შეფუთვიდან თქვენს კარამდე ტემპერატურა მკაცრად კონტროლდება (+2...+4°C) სპეციალური თერმოჩანთებითა და მაცივარ-მანქანებით.',
        en: 'From packaging to your doorstep, temperature stays strictly between +2...+4°C inside specialized thermal bags with ice packs.',
      },
      pills: [
        { ru: 'Температура +2...+4°C', ka: 'ტემპერატურა +2...+4°C', en: 'Temp +2...+4°C' },
        { ru: 'Доставка с 06:00', ka: 'მიტანა 06:00-დან', en: 'From 06:00 AM' },
        { ru: 'До двери или отеля', ka: 'კარამდე / სასტუმროში', en: 'To door or hotel' },
      ],
    },
  ];

  const standards = [
    {
      title: {
        ru: 'Бактерицидная HEPA-фильтрация воздуха',
        ka: 'ჰაერის ბაქტერიციდული HEPA ფილტრაცია',
        en: 'Bactericidal HEPA Air Filtration',
      },
      desc: {
        ru: 'Воздух в производственной зоне очищается через фильтры высокой очистки и УФ-рециркуляторы 24/7.',
        ka: 'სამზარეულოს ჰაერი 24/7 სუფთავდება მაღალი დონის HEPA ფილტრებითა და ულტრაიისფერი ნათურებით.',
        en: 'Kitchen air is continuously purified through medical-grade HEPA filters and UV recirculation systems 24/7.',
      },
    },
    {
      title: {
        ru: 'Многоступенчатая водоподготовка',
        ka: 'წყლის მრავალსაფეხურიანი გაწმენდა',
        en: 'Multi-Stage Reverse Osmosis Water',
      },
      desc: {
        ru: 'Вся вода для приготовления супов, каш и напитков проходит 5 ступеней очистки и минерализации.',
        ka: 'საკვების მოსამზადებლად გამოყენებული მთელი წყალი გადის 5-ეტაპიან ოსმოსურ გაწმენდას.',
        en: 'All cooking water undergoes 5-stage reverse osmosis filtration and natural remineralization.',
      },
    },
    {
      title: {
        ru: 'Безопасный эко-пластик (BPA Free)',
        ka: 'უსაფრთხო ეკო-პლასტმასი (BPA Free)',
        en: 'Safe BPA-Free Food-Grade Plastic',
      },
      desc: {
        ru: 'Наши лотки из полипропилена марки 05 PP подходят для разогрева в СВЧ и на 100% пригодны для вторичной переработки.',
        ka: 'კონტეინერები დამზადებულია 05 PP პოლიპროპილენისგან, უსაფრთხოა მიკროტალღურში და 100%-ით ეკოლოგიურია.',
        en: 'Our 05 PP containers are certified microwave-safe, release zero microplastics when heated, and are 100% recyclable.',
      },
    },
    {
      title: {
        ru: 'Санитарный контроль персонала',
        ka: 'პერსონალის სანიტარული კონტროლი',
        en: 'Daily Staff Medical & Hygiene Audits',
      },
      desc: {
        ru: 'Стерильная спецодежда, перчатки, маски и ежедневный входной медосмотр каждого повара перед сменой.',
        ka: 'სტერილური უნიფორმა, ხელთათმანები, პირბადეები და ყოველდღიური სამედიცინო შემოწმება.',
        en: 'Sterile sanitary suits, gloves, masks, and mandatory daily medical check-ins before entering kitchen zones.',
      },
    },
  ];

  return (
    <div className="quality-page">
      {/* Hero */}
      <section className="quality-hero">
        <div className="container">
          <div className="quality-badge">
            <IconShield size={14} />
            <span>
              {locale === 'ru'
                ? 'Стандарты пищевой безопасности HACCP & ISO'
                : locale === 'ka'
                ? 'სურსათის უვნებლობის HACCP & ISO სტანდარტები'
                : 'HACCP & ISO Food Safety Standards'}
            </span>
          </div>

          <h1 className="quality-title">
            {locale === 'ru'
              ? 'Как мы готовим идеальную здоровую еду в Батуми'
              : locale === 'ka'
              ? 'როგორ ვამზადებთ იდეალურ ჯანსაღ კვებას ბათუმში'
              : 'How We Cook Peak Nutrition Food in Batumi'}
          </h1>

          <p className="quality-subtitle">
            {locale === 'ru'
              ? 'Современный технологичный цех, 5 ступеней контроля качества, шоковое охлаждение и нулевое использование консервантов.'
              : locale === 'ka'
              ? 'თანამედროვე ტექნოლოგიური სამზარეულო, ხარისხის 5-ეტაპიანი კონტროლი, შოკური გაგრილება და ნულოვანი კონსერვანტები.'
              : 'High-tech certified production kitchen, 5-stage quality audit, blast chilling, and zero chemical preservatives.'}
          </p>

          {/* Metrics */}
          <div className="quality-metrics-grid">
            {metrics.map((m, i) => (
              <div key={i} className="quality-metric-card">
                <div className="quality-metric-val">{m.val}</div>
                <div className="quality-metric-label">{m.label[locale]}</div>
                <div className="quality-metric-desc">{m.desc[locale]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Quality Tour */}
      <section className="quality-flow-section">
        <div className="container">
          <div className="quality-section-head">
            <span className="quality-section-tag">
              {locale === 'ru' ? 'Технологический процесс' : locale === 'ka' ? 'ტექნოლოგიური პროცესი' : 'Production Process'}
            </span>
            <h2 className="quality-section-title">
              {locale === 'ru'
                ? '5 этапов создания вашего рациона'
                : locale === 'ka'
                ? 'თქვენი რაციონის მომზადების 5 ეტაპი'
                : '5 Stages of Preparing Your Meal Plan'}
            </h2>
          </div>

          <div className="quality-steps-grid">
            {steps.map((step, idx) => (
              <div key={idx} className="quality-step-box">
                <span className="quality-step-num">{step.num}</span>
                <div className="quality-step-icon">{step.icon}</div>
                <h3 className="quality-step-heading">{step.title[locale]}</h3>
                <p className="quality-step-text">{step.text[locale]}</p>
                <div className="quality-step-pills">
                  {step.pills.map((pill, pi) => (
                    <span key={pi} className="quality-step-pill">
                      {pill[locale]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hygiene Standards */}
          <div style={{ marginTop: '80px' }}>
            <div className="quality-section-head" style={{ marginBottom: '32px' }}>
              <span className="quality-section-tag">
                {locale === 'ru' ? 'Чистота и стерильность' : locale === 'ka' ? 'სისუფთავე და სტერილურობა' : 'Hygiene & Cleanroom'}
              </span>
              <h2 className="quality-section-title" style={{ fontSize: '28px' }}>
                {locale === 'ru'
                  ? 'Лабораторные стандарты на нашей кухне'
                  : locale === 'ka'
                  ? 'ლაბორატორიული სტანდარტები ჩვენს სამზარეულოში'
                  : 'Laboratory Standards in Our Kitchen'}
              </h2>
            </div>

            <div className="quality-standards-grid">
              {standards.map((st, si) => (
                <div key={si} className="quality-standard-card">
                  <h4 className="quality-standard-title">
                    <IconCheck size={18} style={{ color: '#CCFF00', flexShrink: 0 }} />
                    <span>{st.title[locale]}</span>
                  </h4>
                  <p className="quality-standard-desc">{st.desc[locale]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Guarantee Card */}
          <div className="quality-guarantee-card">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CCFF00', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <IconShield size={18} />
                <span>
                  {locale === 'ru' ? '100% Гарантия качества FitFood' : locale === 'ka' ? 'FitFood-ის 100% ხარისხის გარანტია' : '100% FitFood Quality Guarantee'}
                </span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', marginBottom: '10px' }}>
                {locale === 'ru'
                  ? 'Не понравилось блюдо или повреждена упаковка?'
                  : locale === 'ka'
                  ? 'არ მოგეწონათ კერძი ან დაზიანდა შეფუთვა?'
                  : 'Did not like a dish or packaging got damaged?'}
              </h3>
              <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '600px', lineHeight: 1.5 }}>
                {locale === 'ru'
                  ? 'Напишите нам в Telegram или позвоните в течение 24 часов — мы заменим блюдо со следующей доставкой или моментально начислим бонусы на баланс без лишних вопросов.'
                  : locale === 'ka'
                  ? 'მოგვწერეთ Telegram-ში ან დაგვირეკეთ 24 საათში — ჩვენ უპირობოდ შეგიცვლით კერძს ან დაგიბრუნებთ ქულებს ბალანსზე.'
                  : 'Message our Telegram or call within 24 hours — we will replace the meal with the next delivery or credit your balance immediately with zero hassle.'}
              </p>
            </div>

            <Link
              href="/#programs"
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '15px', whiteSpace: 'nowrap' }}
            >
              <span>{locale === 'ru' ? 'Выбрать рацион' : locale === 'ka' ? 'რაციონის არჩევა' : 'Choose Meal Plan'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
