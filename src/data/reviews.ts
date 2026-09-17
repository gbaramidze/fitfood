export interface CustomerStory {
  id: string;
  name: string;
  age?: number;
  duration: string;
  beforeWeight: string;
  afterWeight: string;
  diffKg: string;
  avatarBefore?: string;
  avatarAfter?: string;
  program: string;
  rating: number;
  resultMetric: {
    ka: string;
    ru: string;
    en: string;
  };
  text: {
    ka: string;
    ru: string;
    en: string;
  };
  location: string;
}

export const customerReviews: CustomerStory[] = [
  {
    id: 'rev-c1',
    name: 'Анна',
    age: 29,
    duration: '5 месяцев',
    beforeWeight: '70 кг',
    afterWeight: '53 кг',
    diffKg: '-17 кг',
    avatarBefore: '/images/reviews/anna-before.webp',
    avatarAfter: '/images/reviews/anna-after.webp',
    program: 'СНИЖЕНИЕ 1000–1250 ккал',
    rating: 5,
    resultMetric: {
      ka: '-17 კგ 5 თვეში',
      ru: '-17 кг за 5 месяцев',
      en: '-17 kg in 5 months',
    },
    text: {
      ka: 'FitFood-მა მთლიანად შეცვალა ჩემი ცხოვრება. შიმშილის გარეშე, გემრიელი დესერტებითა და სირნიკებით მივაღწიე საუკეთესო ფორმას!',
      ru: 'Мне очень нравится питание! Попробовав аналоги, пришла к выводу, что это лучшее меню. Заказывала рацион 1000–1250 ккал, еда разнообразная, вкусная, не тянет на сладкое, потому что в меню есть классные ПП-десерты.',
      en: 'The meals are incredible! Ordered the 1000-1250 kcal plan, dropped 17 kg effortlessly while enjoying sugar-free desserts.',
    },
    location: 'Батуми, Руставели',
  },
  {
    id: 'rev-c2',
    name: 'Александр',
    age: 34,
    duration: '7 месяцев',
    beforeWeight: '116 кг',
    afterWeight: '74 кг',
    diffKg: '-42 кг',
    avatarBefore: '/images/reviews/alex-before.webp',
    avatarAfter: '/images/reviews/alex-after.webp',
    program: 'БАЛАНС 1800 ккал',
    rating: 5,
    resultMetric: {
      ka: '-42 კგ 7 თვეში',
      ru: '-42 кг за 7 месяцев',
      en: '-42 kg in 7 months',
    },
    text: {
      ka: 'უდიდესი ენერგია და დროის ეკონომია. ზუსტი კალორიები, წვნიანი ხორცი და თევზი ყოველდღე.',
      ru: 'На мой взгляд, это самая вкусная еда на рынке доставки. Четкий подсчет калорий, нет чувства голода, порции сытные. За 7 месяцев минус 42 кг! Освободилась куча времени, которое раньше уходило на плиту.',
      en: 'Best meal prep service hands down. Precise macros, hearty portions, dropped 42 kg over 7 months without starvation.',
    },
    location: 'Батуми, Аллея Героев',
  },
  {
    id: 'rev-c3',
    name: 'Анастасия',
    age: 27,
    duration: '4 месяца',
    beforeWeight: '93 кг',
    afterWeight: '83 кг',
    diffKg: '-10 кг',
    avatarBefore: '/images/reviews/anna-before.webp',
    avatarAfter: '/images/reviews/anna-after.webp',
    program: 'СНИЖЕНИЕ 1250 ккал',
    rating: 5,
    resultMetric: {
      ka: '-10 კგ 4 თვეში',
      ru: '-10 кг за 4 месяца',
      en: '-10 kg in 4 months',
    },
    text: {
      ka: 'ყველაზე კომფორტული კვება დეკრეტში. დილით კონტეინერი უკვე კარებთანაა, 2 წუთი მიკროტალღურში და მზადაა!',
      ru: 'Питание сэкономило мне тонну сил: после работы или бессонных ночей не нужно стоять у плиты. 2 минуты в микроволновке — и ресторанное блюдо готово. Минус 10 кг легко и без срывов!',
      en: 'Saved me countless hours. 2 minutes in the microwave and healthy gourmet food is ready. Lost 10 kg easily.',
    },
    location: 'Батуми, Старый Город',
  },
];
