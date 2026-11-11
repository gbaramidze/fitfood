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

// For now we deliver only in the evening, 20:00–23:00, in one-hour windows.
export type SlotId = 'e20' | 'e21' | 'e22';
export const SLOTS: { id: SlotId; time: string }[] = [
  { id: 'e20', time: '20:00 – 21:00' },
  { id: 'e21', time: '21:00 – 22:00' },
  { id: 'e22', time: '22:00 – 23:00' },
];

export const CONTACT = {
  phone: '+995 596 56 99 99',
  phoneHref: 'tel:+995596569999',
  instagram: 'https://www.instagram.com/fitnessfood.ge',
  instagramHandle: '@fitnessfood.ge',
};

/**
 * The published program price is for the middle of the program's calorie range.
 * Smaller / bigger daily portions cost proportionally less / more: ~55% of the price is fixed
 * (packaging, delivery, kitchen time) and ~45% follows the calories.
 * Tweak the two numbers below to change how steeply price follows calories.
 */
const MID_KCAL: Record<string, number> = { 'prog-slim': 1125, 'prog-balance': 1800, 'prog-power': 2600, 'prog-detox': 1000 };
const FIXED_SHARE = 0.55;
export const tierPrice = (base: number, programId: string, kcal: number) =>
  Math.round(base * (FIXED_SHARE + (1 - FIXED_SHARE) * (kcal / (MID_KCAL[programId] || kcal))));

export type PayId = 'cash' | 'card' | 'online';

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Own date names, so Georgian / Russian / English always read correctly (no dependence on the browser's Intl data).
// Weekday arrays start on Sunday (Date#getDay); month arrays on January.
export const MONTH_NOM: Record<Locale, string[]> = {
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTH_GEN: Record<Locale, string[]> = {
  ka: MONTH_NOM.ka,
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: MONTH_NOM.en,
};
const MONTH_SHORT: Record<Locale, string[]> = {
  ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
export const WEEKDAY_LONG: Record<Locale, string[]> = {
  ka: ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'],
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
export const WEEKDAY_SHORT: Record<Locale, string[]> = {
  ka: ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'],
  ru: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/** "Fri, 13 Nov" — pass any of weekday / day / month; 'long' spells names out. */
export function fmtDate(
  d: Date,
  l: Locale,
  o: { weekday?: 'short' | 'long'; day?: 'numeric'; month?: 'short' | 'long' }
): string {
  const wd = o.weekday ? (o.weekday === 'long' ? WEEKDAY_LONG : WEEKDAY_SHORT)[l][d.getDay()] : '';
  const dm = [o.day ? String(d.getDate()) : '', o.month ? (o.month === 'long' ? MONTH_GEN : MONTH_SHORT)[l][d.getMonth()] : '']
    .filter(Boolean)
    .join(' ');
  return wd && dm ? `${wd}, ${dm}` : wd || dm;
}

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
  s2: s('კალორიები და ვადა', 'Калории и срок', 'Calories & duration'),
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
    'მიტანა ხდება მხოლოდ საღამოს 20:00–23:00. ხვალინდელ შეკვეთას ვიღებთ დღეს 18:00-მდე.',
    'Пока доставляем только вечером, с 20:00 до 23:00. Заказ на завтра принимаем до 18:00 сегодня.',
    'For now we deliver in the evening only, 20:00–23:00. Orders for tomorrow are accepted until 18:00 today.'
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
  payOnline: s('ონლაინ ბარათით', 'Онлайн картой', 'Pay online by card'),
  payOnlineSub: s('უსაფრთხო გადახდა ბანკის გვერდზე — Visa / Mastercard', 'Безопасная оплата на странице банка — Visa / Mastercard', 'Secure payment on the bank page — Visa / Mastercard'),
  doneLink: s('მენეჯერი გამოგიგზავნით გადახდის ბმულს ტელეფონზე.', 'Менеджер пришлёт ссылку на оплату на ваш телефон.', 'A manager will send the payment link to your phone.'),
  account: s('პირადი კაბინეტი', 'Личный кабинет', 'My account'),
  free: s('უფასო', 'Бесплатно', 'Free'),

  summary: s('შენი შეკვეთა', 'Ваш заказ', 'Your order'),
  sProgram: s('პროგრამა', 'Программа', 'Program'),
  sPrice: s('რაციონი', 'Рацион', 'Ration'),
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

  filmsKicker: s('ფირმენი კერძები', 'ФИРМЕННЫЕ БЛЮДА', 'SIGNATURE DISHES'),
  filmsTitle: s('ნახე, როგორ ვამზადებთ', 'Смотрите, как мы готовим', 'See how we cook'),
  filmsSub: s('აირჩიე კერძი — ვიდეო გაჩვენებს, როგორ მზადდება ჩვენს სამზარეულოში.', 'Выберите блюдо — видео покажет, как оно готовится на нашей кухне.', 'Pick a dish — the video shows how it is made in our kitchen.'),
  watch: s('ვიდეო', 'Видео', 'Video'),
  toRation: s('რაციონში', 'Хочу в рацион', 'Add to my ration'),
  loadingMenu: s('მენიუ იტვირთება…', 'Загружаем меню…', 'Loading the menu…'),
  menuError: s('მენიუ ვერ ჩაიტვირთა. სცადე გვერდის განახლება.', 'Не удалось загрузить меню. Обновите страницу.', 'Could not load the menu. Please refresh.'),
  menuEmpty: s('ამ დღისთვის მენიუ ჯერ არ არის შევსებული.', 'На этот день меню ещё не заполнено.', 'The menu for this day is not filled in yet.'),
  callUs: s('დაგვირეკეთ', 'Позвонить', 'Call us'),
  contactsTitle: s('კითხვები? ჩვენ ხაზზე ვართ', 'Есть вопросы? Мы на связи', 'Questions? We are here'),
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
