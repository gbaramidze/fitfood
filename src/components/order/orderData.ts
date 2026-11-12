import { Locale, Program } from '@/types';

export { CALORIE_LEVELS, enabledOptions } from '@/lib/rationOptions';

/** Ration lengths offered on the site. */
export const DURATIONS: { days: number }[] = [{ days: 2 }, { days: 7 }, { days: 14 }, { days: 30 }];

/**
 * PRICING — a fixed price per dish, a little under what the same dish costs in the hall (about 20 GEL a container).
 *
 *   PRICE_MAIN      one main dish (breakfast, lunch, dinner) in a 2-day ration, GEL
 *   PRICE_SNACK     one snack / salad / dessert in a 2-day ration, GEL
 *   DISCOUNT        discount for longer rations
 *
 * The cost side, for the "never at a loss" check (GEL):
 *   COST_MAIN_LOADED    food + container + kitchen salaries ≈ 13  (food and container alone ≈ 6)
 *   COST_SNACK_LOADED   an average snack, salaries included
 * Even the 30-day price stays above the loaded cost; see `marginAt` below.
 */
export const PRICE_MAIN = 16;
export const PRICE_SNACK = 8;
export const DISCOUNT: Record<number, number> = { 2: 0, 7: 0.05, 14: 0.08, 30: 0.12 };
export const COST_MAIN_LOADED = 13;
export const COST_SNACK_LOADED = 5.5;

/** Mains are always breakfast + lunch + dinner; every meal above 3 is a snack, salad or dessert. */
const split = (meals: number) => ({ mains: 3, snacks: Math.max(0, meals - 3) });

/**
 * More calories = bigger, pricier dishes, so the price follows the calories a little within the same number of meals.
 * REF_KCAL is the level where the base price above applies; ELASTICITY says how much of the calorie difference is
 * charged (0.35: 10% more calories -> 3.5% higher price).
 */
const REF_KCAL: Record<number, number> = { 3: 1000, 4: 1250, 5: 1800, 6: 2500 };
const ELASTICITY = 0.35;
/** A ration is never sold below its loaded cost + this margin, whatever the discount. */
const MIN_MARGIN = 0.05;

/** What a day of this ration costs us, salaries included. */
export function dayCost(meals: number) {
  const { mains, snacks } = split(meals);
  return mains * COST_MAIN_LOADED + snacks * COST_SNACK_LOADED;
}

/** Price per day in GEL for a ration of `days` days (discount included). */
const perDay = (meals: number, kcal: number, days: number) => {
  const { mains, snacks } = split(meals);
  const disc = DISCOUNT[days] ?? 0;
  const ref = REF_KCAL[Math.min(6, Math.max(3, meals))];
  const factor = kcal > 0 ? 1 + ELASTICITY * (kcal / ref - 1) : 1;
  const floor = (dayCost(meals) * (1 + MIN_MARGIN)) / (1 - disc);
  return Math.max((mains * PRICE_MAIN + snacks * PRICE_SNACK) * factor, floor) * (1 - disc);
};

/** Price in GEL of `days` days of a ration with `meals` meals and `kcal` calories a day. */
export const rationPrice = (meals: number, kcal: number, days: number) => Math.round(perDay(meals, kcal, days) * days);

/** Profit over the loaded cost for a ration of `days` days, as a share of the cost (0.1 = +10%). */
export const marginAt = (meals: number, kcal: number, days: number) => perDay(meals, kcal, days) / dayCost(meals) - 1;

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

// Payment methods (first stage): online card, bank transfer, cash at a partner fitness gym. Nothing else.
export type PayId = 'online' | 'transfer' | 'gym';

/** Gyms where a customer can pay cash. `id` is the partner point id in the database (partner_points). */
export const GYMS: { id: string; name: string; address: Record<Locale, string> }[] = [
  { id: 'point-mega-gym', name: 'Mega Gym', address: { ka: 'კაჩინსკების 5ბ', ru: 'ул. Качинских 5Б', en: '5B Kachinski St' } },
  { id: 'point-fitness-academy', name: 'Fitness Academy', address: { ka: 'ფიროსმანის 18', ru: 'ул. Пиросмани 18', en: '18 Pirosmani St' } },
];

/** Bank details for "bank transfer". Fill these in and they are shown to the customer right after the order. */
export const TRANSFER = { bank: '', iban: '', recipient: '' };

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Delivery is planned two days ahead: an order made today (even at 23:00) starts the day after tomorrow. */
export const LEAD_DAYS = 2;

/** Today's calendar date in Batumi (Georgia, UTC+4), as a local Date at midnight — the same on the phone and on the server. */
export const batumiToday = (now: Date = new Date()): Date => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [y, m, d] = p.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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
    'მიტანა ხდება მხოლოდ საღამოს 20:00–23:00. უახლოესი მიტანა — ზეგ, შეკვეთის დღიდან 2 დღეში.',
    'Пока доставляем только вечером, с 20:00 до 23:00. Ближайшая доставка — послезавтра: готовим заранее, поэтому заказ сегодня стартует через 2 дня.',
    'For now we deliver in the evening only, 20:00–23:00. The earliest delivery is the day after tomorrow — we cook ahead, so an order today starts in 2 days.'
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
  payTransfer: s('გადარიცხვა ანგარიშზე', 'Перевод на счёт', 'Bank transfer'),
  payTransferSub: s('რეკვიზიტებს მიიღებთ შეკვეთის შემდეგ', 'Реквизиты — сразу после заказа', 'Bank details right after you order'),
  payGym: s('ნაღდი ფული სპორტდარბაზში', 'Наличными в фитнес-зале', 'Cash at a fitness gym'),
  payGymSub: s('მიიღებთ კოდს — დარბაზში შეიტანეთ თანხა ამ კოდით', 'Получите код — внесите сумму в зале по этому коду', 'You get a code — pay the amount at the gym with it'),
  gymChoose: s('აირჩიე დარბაზი', 'Выберите зал', 'Choose a gym'),
  payCode: s('გადახდის კოდი', 'Код оплаты', 'Payment code'),
  codeHelp: s(
    'დარბაზში უთხარით ეს კოდი ადმინისტრატორს და შეიტანეთ {amount} GEL.',
    'Назовите этот код администратору зала и внесите {amount} GEL.',
    'Tell this code to the gym front desk and pay {amount} GEL.'
  ),
  transferHelp: s(
    'გადარიცხვისას მიუთითეთ შეკვეთის ნომერი:',
    'В назначении перевода укажите номер заказа:',
    'Put the order number in the transfer reference:'
  ),
  transferLater: s('რეკვიზიტებს გამოგიგზავნით ტელეფონზე.', 'Реквизиты пришлём на ваш телефон.', 'We will send the bank details to your phone.'),
  bank: s('ბანკი', 'Банк', 'Bank'),
  recipient: s('მიმღები', 'Получатель', 'Recipient'),
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
  stepRation: s('რაციონი', 'Рацион', 'Ration'),
  next: s('შემდეგი', 'Далее', 'Next'),
  prev: s('უკან', 'Назад', 'Back'),
  dayTotal: s('დღის ჯამი', 'Итого за день', 'Day total'),
  calcTitle: s('გამოთვალეთ თქვენი რაციონი', 'Рассчитайте свой рацион', 'Work out your ration'),
  calcSex: s('სქესი', 'Пол', 'Sex'),
  male: s('კაცი', 'Мужчина', 'Man'),
  female: s('ქალი', 'Женщина', 'Woman'),
  calcAge: s('ასაკი', 'Возраст', 'Age'),
  calcHeight: s('სიმაღლე, სმ', 'Рост, см', 'Height, cm'),
  calcWeight: s('წონა, კგ', 'Вес, кг', 'Weight, kg'),
  calcActivity: s('აქტივობა', 'Активность', 'Activity'),
  actSedentary: s('ჯდომითი, ვარჯიშის გარეშე', 'Сидячая, без тренировок', 'Desk job, no workouts'),
  actLight: s('მსუბუქი, 1–3 ვარჯიში კვირაში', 'Лёгкая, 1–3 тренировки в неделю', 'Light, 1–3 workouts a week'),
  actModerate: s('საშუალო, 3–5 ვარჯიში', 'Средняя, 3–5 тренировок', 'Moderate, 3–5 workouts'),
  actHigh: s('მაღალი, 6–7 ვარჯიში ან ფიზიკური შრომა', 'Высокая, 6–7 тренировок или физический труд', 'High, 6–7 workouts or a physical job'),
  calcGoal: s('მიზანი', 'Цель', 'Goal'),
  goalLose: s('წონის კლება', 'Похудение', 'Lose weight'),
  goalMaintain: s('ფორმის შენარჩუნება', 'Поддержание веса', 'Maintain weight'),
  goalGain: s('მასის მატება', 'Набор массы', 'Gain muscle'),
  calcResult: s(
    'თქვენი დღიური ნორმა {need} კკალ. მიზნისთვის საჭიროა დაახლოებით {target} კკალ.',
    'Ваша норма — {need} ккал в день. Для вашей цели нужно около {target} ккал.',
    'Your daily need is {need} kcal. For your goal, about {target} kcal.'
  ),
  calcClosest: s('უახლოესი ხელმისაწვდომი რაციონი: {cal} კკალ.', 'Ближайший доступный рацион — {cal} ккал.', 'The closest available ration is {cal} kcal.'),
  calcGap: s(
    'ზუსტად თქვენი მიზნისთვის რაციონი ჯერ არ გვაქვს — მენიუს შევსებისას დაემატება.',
    'Точно под вашу цель рациона пока нет — появится, когда мы пополним меню.',
    'We do not have a ration right at your target yet — it will appear as the menu grows.'
  ),
  calcSafe: s(
    'ეს უსაფრთხო მინიმუმზე დაბალია, ამიტომ მიზანი ავწიეთ. დიეტა ექიმთან შეათანხმეთ.',
    'Это ниже безопасного минимума, поэтому цель мы подняли. Диету лучше согласовать с врачом.',
    'That is below a safe minimum, so we raised the target. Please check a diet with a doctor.'
  ),
  calcNote: s(
    'ფორმულა Mifflin–St Jeor. ეს ორიენტირია და არა სამედიცინო რეკომენდაცია.',
    'Формула Миффлина — Сан Жеора. Это ориентир, а не медицинская рекомендация.',
    'Mifflin–St Jeor formula. A guide, not medical advice.'
  ),
  recommended: s('რეკომენდებული', 'Рекомендуем', 'Recommended'),
  pickCal: s('კალორიულობა', 'Калорийность', 'Calories'),
  vsNeed: s('ნორმასთან შედარებით', 'к вашей норме', 'vs your need'),
  quizTitle: s('არ იცით, რომელი რაციონი გჭირდებათ?', 'Не знаете, какой рацион вам нужен?', 'Not sure which ration you need?'),
  quizSub: s('6 მარტივი კითხვა — და ჩვენ გამოვთვლით კალორიულობას', '6 простых вопросов — и мы рассчитаем калорийность', 'Six quick questions and we work out the calories'),
  quizBtn: s('რაციონის შერჩევა', 'Подобрать рацион', 'Find my ration'),
  quizReset: s('გასუფთავება', 'Сбросить', 'Reset'),
  quizEdit: s('შეცვლა', 'Изменить', 'Edit'),
  quizApply: s('არჩევა: {cal} კკალ', 'Выбрать {cal} ккал', 'Choose {cal} kcal'),
  qSex: s('ვისთვის ვარჩევთ?', 'Для кого подбираем?', 'Who is it for?'),
  qAge: s('რამდენი წლის ხართ?', 'Сколько вам лет?', 'How old are you?'),
  qHeight: s('რა სიმაღლე გაქვთ?', 'Какой у вас рост?', 'How tall are you?'),
  qWeight: s('რამდენს იწონით?', 'Сколько вы весите?', 'How much do you weigh?'),
  qActivity: s('რამდენად აქტიური ხართ?', 'Насколько вы активны?', 'How active are you?'),
  qGoal: s('რა არის თქვენი მიზანი?', 'Какая у вас цель?', 'What is your goal?'),
  qResult: s('თქვენი რაციონი', 'Ваш рацион', 'Your ration'),
  yrs: s('წლის', 'лет', 'years'),
  cm: s('სმ', 'см', 'cm'),
  kg: s('კგ', 'кг', 'kg'),
  savedNote: s('პარამეტრები შეინახება ამ მოწყობილობაზე.', 'Параметры сохранятся на этом устройстве.', 'Your details are saved on this device.'),
  contains: s('შეიცავს', 'Содержит', 'Contains'),
  rBody: s('თქვენი სხეული', 'Ваше тело', 'Your body'),
  rBmi: s('სმი', 'ИМТ', 'BMI'),
  bmiUnder: s('წონის დეფიციტი', 'Недостаток веса', 'Underweight'),
  bmiNormal: s('ნორმა', 'Норма', 'Healthy'),
  bmiOver: s('ჭარბი წონა', 'Избыточный вес', 'Overweight'),
  bmiObese: s('სიმსუქნე', 'Ожирение', 'Obesity'),
  rHealthy: s('ჯანსაღი წონა თქვენი სიმაღლისთვის: {a}–{b} კგ', 'Здоровый вес для вашего роста: {a}–{b} кг', 'Healthy weight for your height: {a}–{b} kg'),
  rCalories: s('კალორიები დღეში', 'Калории в день', 'Calories a day'),
  rMaintain: s('შენარჩუნება', 'Поддержание', 'To maintain'),
  rTarget: s('თქვენი მიზანი', 'Ваша цель', 'Your goal'),
  rRation: s('არჩეული რაციონი', 'Выбранный рацион', 'Chosen ration'),
  rMacros: s('ცილა · ცხიმი · ნახშირწყლები დღეში', 'БЖУ в день', 'Macros a day'),
  rWater: s('წყალი', 'Вода', 'Water'),
  rWaterText: s('დაახლოებით {l} ლიტრი დღეში', 'Около {l} л в день', 'About {l} L a day'),
  rPace: s('ტემპი', 'Темп', 'Pace'),
  rPaceText: s('დაახლოებით {kg} კგ კვირაში', 'Около {kg} кг в неделю', 'About {kg} kg a week'),
  rPaceKeep: s('წონა სტაბილური დარჩება', 'Вес останется стабильным', 'Your weight stays steady'),
  rChoose: s('აირჩიეთ რაციონი', 'Выберите рацион', 'Choose a ration'),
  tooLow: s('თქვენთვის ძალიან ცოტაა', 'Слишком мало для вас', 'Too low for you'),
  calcShort: s(
    'ეს {diff} კკალ-ით ნაკლებია თქვენს მიზანზე — დანარჩენი შეგიძლიათ საკუთარი ულუფით შეავსოთ.',
    'Это на {diff} ккал меньше вашей цели — недостающее можно добрать своим перекусом.',
    'That is {diff} kcal under your target — top it up with a snack of your own.'
  ),
  mapExpand: s('გაშლა', 'На весь экран', 'Full screen'),
  mapDone: s('მზადაა', 'Готово', 'Done'),
  deliveryPoint: s('მიტანის წერტილი', 'Точка доставки', 'Delivery point'),
  pickOnMap: s('მონიშნეთ მისამართი რუკაზე', 'Отметьте адрес на карте', 'Pin your address on the map'),
  mapHint: s('დააჭირეთ რუკას ან გადაიტანეთ მარკერი', 'Нажмите на карту или перетащите метку', 'Tap the map or drag the pin'),
  mapLocate: s('ჩემი მდებარეობა', 'Где я', 'Where am I'),
  mapResolving: s('ვადგენთ მისამართს…', 'Определяем адрес…', 'Finding the address…'),
  mapPinned: s('წერტილი მონიშნულია', 'Точка отмечена', 'Point pinned'),
  mapGpsFail: s('მდებარეობა ვერ დადგინდა. ნება დართეთ ბრაუზერში ან მონიშნეთ რუკაზე.', 'Не удалось определить местоположение. Разрешите доступ в браузере или отметьте точку на карте.', 'Could not get your location. Allow it in the browser or pin the point on the map.'),
  outOfZone: s('ამ წერტილში მიტანა ჯერ არ ხერხდება — დაგვირეკეთ.', 'В эту точку мы пока не доставляем — позвоните нам.', 'We do not deliver to this point yet — please call us.'),
  soon: s('მალე', 'Скоро', 'Soon'),
  inWork: s('მენიუ მუშავდება', 'Меню в проработке', 'Menu in the works'),
  inWorkShort: s('მუშავდება', 'В проработке', 'In the works'),
  payCourierCash: s('ნაღდი ფული კურიერთან', 'Наличными курьеру', 'Cash to the courier'),
  payCourierCard: s('ბარათი კურიერთან', 'Картой курьеру', 'Card to the courier'),
  dayMenuNote: s(
    'რაციონი {kcal} კკალ · დღის მენიუ {sum} კკალ ({diff}). მონაცემები — რეალური პორციები.',
    'Рацион {kcal} ккал · меню дня {sum} ккал ({diff}). Данные — реальные порции.',
    'Ration {kcal} kcal · menu of the day {sum} kcal ({diff}). Real portions.'
  ),
  dayMenuOff: s(
    'ამ დღის კერძები ჯერ ზუსტად არ ემთხვევა რაციონის კალორიებს — მენიუს შევსებისას დაიხვეწება.',
    'Блюда этого дня пока не дают точно калорийность рациона — расчёт уточнится по мере пополнения меню.',
    'The dishes of this day do not hit the ration calories exactly yet — it gets tighter as the menu grows.'
  ),
  grams: s('გ', 'г', 'g'),
  portionNote: s(
    'პორციები მორგებულია თქვენს {kcal} კკალ-ზე (×{k}). სტანდარტული პორციებით: {base} კკალ.',
    'Порции подогнаны под ваши {kcal} ккал (×{k}). В стандартных порциях: {base} ккал.',
    'Portions are scaled to your {kcal} kcal (×{k}). Standard portions: {base} kcal.'
  ),
  perMeals: s('კვება', 'приёма', 'meals'),
  noRations: s(
    'ამ დროისთვის რაციონები მიუწვდომელია — მენიუ ივსება. დაგვირეკეთ და დაგეხმარებით.',
    'Рационы временно недоступны — меню пополняется. Позвоните нам, мы поможем.',
    'Rations are temporarily unavailable — the menu is being filled. Call us and we will help.'
  ),
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

/** "приёма" / "приёмов" / "კვება" / "meals" for n meals. */
export const mealsWord = (n: number, l: Locale) => (l === 'ru' ? (n < 5 ? 'приёма' : 'приёмов') : l === 'ka' ? 'კვება' : 'meals');
