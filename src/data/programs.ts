import { Program } from '@/types';

export const programs: Program[] = [
  {
    id: 'prog-slim',
    slug: 'slim',
    badge: {
      ka: 'სწრაფი კლება • ХИТ',
      ru: 'Снижение • ХИТ',
      en: 'Slim & Fat Loss',
    },
    title: {
      ka: 'სნიჟენიე (750–1500 კკალ)',
      ru: 'СНИЖЕНИЕ (750–1500 ккал)',
      en: 'SLIM (750–1500 kcal)',
    },
    description: {
      ka: 'პროგრამა კომფორტული წონის კლებისთვის შიმშილის გარეშე. სუფთა ცილა და დაბალი ნახშირწყლები.',
      ru: 'Программа для комфортного похудения без голода и срывов. Высокий белок защищает мышцы при дефиците калорий.',
      en: 'Effortless fat reduction program without hunger spikes. High lean protein preserves lean muscle tissue.',
    },
    target: {
      ka: 'კომფორტული წონის კლება, სიმსუბუქე',
      ru: 'Снижение веса, рельеф, легкость',
      en: 'Weight loss, toned body, high energy',
    },
    calorieRange: '750–1500 ккал',
    mealsPerDay: 4,
    prices: {
      trialTwoDays: 78,      // 39/day
      sixDays: 222,          // 37/day (-5%)
      twelveDays: 420,       // 35/day (-10%)
      twentyFourDays: 792,   // 33/day (-15%)
      thirtyDays: 930,       // 31/day (-20%)
      oneDay: 42,
      fiveDaysTourist: 190,
      sevenDaysWeek: 259,
      twentyEightDaysMonth: 890,
    },
    popular: true,
    accentColor: '#38BDF8', // Cyan / Blue (Level Kitchen Slim icon)
    iconName: 'Flame',
    features: {
      ka: [
        '4-5 დაბალკალორიული კვება ყოველდღე',
        'შაქრისა და მავნე ცხიმების გარეშე',
        'სუ-ვიდ და ორთქლზე მომზადება',
        'უფასო მიტანა ყოველ 2 დღეში',
        'კერძების როტაცია 30 დღე',
      ],
      ru: [
        '4–5 сбалансированных приемов пищи в день',
        'Без добавленного сахара и скрытых жиров',
        'Приготовление по технологии су-вид и на пару',
        'Бесплатная утренняя доставка каждые 2 дня',
        'Меню не повторяется в течение 30 дней',
      ],
      en: [
        '4–5 macro-balanced meals daily',
        'Zero added sugar and clean fats only',
        'Gentle sous-vide and steaming method',
        'Free fresh delivery every 2 days',
        '30-day non-repeating rotating menu',
      ],
    },
  },
  {
    id: 'prog-balance',
    slug: 'balance',
    badge: {
      ka: 'ბესტსელერი • ბალანსი',
      ru: 'Бестселлер • Баланс',
      en: 'Bestseller • Balance',
    },
    title: {
      ka: 'ბალანსი (1600–2000 კკალ)',
      ru: 'БАЛАНС (1600–2000 ккал)',
      en: 'BALANCE (1600–2000 kcal)',
    },
    description: {
      ka: 'პროგრამა მიმდინარე ფორმის შესანარჩუნებლად, ენერგიისა და სამუშაო პროდუქტიულობისთვის.',
      ru: 'Программа для поддержания текущей формы, тонуса и отличного самочувствия. Идеально для тех, кто не хочет готовить.',
      en: 'Designed to maintain optimal body composition, high focus and all-day vitality without cooking.',
    },
    target: {
      ka: 'ფორმის შენარჩუნება, ენერგია, ტონუსი',
      ru: 'Поддержание формы, тонус, экономия времени',
      en: 'Shape maintenance, energy, time saving',
    },
    calorieRange: '1600–2000 ккал',
    mealsPerDay: 5,
    prices: {
      trialTwoDays: 88,      // 44/day
      sixDays: 246,          // 41/day (-7%)
      twelveDays: 456,       // 38/day (-14%)
      twentyFourDays: 864,   // 36/day (-18%)
      thirtyDays: 1020,      // 34/day (-23%)
      oneDay: 46,
      fiveDaysTourist: 215,
      sevenDaysWeek: 287,
      twentyEightDaysMonth: 980,
    },
    popular: true,
    accentColor: '#84CC16', // Green / Lime (Level Kitchen Balance icon)
    iconName: 'Zap',
    features: {
      ka: [
        '5 მრავალფეროვანი კერძი: საუზმე, ლანჩი, სადილი, ვახშამი, დესერტი',
        'ფერმერული ხორცი, ფრინველი და ზღვის თევზი',
        'სრული წვდომა პირად კაბინეტზე',
        'კალორიებისა და ბჟუ-ს ზუსტი ბალანსი',
        'უფასო მიტანა',
      ],
      ru: [
        '5 разнообразных блюд: завтрак, ланч, обед, полдник, ужин',
        'Фермерское мясо, птица и свежая рыба',
        'Личный кабинет с управлением днями и заморозкой',
        'Точный расчет КБЖУ от сертифицированных диетологов',
        'Бесплатная доставка к утреннему слоту',
      ],
      en: [
        '5 varied meals: breakfast, lunch, hot dinner, snacks',
        'Farm meats, fresh poultry and ocean fish',
        'Full customer dashboard with pause controls',
        'Accurate dietitian-certified macro split',
        'Free morning doorstep delivery',
      ],
    },
  },
  {
    id: 'prog-power',
    slug: 'power',
    badge: {
      ka: 'მასის ზრდა • სპორტი',
      ru: 'Набор массы • Спорт',
      en: 'Power & Muscle Gain',
    },
    title: {
      ka: 'ნაბორი (2200–3000 კკალ)',
      ru: 'НАБОР (2200–3000 ккал)',
      en: 'POWER (2200–3000 kcal)',
    },
    description: {
      ka: 'მაღალკალორიული რაციონი კუნთოვანი მასის ზრდისა და ძალისმიერი ვარჯიშებისთვის.',
      ru: 'Программа для наращивания мышечной массы и прогресса в спорте. 160г+ чистого белка и двойные порции мяса.',
      en: 'High-calorie clean fuel for muscle hypertrophy and heavy lifting. 160g+ bioavailable protein daily.',
    },
    target: {
      ka: 'კუნთოვანი მასა, ძალა, პროფიციტი',
      ru: 'Сухая мышечная масса, силовые показатели',
      en: 'Lean muscle growth, strength and power',
    },
    calorieRange: '2200–3000 ккал',
    mealsPerDay: 6,
    prices: {
      trialTwoDays: 104,     // 52/day
      sixDays: 288,          // 48/day (-8%)
      twelveDays: 540,       // 45/day (-13%)
      twentyFourDays: 1008,  // 42/day (-19%)
      thirtyDays: 1170,      // 39/day (-25%)
      oneDay: 54,
      fiveDaysTourist: 250,
      sevenDaysWeek: 336,
      twentyEightDaysMonth: 1120,
    },
    popular: false,
    accentColor: '#EC4899', // Pink / Magenta (Level Kitchen Muscle icon)
    iconName: 'Dumbbell',
    features: {
      ka: [
        '6 დიდი ულუფა + პროტეინული სნეკი',
        '160გ+ სუფთა ცილა ყოველდღე',
        'გაზრდილი ხორცისა და თევზის ულუფები',
        'ულიმიტო გაყინვა და დღეების გადატანა',
        'პრიორიტეტული მიტანა',
      ],
      ru: [
        '6 плотных приемов пищи + протеиновые десерты',
        '160г+ чистого легкоусвояемого белка в сутки',
        'Увеличенные порции сочного мяса и рыбы',
        'Бесплатная заморозка и перенос дней',
        'Приоритетный утренний слот доставки',
      ],
      en: [
        '6 dense meals including protein snacks',
        '160g+ bioavailable protein every day',
        'Generous portions of meats and fish',
        'Unlimited free pause days and freezes',
        'Priority early morning delivery slot',
      ],
    },
  },
  {
    id: 'prog-detox',
    slug: 'detox',
    badge: {
      ka: 'დეტოქსი • განტვირთვა',
      ru: 'Детокс • Смузи',
      en: 'Detox & Cleanse',
    },
    title: {
      ka: 'დეტოქსი (900–1100 კკალ)',
      ru: 'ДЕТОКС (900–1100 ккал)',
      en: 'DETOX (900–1100 kcal)',
    },
    description: {
      ka: 'ვიტამინური გადატვირთვა, ახლადდაწურული სმუზები, დეტოქს-ბოულები და ანტიოქსიდანტები.',
      ru: 'Витаминная экспресс-перезагрузка: холодные смузи, боулы, крем-супы и детокс-шоты со спирулиной и имбирем.',
      en: 'Vitamin reset: fresh cold-pressed smoothies, micro-steamed bowls, cleanse soups and detox elixirs.',
    },
    target: {
      ka: 'ორგანიზმის გაწმენდა, სიმსუბუქე, ენერგია',
      ru: 'Очищение организма, сияние кожи, легкость',
      en: 'Digestive reset, skin glow, lightness',
    },
    calorieRange: '900–1100 ккал',
    mealsPerDay: 6,
    prices: {
      trialTwoDays: 84,      // 42/day
      sixDays: 234,          // 39/day (-7%)
      twelveDays: 432,       // 36/day (-14%)
      twentyFourDays: 816,   // 34/day (-19%)
      thirtyDays: 960,       // 32/day (-24%)
      oneDay: 44,
      fiveDaysTourist: 205,
      sevenDaysWeek: 275,
      twentyEightDaysMonth: 920,
    },
    popular: false,
    accentColor: '#10B981', // Emerald green
    iconName: 'Leaf',
    features: {
      ka: [
        '6 ვიტამინური სმუზი, ბოული და კრემ-სუპი',
        'ცივი გამოწურვის ტექნოლოგია',
        'სუპერფუდები: ჩია, სპირულინა, ჯინჯერი',
        'სიმსუბუქის შეგრძნება 48 საათში',
        'უფასო მიტანა',
      ],
      ru: [
        '6 бутылочек и порций: смузи, крем-супы, боулы',
        'Технология холодного отжима без сахара',
        'Суперфуды: спирулина, семена чиа, имбирь',
        'Ощутимый эффект легкости уже через 48 часов',
        'Бесплатная утренняя доставка',
      ],
      en: [
        '6 portions: cold smoothies, pureed soups, bowls',
        'Cold-pressed sugar-free nutrient extraction',
        'Superfoods: spirulina, chia seeds, ginger',
        'Noticeable lightness within 48 hours',
        'Free early morning delivery',
      ],
    },
  },
];
