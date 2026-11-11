import { Locale, Program } from '@/types';

export const CALORIE_OPTIONS: Record<string, { cal: number; meals: number }[]> = {
  'prog-slim': [
    { cal: 750, meals: 3 },
    { cal: 1000, meals: 4 },
    { cal: 1250, meals: 4 },
    { cal: 1500, meals: 5 },
  ],
  'prog-balance': [
    { cal: 1600, meals: 5 },
    { cal: 1800, meals: 5 },
    { cal: 2000, meals: 5 },
  ],
  'prog-power': [
    { cal: 2200, meals: 6 },
    { cal: 2500, meals: 6 },
    { cal: 3000, meals: 6 },
  ],
  'prog-detox': [
    { cal: 900, meals: 6 },
    { cal: 1100, meals: 6 },
  ],
};

export const DURATIONS: { days: number; key: keyof Program['prices'] }[] = [
  { days: 2, key: 'trialTwoDays' },
  { days: 6, key: 'sixDays' },
  { days: 12, key: 'twelveDays' },
  { days: 24, key: 'twentyFourDays' },
  { days: 30, key: 'thirtyDays' },
];

export type SlotId = 'morning' | 'comfort' | 'evening';
export const SLOTS: { id: SlotId; time: string }[] = [
  { id: 'morning', time: '06:30 – 08:30' },
  { id: 'comfort', time: '08:30 – 10:30' },
  { id: 'evening', time: '19:00 – 21:00' },
];

export type PayId = 'cash' | 'card' | 'link';

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const LOCALE_TAG: Record<Locale, string> = { ka: 'ka-GE', ru: 'ru-RU', en: 'en-GB' };
export const fmtDate = (d: Date, l: Locale, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE_TAG[l], opts).format(d);

type Str = Record<Locale, string>;
const s = (ka: string, ru: string, en: string): Str => ({ ka, ru, en });

export const T = {
  brandTag: s('რაციონები ბათუმში', 'Рационы в Батуми', 'Meal plans in Batumi'),
  back: s('მთავარი', 'На главную', 'Home'),
  order: s('შეკვეთა', 'Заказать', 'Order'),
  heroKicker: s('ონლაინ შეკვეთა · ბათუმი', 'Онлайн-заказ · Батуми', 'Order online · Batumi'),
  heroTitle1: s('შეკვეთე შენი', 'Собери свой', 'Build your'),
  heroTitle2: s('რაციონი', 'рацион', 'ration'),
  heroTitle3: s('3 წუთში', 'за 3 минуты', 'in 3 minutes'),
  heroSub: s(
    'აირჩიე პროგრამა, კალორიები და დღეები. ნახე რას მიიღებ ყოველ დღე — და ჩვენ მოგიტანთ კარამდე.',
    'Выберите программу, калории и срок. Посмотрите, что будете есть каждый день — и мы привезём к двери.',
    'Pick a program, calories and duration. Preview what you will eat each day — we deliver to your door.'
  ),
  heroCta: s('რაციონის აწყობა', 'Собрать рацион', 'Build my ration'),
  stat1: s('გამეორების გარეშე', 'без повторов', 'no repeats'),
  stat2: s('ზუსტი ბჟუ', 'точный КБЖУ', 'exact macros'),
  stat3: s('მიტანა ბათუმში', 'доставка по Батуми', 'Batumi delivery'),
  stat4: s('კერძი ბაზაში', 'блюд в базе', 'dishes'),

  s1: s('პროგრამა', 'Программа', 'Program'),
  s2: s('კალორიები', 'Калорийность', 'Calories'),
  s3: s('ხანგრძლივობა', 'Срок', 'Duration'),
  s4: s('დაწყება და მიტანა', 'Старт и доставка', 'Start & delivery'),
  s5: s('ალერგიები', 'Аллергии и стоп-лист', 'Allergies & stop-list'),
  s6: s('შენი მენიუ', 'Ваше меню', 'Your menu'),
  s7: s('კონტაქტები', 'Контакты и оплата', 'Contacts & payment'),

  perDay: s('დღე', 'день', 'day'),
  from: s('დან', 'от', 'from'),
  mealsDay: s('კვება დღეში', 'приёмов пищи в день', 'meals a day'),
  kcal: s('კკალ', 'ккал', 'kcal'),
  days: s('დღე', 'дней', 'days'),
  trial: s('სატესტო', 'пробный', 'trial'),
  save: s('დანაზოგი', 'выгода', 'save'),
  popular: s('პოპულარული', 'Хит', 'Popular'),
  startDate: s('დაწყების თარიღი', 'Дата старта', 'Start date'),
  startHint: s(
    'ხვალინდელ შეკვეთას ვიღებთ დღეს 18:00-მდე.',
    'Заказ на завтра принимаем до 18:00 сегодня.',
    'Orders for tomorrow are accepted until 18:00 today.'
  ),
  slot: s('მიტანის დრო', 'Время доставки', 'Delivery time'),
  stopHint: s(
    'მონიშნე რისი ჭამა არ შეგიძლია — კერძებს ავტომატურად გავფილტრავთ.',
    'Отметьте, что вам нельзя — мы подсветим блюда и предложим замену.',
    'Tick what you cannot eat — we flag dishes and suggest swaps.'
  ),
  customStop: s('სხვა (მაგ. სოკო)', 'Другое (напр. грибы)', 'Other (e.g. mushrooms)'),
  addBtn: s('დამატება', 'Добавить', 'Add'),
  noneStop: s('შეზღუდვების გარეშე', 'Без ограничений', 'No restrictions'),
  menuHint: s(
    'ეს არის რეალური მენიუ შენი დაწყების თარიღიდან. დააჭირე „შეცვლა“ და აირჩიე სხვა კერძი.',
    'Это реальное меню с вашей даты старта. Нажмите «Заменить», чтобы выбрать другое блюдо.',
    'This is the real menu from your start date. Tap “Swap” to pick another dish.'
  ),
  week: s('კვირა', 'неделя', 'week'),
  swap: s('შეცვლა', 'Заменить', 'Swap'),
  swapped: s('შეცვლილია', 'заменено', 'swapped'),
  swapTitle: s('აირჩიე ჩანაცვლება', 'Выберите замену', 'Choose a replacement'),
  revert: s('დაბრუნება', 'Вернуть исходное', 'Revert'),
  conflict: s('შეიცავს', 'Содержит', 'Contains'),
  safeOnly: s('მხოლოდ უსაფრთხო', 'Только безопасные', 'Safe only'),
  rationOnly: s('მხოლოდ რაციონში', 'Только в рационах', 'Rations only'),
  protein: s('ც', 'Б', 'P'),
  fat: s('ც', 'Ж', 'F'),
  carbs: s('ნ', 'У', 'C'),
  ingredients: s('შემადგენლობა', 'Состав', 'Ingredients'),
  mealName: {
    breakfast: s('საუზმე', 'Завтрак', 'Breakfast'),
    snack: s('სამხარი', 'Перекус', 'Snack'),
    lunch: s('სადილი', 'Обед', 'Lunch'),
    dinner: s('ვახშამი', 'Ужин', 'Dinner'),
    dessert: s('დესერტი', 'Десерт', 'Dessert'),
    smoothie: s('სმუზი', 'Смузи', 'Smoothie'),
  } as Record<string, Str>,
  name: s('სახელი', 'Имя', 'Name'),
  phone: s('ტელეფონი', 'Телефон', 'Phone'),
  zone: s('მიტანის ზონა', 'Зона доставки', 'Delivery zone'),
  address: s('მისამართი', 'Адрес', 'Address'),
  addressPh: s('ქუჩა, სახლი, ბინა / სასტუმრო', 'Улица, дом, кв. / отель и номер', 'Street, apt / hotel & room'),
  comment: s('კომენტარი კურიერისთვის', 'Комментарий курьеру', 'Note for the courier'),
  payment: s('გადახდა', 'Оплата', 'Payment'),
  payCash: s('ნაღდი კურიერთან', 'Наличными курьеру', 'Cash to courier'),
  payCard: s('ბარათი კურიერთან', 'Картой курьеру', 'Card to courier'),
  payLink: s('გადახდის ბმული', 'Ссылка на оплату', 'Payment link'),
  payLinkSub: s('გამოგიგზავნით მესენჯერში', 'Пришлём в мессенджер', 'We send it to your messenger'),
  free: s('უფასო', 'Бесплатно', 'Free'),

  summary: s('შენი შეკვეთა', 'Ваш заказ', 'Your order'),
  sProgram: s('პროგრამა', 'Программа', 'Program'),
  sPeriod: s('პერიოდი', 'Период', 'Period'),
  sDelivery: s('მიტანა', 'Доставка', 'Delivery'),
  sStop: s('გამორიცხულია', 'Исключено', 'Excluded'),
  sSwaps: s('ჩანაცვლება', 'Замен', 'Swaps'),
  total: s('სულ', 'Итого', 'Total'),
  submit: s('შეკვეთის გაფორმება', 'Оформить заказ', 'Place order'),
  sending: s('იგზავნება…', 'Отправляем…', 'Sending…'),
  fillRequired: s('შეავსე სახელი, ტელეფონი და მისამართი', 'Заполните имя, телефон и адрес', 'Fill in name, phone and address'),
  badPhone: s('შეამოწმე ტელეფონის ნომერი', 'Проверьте номер телефона', 'Check the phone number'),
  secure: s('გადახდა მიტანისას ან ბმულით — წინასწარ არაფერი', 'Оплата при получении или по ссылке', 'Pay on delivery or via link'),
  stepOf: s('ნაბიჯი', 'Шаг', 'Step'),
  toOrder: s('გადასვლა შეკვეთაზე', 'К оформлению', 'Go to checkout'),

  filmsKicker: s('ჩვენი სამზარეულო', 'НАША КУХНЯ', 'OUR KITCHEN'),
  filmsTitle: s('ნახე, როგორ ვამზადებთ', 'Смотрите, как мы готовим', 'See how we cook'),
  filmsSub: s('ოთხი ფირმენი კერძი — სუფთა ინგრედიენტები, ზუსტი წონა.', 'Четыре фирменных блюда — чистые ингредиенты, точный вес порций.', 'Four signature dishes — clean ingredients, exact portions.'),
  howTitle: s('როგორ მუშაობს', 'Как это работает', 'How it works'),
  how1: s('აირჩიე რაციონი', 'Выбираете рацион', 'Pick a ration'),
  how1d: s('პროგრამა, კალორიები, დღეები და ალერგიები.', 'Программа, калорийность, срок и аллергии.', 'Program, calories, duration and allergies.'),
  how2: s('ვამზადებთ ყოველდღე', 'Готовим каждый день', 'We cook daily'),
  how2d: s('ახალი კერძები, ზუსტი ბჟუ, გამეორების გარეშე.', 'Свежие блюда, точный КБЖУ, без повторов.', 'Fresh dishes, exact macros, no repeats.'),
  how3: s('მოგვაქვს კარამდე', 'Привозим к двери', 'Delivered to your door'),
  how3d: s('ბათუმის მასშტაბით, დილის ან საღამოს სლოტში.', 'По всему Батуми, в утренний или вечерний слот.', 'Across Batumi, in a morning or evening slot.'),

  doneTitle: s('შეკვეთა მიღებულია!', 'Заказ принят!', 'Order received!'),
  doneSub: s('მენეჯერი დაგირეკავთ დასადასტურებლად.', 'Менеджер свяжется с вами для подтверждения.', 'A manager will contact you to confirm.'),
  orderNo: s('შეკვეთის ნომერი', 'Номер заказа', 'Order number'),
  newOrder: s('ახალი შეკვეთა', 'Новый заказ', 'New order'),
  stopCount: s('გამორიცხულია', 'исключено', 'excluded'),
};

export const tr = (str: Str, l: Locale) => str[l];
