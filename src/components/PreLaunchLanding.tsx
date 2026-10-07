'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { Locale } from '@/types';
import { LazyProductImage } from '@/components/partner/LazyProductImage';
import './pre-launch.css';

const LANGUAGES: { code: Locale; label: string; full: string }[] = [
  { code: 'ka', label: 'KA', full: 'ქართული' },
  { code: 'ru', label: 'RU', full: 'Русский' },
  { code: 'en', label: 'EN', full: 'English' },
];

interface PartnerProductItem {
  id: string;
  name: {
    ru?: string;
    ka?: string;
    en?: string;
  } | string;
  category?: string;
  category_name?: {
    ru?: string;
    ka?: string;
    en?: string;
  } | string;
  categoryName?: {
    ru?: string;
    ka?: string;
    en?: string;
  } | string;
  price?: number;
  cost_price?: number;
  costPrice?: number;
  calories: number;
  weight_grams?: number;
  weightGrams?: number;
  image?: string;
  badge?: {
    ru?: string;
    ka?: string;
    en?: string;
  } | string;
  slug?: string;
  description?: {
    ru?: string;
    ka?: string;
    en?: string;
  } | string;
  meal_type?: string;
  day?: string;
  protein?: number;
  fat?: number;
  carbs?: number;
  ingredients?: any;
  allergens?: any;
  cooking_method?: string;
  target_channels?: any;
}

// Fallback macros if not present in DB record
const MACRO_FALLBACKS: Record<string, { protein: number; fat: number; carbs: number; weight: number }> = {
  'prod-chicken-quinoa': { protein: 38, fat: 10, carbs: 44, weight: 320 },
  'prod-tuna-steak': { protein: 42, fat: 8, carbs: 35, weight: 300 },
  'prod-beef-bowl': { protein: 45, fat: 16, carbs: 47, weight: 340 },
  'prod-salmon-steamed': { protein: 36, fat: 18, carbs: 38, weight: 310 },
  'prod-syrniki-berry': { protein: 29, fat: 9, carbs: 37, weight: 260 },
  'prod-protein-pudding': { protein: 22, fat: 5, carbs: 19, weight: 180 },
};

// Fallback ingredients list for dishes
const INGREDIENTS_FALLBACKS: Record<string, { ru: string[]; ka: string[]; en: string[] }> = {
  'prod-chicken-quinoa': {
    ru: ['Куриное филе Sous-Vide', 'Киноа', 'Брокколи на пару', 'Оливковое масло Extra Virgin', 'Авторские травы'],
    ka: ['ქათმის ფილე Sous-Vide', 'კინოა', 'ორთქლზე მომზადებული ბროკოლი', 'ზეითუნის ზეთი Extra Virgin', 'საავტორო მწვანილი'],
    en: ['Sous-Vide Chicken Breast', 'Organic Quinoa', 'Steamed Broccoli', 'Extra Virgin Olive Oil', 'Artisanal Herbs'],
  },
  'prod-tuna-steak': {
    ru: ['Стейк из тунца', 'Дикий рис', 'Спаржа на гриле', 'Лимонный дрессинг', 'Кунжут'],
    ka: ['თუნუქის სტეიკი', 'ველური ბრინჯი', 'სატაცური გრილზე', 'ლიმონის დრესინგი', 'სეზამი'],
    en: ['Yellowfin Tuna Steak', 'Wild Rice Blend', 'Grilled Asparagus', 'Citrus Dressing', 'Toasted Sesame'],
  },
  'prod-beef-bowl': {
    ru: ['Говяжья вырезка Sous-Vide', 'Спелое авокадо', 'Бурый рис', 'Яйцо пашот', 'Микрозелень'],
    ka: ['საქონლის სუკი Sous-Vide', 'მწიფე ავოკადო', 'ყავისფერი ბრინჯი', 'კვერცხი პაშოტი', 'მიკრომწვანილი'],
    en: ['Sous-Vide Beef Tenderloin', 'Fresh Avocado', 'Brown Rice', 'Poached Egg', 'Microgreens'],
  },
  'prod-salmon-steamed': {
    ru: ['Атлантический лосось', 'Цукини гриль', 'Сладкий перец', 'Свежий розмарин', 'Морская соль'],
    ka: ['ატლანტიკური ორაგული', 'ყაბაყი გრილზე', 'ტკბილი წიწაკა', 'ახალი როზმარინი', 'ზღვის მარილი'],
    en: ['Atlantic Salmon Fillet', 'Grilled Zucchini', 'Sweet Bell Peppers', 'Fresh Rosemary', 'Sea Salt'],
  },
  'prod-syrniki-berry': {
    ru: ['Фермерский творог 5%', 'Рисовая мука', 'Клубничный соус без сахара', 'Натуральная ваниль', 'Мята'],
    ka: ['ფერმერული ხაჭო 5%', 'ბრინჯის ფქვილი', 'მარწყვის სოუსი უშაქროდ', 'ნატურალური ვანილი', 'პიტნა'],
    en: ['Farm Cottage Cheese 5%', 'Rice Flour', 'Zero Sugar Strawberry Coulis', 'Natural Vanilla', 'Fresh Mint'],
  },
  'prod-protein-pudding': {
    ru: ['Изолят сывороточного белка', 'Миндальное молоко', 'Семена чиа', 'Органическое какао', 'Стевия'],
    ka: ['შრატის ცილის იზოლატი', 'ნუშის რძე', 'ჩიას თესლი', 'ორგანული კაკაო', 'სტევია'],
    en: ['Whey Protein Isolate', 'Almond Milk', 'Chia Seeds', 'Organic Raw Cacao', 'Natural Stevia'],
  },
};

const getProductIngredients = (prod: PartnerProductItem, currentLang: Locale): string[] => {
  if (prod.ingredients) {
    if (Array.isArray(prod.ingredients)) {
      return prod.ingredients.map(String);
    }
    if (typeof prod.ingredients === 'object') {
      const langArr = prod.ingredients[currentLang] || prod.ingredients.ru || prod.ingredients.ka || prod.ingredients.en;
      if (Array.isArray(langArr)) return langArr.map(String);
      if (typeof langArr === 'string') return langArr.split(',').map((s: string) => s.trim());
    }
    if (typeof prod.ingredients === 'string') {
      return prod.ingredients.split(',').map((s: string) => s.trim());
    }
  }
  const fallback = INGREDIENTS_FALLBACKS[prod.id];
  if (fallback && fallback[currentLang]) {
    return fallback[currentLang];
  }
  return [];
};

const UI_TEXT = {
  ka: {
    navCta: 'დატოვეთ განაცხადი',
    heroTitlePrefix: 'ჯანსაღი კვების სერვისი',
    heroTitleHighlight: 'მალე გაიხსნება',
    heroTitleSuffix: 'ბათუმში',
    heroSubtitle: 'რესტორნის ხარისხის მზა რაციონები ზუსტი კალორიების და მაკრონუტრიენტების გათვლით, სუ-ვიდ ტექნოლოგიით და ყოველდღიური მიწოდებით 08:00-დან 12:00-მდე.',
    mainCta: 'განაცხადის დატოვება',
    secondaryCta: 'მენიუს დათვალიერება',
    
    // Programs Section
    programsTitle: 'კვების პროგრამები',
    programsSub: 'ყველა რაციონი გათვლილია ზუსტი კცცნ ბალანსით',
    selectProgramBtn: 'არჩევა და განაცხადი',
    mealsCount: 'კვება / დღე',
    dailyKbzhuTitle: 'დღიური კცცნ:',

    // Dishes Showcase Section
    dishesTitle: 'კერძები ჩვენი მენიუდან',
    dishesSub: 'მზადდება შეფ-მზარეულის მიერ ზუსტი კცცნ და გრამების კონტროლით',
    ingredientsTitle: 'შემადგენლობა:',

    // Macro labels
    calLabel: 'კკალ',
    proteinLabel: 'ცილა',
    fatLabel: 'ცხიმი',
    carbsLabel: 'ნახშირწყალი',
    weightLabel: 'წონა',

    // Features
    featuresTitle: 'რატომ FITNESS FOOD?',
    featuresSub: 'პრემიუმ ხარისხის ჯანსაღი კვება ყოველდღე',
    features: [
      {
        title: 'სუ-ვიდი & შეფ-მენიუ',
        desc: 'წვნიანი ხორცი Sous-Vide ტექნოლოგიით და საავტორო სოუსებით.',
      },
      {
        title: 'ზუსტი კალორიები და მაკროები',
        desc: 'ყველა ულუფა აწონილი და დაბალანსებულია დიეტოლოგების მიერ.',
      },
      {
        title: 'მიწოდება ბათუმში 08:00–12:00',
        desc: 'ახლად მომზადებული კონტეინერები პირდაპირ თქვენს კართან დილის სლოტში.',
      },
      {
        title: '30 დღე გამეორების გარეშე',
        desc: 'ყოველდღე ახალი გემოები, ჯანსაღი დესერტები და მრავალფეროვანი მენიუ.',
      },
    ],

    // Pre-order Banner
    bannerTitle: 'ჩვენ მალე გავეშვებით!',
    bannerSub: 'დატოვეთ წინასწარი განაცხადი და ჩვენ პირველ რიგში დაგიკავშირდებით გახსნისთანავე:',
    bannerBtn: 'განაცხადის დატოვება',

    // Modal Form
    modalTitle: 'ადრეული წვდომა',
    modalSub: 'შეავსეთ საკონტაქტო ინფორმაცია და იყავით პირველი, ვინც მიიღებს FitFood-ის რაციონს!',
    nameLabel: 'თქვენი სახელი',
    namePlaceholder: 'გიორგი',
    phoneLabel: 'ტელეფონის ნომერი',
    phonePlaceholder: '+995 555 00 00 00',
    goalLabel: 'აირჩიეთ რაციონი',
    commentLabel: 'სურვილები ან კვებითი ალერგია (არასავალდებულო)',
    commentPlaceholder: 'მაგალითად: უგლუტენო, ალერგია თხილზე...',
    submitBtn: 'განაცხადის გაგზავნა',
    submitting: 'იგზავნება...',
    trustNote: 'თქვენი მონაცემები დაცულია და არ გადაეცემა მესამე პირებს',
    successTitle: 'განაცხადი მიღებულია!',
    successDesc: 'დიდი მადლობა! თქვენი განაცხადი მიღებულია. ჩვენ დაგიკავშირდებით გაშვებისთანავე!',
    successClose: 'დახურვა',
    floatingCta: 'დატოვეთ განაცხადი',
    footerCopy: '© 2026 FITNESS FOOD ACADEMY • Batumi, Georgia',
  },
  ru: {
    navCta: 'Оставить заявку',
    heroTitlePrefix: 'Сервис правильного питания',
    heroTitleHighlight: 'скоро в Батуми',
    heroTitleSuffix: '',
    heroSubtitle: 'Готовые авторские рационы ресторанного качества с точным расчетом КБЖУ, технологией Су-вид и ежедневной доставкой с 8 до 12. Мы скоро запустимся!',
    mainCta: 'Оставить заявку на запуск',
    secondaryCta: 'Посмотреть блюда и рационы',

    // Programs Section
    programsTitle: 'Программы питания',
    programsSub: 'Каждая программа имеет строгий расчет КБЖУ под ваши цели',
    selectProgramBtn: 'Выбрать и оставить заявку',
    mealsCount: 'приемов / день',
    dailyKbzhuTitle: 'КБЖУ в день:',

    // Dishes Showcase Section
    dishesTitle: 'Блюда из нашего меню',
    dishesSub: 'Готовим по технологии Sous-Vide с точным контролем граммовок и КБЖУ',
    ingredientsTitle: 'Ингредиенты:',

    // Macro labels
    calLabel: 'ккал',
    proteinLabel: 'Белки',
    fatLabel: 'Жиры',
    carbsLabel: 'Углеводы',
    weightLabel: 'Вес',

    // Features
    featuresTitle: 'Почему FITNESS FOOD?',
    featuresSub: 'Премиальный сервис готового спортивного и здорового питания',
    features: [
      {
        title: 'Су-вид и ресторанный вкус',
        desc: 'Никакой сухой грудки! Нежнейшее сочное мясо sous-vide с авторскими соусами.',
      },
      {
        title: 'Точный расчет КБЖУ',
        desc: 'Строгий баланс калорий, белков, жиров и углеводов под ваши цели.',
      },
      {
        title: 'Доставка по Батуми с 8 до 12',
        desc: 'Свежеприготовленный рацион прямо к двери вашей квартиры каждое утро.',
      },
      {
        title: '30 дней без повторений',
        desc: 'Разнообразное меню, авторские блюда и полезные десерты на каждый день.',
      },
    ],

    // Pre-order Banner
    bannerTitle: 'Мы скоро запустимся!',
    bannerSub: 'Оставьте заявку сейчас — мы свяжемся с вами первыми в день старта доставки:',
    bannerBtn: 'Оставить заявку',

    // Modal Form
    modalTitle: 'Заявка на ранний доступ',
    modalSub: 'Заполните форму — мы уведомим вас о запуске в числе первых!',
    nameLabel: 'Ваше имя',
    namePlaceholder: 'Александр',
    phoneLabel: 'Номер телефона',
    phonePlaceholder: '+995 555 00 00 00',
    goalLabel: 'Выберите рацион',
    commentLabel: 'Пожелания или аллергии (необязательно)',
    commentPlaceholder: 'Например: без глютена, не ем рыбу, исключить орехи...',
    submitBtn: 'Отправить заявку',
    submitting: 'Отправка заявки...',
    trustNote: 'Ваши контакты конфиденциальны и не передаются третьим лицам',
    successTitle: 'Заявка успешно принята!',
    successDesc: 'Спасибо за интерес! Ваша заявка сохранена. Мы свяжемся с вами в день запуска!',
    successClose: 'Отлично',
    floatingCta: 'Оставить заявку',
    footerCopy: '© 2026 FITNESS FOOD ACADEMY • Batumi, Georgia',
  },
  en: {
    navCta: 'Get Early Access',
    heroTitlePrefix: 'Healthy Meal Prep Service',
    heroTitleHighlight: 'Launching Soon',
    heroTitleSuffix: 'in Batumi',
    heroSubtitle: 'Chef-crafted, macro-precise daily meal prep with sous-vide gastronomy and delivery from 8:00 to 12:00. Opening very soon!',
    mainCta: 'Get Early Access',
    secondaryCta: 'Explore Meals & Plans',

    // Programs Section
    programsTitle: 'Meal Programs',
    programsSub: 'Every meal plan is engineered with exact macro ratios and calorie control',
    selectProgramBtn: 'Select & Apply',
    mealsCount: 'meals / day',
    dailyKbzhuTitle: 'Daily Macros:',

    // Dishes Showcase Section
    dishesTitle: 'Dishes from Our Menu',
    dishesSub: 'Cooked with precision Sous-Vide technique with exact macros and grams per portion',
    ingredientsTitle: 'Ingredients:',

    // Macro labels
    calLabel: 'kcal',
    proteinLabel: 'Protein',
    fatLabel: 'Fats',
    carbsLabel: 'Carbs',
    weightLabel: 'Weight',

    // Features
    featuresTitle: 'Why FITNESS FOOD?',
    featuresSub: 'Premium daily meal preparation and healthy dining delivered to you',
    features: [
      {
        title: 'Sous-Vide Gastronomy',
        desc: 'Tender, juicy meats cooked low and slow with artisanal dressings and natural herbs.',
      },
      {
        title: 'Macro Precision',
        desc: 'Strictly calculated calories, protein, fats, and carbs for your fitness progress.',
      },
      {
        title: 'Batumi Delivery 08:00–12:00',
        desc: 'Fresh meal boxes delivered straight to your door each morning across Batumi.',
      },
      {
        title: '30 Days Without Repeats',
        desc: 'Over 100 rotating gourmet recipes, healthy desserts, and clean snacks.',
      },
    ],

    // Pre-order Banner
    bannerTitle: 'We Are Launching Soon!',
    bannerSub: 'Leave your contact info and be among the first to receive your meal prep on opening day:',
    bannerBtn: 'Leave Request',

    // Modal Form
    modalTitle: 'Early Access Request',
    modalSub: 'Leave your contact info and we will reach out as soon as deliveries start!',
    nameLabel: 'Your Name',
    namePlaceholder: 'John Doe',
    phoneLabel: 'Phone number',
    phonePlaceholder: '+995 555 00 00 00',
    goalLabel: 'Select Meal Program',
    commentLabel: 'Dietary preferences or allergies (optional)',
    commentPlaceholder: 'E.g., gluten-free, no dairy, no peanuts...',
    submitBtn: 'Submit Request',
    submitting: 'Submitting...',
    trustNote: 'Your information is secure and will never be shared',
    successTitle: 'You are on the list!',
    successDesc: 'Thank you for signing up! We will contact you as soon as we launch in Batumi.',
    successClose: 'Close',
    floatingCta: 'Leave Request',
    footerCopy: '© 2026 FITNESS FOOD ACADEMY • Batumi, Georgia',
  },
};

const PROGRAMS_DATA = [
  {
    id: 'slim',
    slug: 'slim',
    names: {
      ka: 'წონის კლება',
      ru: 'СНИЖЕНИЕ',
      en: 'SLIM',
    },
    calorieRanges: {
      ka: '750–1500 კკალ',
      ru: '750–1500 ккал',
      en: '750–1500 kcal',
    },
    mealsPerDay: 4,
    macros: {
      calories: '750–1500',
      protein: '100–120',
      fat: '40–50',
      carbs: '110–130',
    },
    features: {
      ka: [
        '4–5 დაბალანსებული კვება დღეში',
        'შაქრისა და ფარული ცხიმების გარეშე',
      ],
      ru: [
        '4–5 сбалансированных приемов пищи в день',
        'Без добавленного сахара и скрытых жиров',
      ],
      en: [
        '4–5 balanced meals per day',
        'Zero added sugar and clean fats',
      ],
    },
    image: '/images/meals/syrniki-strawberry.webp',
    descriptions: {
      ka: 'კომფორტული წონის კლება შიმშილისა და სტრესის გარეშე.',
      ru: 'Комფორтное похудение без чувства голода и срывов.',
      en: 'Comfortable fat loss without hunger spikes.',
    },
  },
  {
    id: 'balance',
    slug: 'balance',
    names: {
      ka: 'შენარჩუნება',
      ru: 'БАЛАНС',
      en: 'BALANCE',
    },
    calorieRanges: {
      ka: '1600–2000 კკალ',
      ru: '1600–2000 ккал',
      en: '1600–2000 kcal',
    },
    mealsPerDay: 5,
    macros: {
      calories: '1600–2000',
      protein: '130–150',
      fat: '55–65',
      carbs: '160–190',
    },
    features: {
      ka: [
        '5 მრავალფეროვანი კერძი ყოველდღე',
        'ცილებისა და რთული ნახშირწყლების ბალანსი',
      ],
      ru: [
        '5 разнообразных блюд каждый день',
        'Баланс белков, жиров и сложных углеводов',
      ],
      en: [
        '5 diverse gourmet meals daily',
        'Balanced macros and complex carbs',
      ],
    },
    image: '/images/meals/fish-cheese-risotto.webp',
    descriptions: {
      ka: 'ფორმის შენარჩუნება, ტონუსი და მაღალი ენერგია.',
      ru: 'Поддержание формы, тонуса и отличного самочувствия.',
      en: 'Maintain shape, daily vitality, and clean focus.',
    },
  },
  {
    id: 'power',
    slug: 'power',
    names: {
      ka: 'კუნთის მატება',
      ru: 'НАБОР',
      en: 'POWER',
    },
    calorieRanges: {
      ka: '2200–3000 კკალ',
      ru: '2200–3000 ккал',
      en: '2200–3000 kcal',
    },
    mealsPerDay: 6,
    macros: {
      calories: '2200–3000',
      protein: '160–220',
      fat: '70–85',
      carbs: '240–300',
    },
    features: {
      ka: [
        '6 კვება მაღალი ნუტრიციული სიმკვრივით',
        '160–220 გრ სუფთა, ადვილად ასათვისებელი ცილა',
      ],
      ru: [
        '6 приемов пищи с высокой плотностью',
        '160–220 г чистого легкоусвояемого белка',
      ],
      en: [
        '6 nutrient-dense meals for athletes',
        '160–220g clean digestible protein daily',
      ],
    },
    image: '/images/meals/beef-demiglace-puree.webp',
    descriptions: {
      ka: 'მაღალკალორიული რაციონი კუნთოვანი მასის ზრდისთვის.',
      ru: 'Рацион для роста мышечной массы и силы.',
      en: 'High-calorie clean fuel for muscle growth.',
    },
  },
];

export const PreLaunchLanding: React.FC = () => {
  const [lang, setLang] = useState<Locale>('ru');
  const [dbProducts, setDbProducts] = useState<PartnerProductItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProgramSlug, setSelectedProgramSlug] = useState('slim');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = UI_TEXT[lang];

  // Fetch real dishes directly from public.partner_products table in Supabase
  useEffect(() => {
    async function loadPartnerProducts() {
      try {
        const { data, error } = await supabase
          .from('partner_products')
          .select('id, name, category, category_name, price, cost_price, calories, weight_grams, badge, created_at, slug, description, meal_type, day, protein, fat, carbs, ingredients, allergens, cooking_method, target_channels')
          .neq('category', 'drinks')
          .order('created_at', { ascending: true });

        if (!error && data) {
          const list = [...(data as unknown as PartnerProductItem[])];
          if (typeof window !== 'undefined') {
            try {
              const savedOrderStr = localStorage.getItem('fitfood_admin_dishes_order');
              if (savedOrderStr) {
                const savedIds: string[] = JSON.parse(savedOrderStr);
                if (Array.isArray(savedIds) && savedIds.length > 0) {
                  list.sort((a, b) => {
                    const idxA = savedIds.indexOf(a.id);
                    const idxB = savedIds.indexOf(b.id);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                  });
                }
              }
            } catch {}
          }
          setDbProducts(list);
        }
      } catch (err) {
        console.error('Error fetching partner_products:', err);
      }
    }
    loadPartnerProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isModalOpen]);

  const openModal = (progSlug?: string) => {
    if (progSlug) {
      setSelectedProgramSlug(progSlug);
    }
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert(
        lang === 'ka'
          ? 'გთხოვთ მიუთითოთ სახელი და ტელეფონი'
          : lang === 'ru'
          ? 'Пожалуйста, укажите имя и телефон'
          : 'Please provide your name and phone'
      );
      return;
    }

    setIsSubmitting(true);

    const activeProg = PROGRAMS_DATA.find((p) => p.slug === selectedProgramSlug);
    const progLabel = activeProg
      ? `${activeProg.names[lang]} (${activeProg.calorieRanges[lang]})`
      : selectedProgramSlug;

    try {
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            customerName: name.trim(),
            phone: phone.trim(),
            goal: progLabel,
            comment: comment.trim(),
            language: lang,
          },
        }),
      });

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="pl-root">
      {/* Background Ambience */}
      <div className="pl-ambient-glow-top"></div>
      <div className="pl-grid-overlay"></div>

      {/* Header Navigation */}
      <header className="pl-nav-wrap">
        <div className="pl-nav-container">
          <div className="pl-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="pl-logo-wrap-clean">
              <Image
                src="/images/logo-white.png"
                alt="Fitness Food Academy Logo"
                width={85}
                height={85}
                className="pl-logo-clean-img"
                priority
              />
            </div>
            <div className="pl-brand-info">
              <div className="pl-brand-title">
                FITNESS<span>FOOD</span>
              </div>
              <div className="pl-brand-subtitle">
                <span className="pl-brand-badge-geo">ACADEMY</span>
                <span className="pl-brand-academy-label">TEAM</span>
              </div>
            </div>
          </div>

          <div className="pl-nav-actions">
            {/* Custom Dropdown Language Switcher */}
            <div className="pl-lang-dropdown" ref={langDropdownRef}>
              <button
                type="button"
                className={`pl-lang-dropdown-trigger ${isLangDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                aria-label="Change language"
                aria-expanded={isLangDropdownOpen}
              >
                <span className="pl-lang-trigger-code">{lang.toUpperCase()}</span>
                <span className="pl-lang-trigger-label">
                  {LANGUAGES.find((l) => l.code === lang)?.full}
                </span>
                <svg
                  className={`pl-lang-chevron ${isLangDropdownOpen ? 'rotated' : ''}`}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isLangDropdownOpen && (
                <div className="pl-lang-dropdown-menu">
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      className={`pl-lang-dropdown-item ${lang === item.code ? 'selected' : ''}`}
                      onClick={() => {
                        setLang(item.code);
                        setIsLangDropdownOpen(false);
                      }}
                    >
                      <div className="pl-lang-item-content">
                        <span className="pl-lang-item-code">{item.label}</span>
                        <span className="pl-lang-item-full">{item.full}</span>
                      </div>
                      {lang === item.code && (
                        <svg
                          className="pl-lang-item-check"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header CTA */}
            <button
              type="button"
              onClick={() => openModal()}
              className="pl-btn-nav-cta"
            >
              <span className="pl-btn-text">{t.navCta}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="pl-main">
        {/* Full-Width Background Video Hero */}
        <section className="pl-hero-fullwidth">
          {/* Background Video Layer */}
          <div className="pl-hero-bg-video-wrap">
            <video
              className="pl-hero-bg-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src="/video/vertical.mp4" type="video/mp4" media="(max-width: 768px)" />
              <source src="/video/horizontal.mp4" type="video/mp4" />
              <source src="/images/videos/horizontal.mp4" type="video/mp4" />
            </video>
            {/* Cinematic Tint & Smooth Blend to Obsidian Background */}
            <div className="pl-hero-video-tint"></div>
            <div className="pl-hero-video-gradient-bottom"></div>
          </div>

          {/* Hero Content Layer */}
          <div className="pl-hero-content-inner">
            <h1 className="pl-hero-title">
              {t.heroTitlePrefix}{' '}
              <span className="pl-title-gradient">{t.heroTitleHighlight}</span>{' '}
              {t.heroTitleSuffix}
            </h1>

            <p className="pl-hero-subtitle">{t.heroSubtitle}</p>

            {/* Main Action Buttons */}
            <div className="pl-hero-actions">
              <button
                type="button"
                onClick={() => openModal()}
                className="pl-btn-primary"
              >
                <span className="pl-btn-content">{t.mainCta}</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('programs-section')}
                className="pl-btn-secondary"
              >
                <span>{t.secondaryCta}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </button>
            </div>

            {/* Quick Stats Ticker */}
            <div className="pl-stats-ticker">
              <div className="pl-ticker-item">
                <span className="pl-ticker-val">30 {lang === 'ka' ? 'დღე' : lang === 'ru' ? 'Дней' : 'Days'}</span>
                <span className="pl-ticker-label">{lang === 'ka' ? 'გამეორების გარეშე' : lang === 'ru' ? 'без повторений' : 'without repeats'}</span>
              </div>
              <div className="pl-ticker-divider"></div>
              <div className="pl-ticker-item">
                <span className="pl-ticker-val">Sous-Vide</span>
                <span className="pl-ticker-label">{lang === 'ka' ? 'წვნიანი & სასარგებლო' : lang === 'ru' ? 'сочно и полезно' : 'juicy & healthy'}</span>
              </div>
              <div className="pl-ticker-divider"></div>
              <div className="pl-ticker-item">
                <span className="pl-ticker-val">100% {lang === 'ka' ? 'კცცნ' : lang === 'ru' ? 'КБЖУ' : 'Macros'}</span>
                <span className="pl-ticker-label">{lang === 'ka' ? 'ზუსტი ბალანსი' : lang === 'ru' ? 'точный расчет' : 'exact balance'}</span>
              </div>
              <div className="pl-ticker-divider"></div>
              <div className="pl-ticker-item">
                <span className="pl-ticker-val">08:00–12:00</span>
                <span className="pl-ticker-label">{lang === 'ka' ? 'მიწოდება ბათუმში' : lang === 'ru' ? 'доставка по Батуми' : 'Batumi delivery'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Real Programs Section with Full КБЖУ Breakdown & Features */}
        <section id="programs-section" className="pl-programs-section">
          <div className="pl-section-head">
            <span className="pl-section-tag">{lang === 'ka' ? 'კვების რაციონები' : lang === 'ru' ? 'РАЦИОНЫ ПИТАНИЯ' : 'MEAL PROGRAMS'}</span>
            <h2 className="pl-section-title">{t.programsTitle}</h2>
            <p className="pl-section-desc">{t.programsSub}</p>
          </div>

          <div className="pl-programs-grid">
            {PROGRAMS_DATA.map((prog) => (
              <div key={prog.id} className="pl-prog-card">
                <div className="pl-prog-img-wrap">
                  <Image
                    src={prog.image}
                    alt={prog.names[lang]}
                    width={400}
                    height={200}
                    className="pl-prog-img"
                  />
                  <div className="pl-prog-img-overlay"></div>
                  <div className="pl-prog-tag-badge">
                    {prog.slug.toUpperCase()}
                  </div>
                  <div className="pl-prog-kcal-badge">
                    {prog.calorieRanges[lang]}
                  </div>
                </div>

                <div className="pl-prog-body">
                  <div className="pl-prog-header">
                    <h3 className="pl-prog-name">{prog.names[lang]}</h3>
                    <span className="pl-prog-meals">{prog.mealsPerDay} {t.mealsCount}</span>
                  </div>

                  <p className="pl-prog-desc">{prog.descriptions[lang]}</p>

                  {/* Comprehensive Daily КБЖУ / კცცნ Breakdown Bar */}
                  <div className="pl-prog-kbzhu-section">
                    <span className="pl-prog-kbzhu-head-title">{t.dailyKbzhuTitle}</span>
                    <div className="pl-kbzhu-grid">
                      <div className="pl-kbzhu-cell">
                        <span className="pl-kbzhu-label">{lang === 'ka' ? 'კ' : lang === 'ru' ? 'К' : 'Kcal'}</span>
                        <span className="pl-kbzhu-val">{prog.macros.calories}</span>
                      </div>
                      <div className="pl-kbzhu-cell">
                        <span className="pl-kbzhu-label">{lang === 'ka' ? 'ც' : lang === 'ru' ? 'Б' : 'P'}</span>
                        <span className="pl-kbzhu-val">{prog.macros.protein}g</span>
                      </div>
                      <div className="pl-kbzhu-cell">
                        <span className="pl-kbzhu-label">{lang === 'ka' ? 'ც' : lang === 'ru' ? 'Ж' : 'F'}</span>
                        <span className="pl-kbzhu-val">{prog.macros.fat}g</span>
                      </div>
                      <div className="pl-kbzhu-cell">
                        <span className="pl-kbzhu-label">{lang === 'ka' ? 'ნ' : lang === 'ru' ? 'У' : 'C'}</span>
                        <span className="pl-kbzhu-val">{prog.macros.carbs}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Feature Bullets */}
                  <div className="pl-prog-features-list">
                    {prog.features[lang].map((feat, fIdx) => (
                      <div key={fIdx} className="pl-prog-feature-item">
                        <span className="pl-prog-feature-check">✓</span>
                        <span className="pl-prog-feature-text">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => openModal(prog.slug)}
                    className="pl-prog-btn"
                  >
                    <span>{t.selectProgramBtn}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Real Signature Dishes Showcase from public.partner_products table */}
        {dbProducts && dbProducts.length > 0 && (
          <section className="pl-dishes-section">
            <div className="pl-section-head">
              <span className="pl-section-tag">{lang === 'ka' ? 'მენიუს კერძები' : lang === 'ru' ? 'БЛЮДА ИЗ МЕНЮ' : 'MENU DISHES'}</span>
              <h2 className="pl-section-title">{t.dishesTitle}</h2>
              <p className="pl-section-desc">{t.dishesSub}</p>
            </div>

            <div className="pl-dishes-grid">
              {dbProducts.slice(0, 6).map((prod) => {
                const prodName = typeof prod.name === 'object' && prod.name
                  ? (prod.name[lang] || prod.name.ru || prod.name.ka || prod.name.en || '')
                  : String(prod.name || '');

                const categoryLabel = typeof prod.category_name === 'object' && prod.category_name
                  ? (prod.category_name[lang] || prod.category_name.ru || prod.category_name.ka || prod.category_name.en || '')
                  : (typeof prod.category === 'string' ? prod.category : '');

                const fallbackInfo = MACRO_FALLBACKS[prod.id] || { protein: 32, fat: 10, carbs: 36, weight: 300 };
                const weight = prod.weight_grams || prod.weightGrams || fallbackInfo.weight;
                const calories = prod.calories || 380;
                const protein = prod.protein !== undefined && prod.protein !== null && Number(prod.protein) > 0 ? Number(prod.protein) : fallbackInfo.protein;
                const fat = prod.fat !== undefined && prod.fat !== null && Number(prod.fat) > 0 ? Number(prod.fat) : fallbackInfo.fat;
                const carbs = prod.carbs !== undefined && prod.carbs !== null && Number(prod.carbs) > 0 ? Number(prod.carbs) : fallbackInfo.carbs;
                const badgeText = prod.badge && typeof prod.badge === 'object' 
                  ? prod.badge[lang] 
                  : (typeof prod.badge === 'string' ? prod.badge : undefined);

                const ingredientsList = getProductIngredients(prod, lang);

                return (
                  <div key={prod.id} className="pl-dish-card">
                    <div className="pl-dish-img-wrap">
                      <LazyProductImage
                        productId={prod.id}
                        alt={prodName}
                        width={380}
                        height={180}
                        className="pl-dish-img"
                        fill={false}
                      />
                      {badgeText && (
                        <div className="pl-dish-badge-pill">
                          {badgeText}
                        </div>
                      )}
                      <div className="pl-dish-cal-pill">
                        {calories} {t.calLabel}
                      </div>
                      <div className="pl-dish-weight-badge">
                        {weight}g
                      </div>
                    </div>

                    <div className="pl-dish-content">
                      {categoryLabel && (
                        <span className="pl-dish-cat-label">{categoryLabel}</span>
                      )}
                      <h4 className="pl-dish-title">{prodName}</h4>

                      {/* Ingredients List */}
                      {ingredientsList.length > 0 && (
                        <div className="pl-dish-ingredients-box">
                          <span className="pl-dish-ing-label">{t.ingredientsTitle}</span>
                          <span className="pl-dish-ing-text">
                            {ingredientsList.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Explicit КБЖУ / კცცნ Breakdown for Dish */}
                      <div className="pl-dish-kbzhu-bar">
                        <div className="kbzhu-box">
                          <span className="kbzhu-tag protein">{lang === 'ka' ? 'ც' : lang === 'ru' ? 'Б' : 'P'}</span>
                          <span className="kbzhu-val">{protein}g</span>
                        </div>
                        <div className="kbzhu-box">
                          <span className="kbzhu-tag fat">{lang === 'ka' ? 'ც' : lang === 'ru' ? 'Ж' : 'F'}</span>
                          <span className="kbzhu-val">{fat}g</span>
                        </div>
                        <div className="kbzhu-box">
                          <span className="kbzhu-tag carbs">{lang === 'ka' ? 'ნ' : lang === 'ru' ? 'У' : 'C'}</span>
                          <span className="kbzhu-val">{carbs}g</span>
                        </div>
                        <div className="kbzhu-box">
                          <span className="kbzhu-tag weight">{lang === 'ka' ? 'წონა' : lang === 'ru' ? 'Вес' : 'Wt'}</span>
                          <span className="kbzhu-val">{weight}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Superpowers / Key Features */}
        <section className="pl-features-section">
          <div className="pl-section-head">
            <span className="pl-section-tag">{lang === 'ka' ? 'უპირატესობები' : lang === 'ru' ? 'ПРЕИМУЩЕСТВА' : 'ADVANTAGES'}</span>
            <h2 className="pl-section-title">{t.featuresTitle}</h2>
            <p className="pl-section-desc">{t.featuresSub}</p>
          </div>

          <div className="pl-features-grid">
            {t.features.map((feat, idx) => (
              <div key={idx} className="pl-feature-card">
                <div className="pl-feat-num-box">{String(idx + 1).padStart(2, '0')}</div>
                <h3 className="pl-feat-title">{feat.title}</h3>
                <p className="pl-feat-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pre-launch Bottom Call To Action Banner */}
        <section className="pl-starter-banner">
          <div className="pl-starter-glow"></div>
          <div className="pl-starter-content">
            <div className="pl-starter-badge">BATUMI • 2026</div>
            <h2 className="pl-starter-title">{t.bannerTitle}</h2>
            <p className="pl-starter-sub">{t.bannerSub}</p>

            <button
              type="button"
              onClick={() => openModal()}
              className="pl-btn-starter-cta"
            >
              {t.bannerBtn}
            </button>
          </div>
        </section>

        {/* Direct Contact Channels */}
        <section className="pl-social-contact">
          <div className="pl-social-box">
            <div className="pl-social-text">
              <h4>{lang === 'ka' ? 'გაქვთ კითხვები?' : lang === 'ru' ? 'Есть вопросы по меню и доставке?' : 'Have questions?'}</h4>
              <p>{lang === 'ka' ? 'მოგვწერეთ პირდაპირ ტელეგრამ ბოტში' : lang === 'ru' ? 'Напишите нам напрямую в наш Telegram бот' : 'Chat directly with our official Telegram bot'}</p>
            </div>
            <div className="pl-social-links">
              <a
                href="https://t.me/fitnessfoodge_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="pl-social-btn telegram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>@fitnessfoodge_bot</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <div className="pl-footer-logo-line">
            <Image
              src="/images/logo-white.png"
              alt="Fitness Food Logo"
              width={38}
              height={38}
              className="pl-footer-clean-img"
            />
            <span>FITNESS<b>FOOD</b> ACADEMY</span>
          </div>
          <p className="pl-footer-copy">{t.footerCopy}</p>
        </div>
      </footer>

      {/* Floating Mobile Bottom CTA */}
      <div className={`pl-floating-mobile-cta ${scrolled ? 'visible' : ''}`}>
        <button
          type="button"
          onClick={() => openModal()}
          className="pl-floating-btn"
        >
          {t.floatingCta}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 100dvh / 100% WIDTH LEAD CAPTURE MODAL POPUP                         */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="pl-modal-backdrop" onClick={closeModal}>
          <div
            className="pl-modal-container-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Close Button */}
            <div className="pl-modal-topbar">
              <div className="pl-modal-topbar-brand">
                <Image
                  src="/images/logo-white.png"
                  alt="FitFood Logo"
                  width={42}
                  height={42}
                  className="pl-modal-topbar-logo"
                />
                <span>FITNESS<b>FOOD</b></span>
              </div>
              <button
                type="button"
                className="pl-modal-close-fullscreen"
                onClick={closeModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="pl-modal-scroll-body">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="pl-modal-form-content">
                  <div className="pl-modal-header">
                    <div className="pl-modal-badge">EARLY ACCESS</div>
                    <h2 className="pl-modal-title">{t.modalTitle}</h2>
                    <p className="pl-modal-subtitle">{t.modalSub}</p>
                  </div>

                  <div className="pl-form-body">
                    {/* Name Input */}
                    <div className="pl-input-group">
                      <label className="pl-input-label">
                        {t.nameLabel} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        className="pl-input-control"
                        autoFocus
                      />
                    </div>

                    {/* Phone Input */}
                    <div className="pl-input-group">
                      <label className="pl-input-label">
                        {t.phoneLabel} <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="pl-input-control"
                      />
                    </div>

                    {/* Real Programs Selector Chips */}
                    <div className="pl-input-group full-width">
                      <label className="pl-input-label">{t.goalLabel}</label>
                      <div className="pl-goals-selector">
                        {PROGRAMS_DATA.map((prog) => (
                          <label
                            key={prog.id}
                            className={`pl-goal-chip ${selectedProgramSlug === prog.slug ? 'active' : ''}`}
                          >
                            <input
                              type="radio"
                              name="dietGoal"
                              value={prog.slug}
                              checked={selectedProgramSlug === prog.slug}
                              onChange={(e) => setSelectedProgramSlug(e.target.value)}
                            />
                            <span className="pl-goal-chip-text">
                              {prog.names[lang]} <small>({prog.calorieRanges[lang]})</small>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Comment / Preferences */}
                    <div className="pl-input-group full-width">
                      <label className="pl-input-label">{t.commentLabel}</label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t.commentPlaceholder}
                        className="pl-textarea-control"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="pl-modal-submit-btn"
                  >
                    {isSubmitting ? (
                      <span className="pl-spinner-wrap">
                        <span className="pl-spinner"></span>
                        <span>{t.submitting}</span>
                      </span>
                    ) : (
                      <span>{t.submitBtn}</span>
                    )}
                  </button>

                  <p className="pl-modal-trust">{t.trustNote}</p>
                </form>
              ) : (
                <div className="pl-modal-success-fullscreen">
                  <div className="pl-success-icon-wrap">
                    <div className="pl-success-glow"></div>
                    <div className="pl-success-icon-clean">✓</div>
                  </div>
                  <h3 className="pl-success-title">{t.successTitle}</h3>
                  <p className="pl-success-desc">{t.successDesc}</p>
                  <div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="pl-btn-success-close"
                    >
                      {t.successClose}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
