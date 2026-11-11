import type { DayOfWeek, MealType } from '../types/index';
import recipes from './rationRecipes.json' with { type: 'json' };

/**
 * RATION-ONLY dishes for the `partner_products` table (channel "site", NOT "pos").
 *
 * KBJU and Georgian names come from the kitchen's Excel recipe base:
 *   python scripts/import_ration_recipes.py <workbook.xlsx>    ->  rationRecipes.json
 * This file adds what the workbook has no columns for (RU/EN copy, weekday, meal slot, photo,
 * allergens) and is pushed to the database with:
 *   node --experimental-strip-types scripts/seed_ration_dishes.mts
 *
 * Left out on purpose — already in the database from the admin panel: buckwheat with chicken,
 * pasta julienne, pilaf and chicken shawarma.
 *
 * `day` places a dish on a weekday; when a weekday + meal has several dishes they take turns
 * week by week (see src/lib/rationRotation.ts).
 */

type RecipeKey = keyof typeof recipes;

interface Spec {
  key: RecipeKey;
  day: DayOfWeek;
  mealType: MealType;
  image: string;
  weightGrams: number;
  cookingMethod?: string;
  tags: string[];
  allergens: string[];
  rating: number;
  name: { ru: string; en: string };
  desc: { ka: string; ru: string; en: string };
  ingredients: { ka: string[]; ru: string[]; en: string[] };
}

const img = (n: string) => `/images/meals/${n}.webp`;

const SPECS: Spec[] = [
  // ───────────────────────── BREAKFAST ─────────────────────────
  {
    key: 'omelet-tomato',
    day: 'mon',
    mealType: 'breakfast',
    image: img('protein-pancakes'),
    weightGrams: 380,
    cookingMethod: 'baked',
    tags: ['#Завтрак', '#ВысокийБелок', '#Омлет'],
    allergens: ['Яйца', 'Лактоза'],
    rating: 4.9,
    name: { ru: 'Омлет с томатами и овощами на пару', en: 'Tomato Omelette with Steamed Vegetables' },
    desc: {
      ka: 'ფაფუკი ომლეტი ცილით და ტკბილი პომიდვრით, გვერდზე ორთქლზე მოხარშული ბროკოლი, ყვავილოვანი კომბოსტო და ხრაშუნა კიტრი.',
      ru: 'Пышный омлет с белком и сладкими томатами, рядом брокколи и цветная капуста на пару и хрустящий огурец.',
      en: 'Fluffy egg-white omelette with sweet tomatoes, served with steamed broccoli, cauliflower and crisp cucumber.',
    },
    ingredients: {
      ka: ['კვერცხი', 'კვერცხის ცილა', 'რძე 1,5%', 'პომიდორი', 'ბროკოლი', 'ყვავილოვანი კომბოსტო', 'კიტრი'],
      ru: ['Яйцо', 'Яичный белок', 'Молоко 1,5%', 'Томаты', 'Брокколи', 'Цветная капуста', 'Огурец'],
      en: ['Egg', 'Egg whites', 'Milk 1.5%', 'Tomatoes', 'Broccoli', 'Cauliflower', 'Cucumber'],
    },
  },
  {
    key: 'chicken-cutlets-puree',
    day: 'tue',
    mealType: 'breakfast',
    image: img('cutlet-kasha'),
    weightGrams: 390,
    cookingMethod: 'baked',
    tags: ['#Завтрак', '#Сытно', '#ВысокийБелок'],
    allergens: ['Яйца', 'Лактоза', 'Глютен'],
    rating: 4.88,
    name: { ru: 'Куриные котлеты с картофельным пюре и овощами', en: 'Chicken Cutlets with Mash and Vegetables' },
    desc: {
      ka: 'ნაზი ქათმის კატლეტები ყველით, ჰაეროვანი კარტოფილის პიურე, ბროკოლი და ბულგარული წიწაკა.',
      ru: 'Нежные куриные котлеты с сыром, воздушное картофельное пюре, брокколи и сладкий перец.',
      en: 'Tender cheesy chicken cutlets, airy potato purée, broccoli and sweet pepper.',
    },
    ingredients: {
      ka: ['ქათმის მკერდი', 'კვერცხი', 'მაგარი ყველი', 'კარტოფილი', 'რძე 1,5%', 'ბროკოლი', 'ბულგარული წიწაკა', 'ხახვი'],
      ru: ['Куриная грудка', 'Яйцо', 'Твёрдый сыр', 'Картофель', 'Молоко 1,5%', 'Брокколи', 'Болгарский перец', 'Лук'],
      en: ['Chicken breast', 'Egg', 'Hard cheese', 'Potato', 'Milk 1.5%', 'Broccoli', 'Bell pepper', 'Onion'],
    },
  },
  {
    key: 'cottage-pancakes',
    day: 'fri',
    mealType: 'breakfast',
    image: img('syrniki-strawberry'),
    weightGrams: 300,
    cookingMethod: 'baked',
    tags: ['#Завтрак', '#Творог', '#БезСахараВСоусе'],
    allergens: ['Яйца', 'Лактоза', 'Глютен'],
    rating: 4.92,
    name: { ru: 'Творожные панкейки с греческим йогуртом и ягодами', en: 'Cottage Cheese Pancakes with Greek Yogurt' },
    desc: {
      ka: 'ხაჭოს პანკეიკები ბერძნული იოგურტით და უშაქრო კენკროვანი მურაბით — ტკბილი დასაწყისი ცილით.',
      ru: 'Пышные панкейки на твороге с греческим йогуртом и ягодным джемом без сахара — сладкий старт с белком.',
      en: 'Soft cottage-cheese pancakes with Greek yogurt and sugar-free berry jam — a sweet start loaded with protein.',
    },
    ingredients: {
      ka: ['ხაჭო 0%', 'კვერცხი', 'კეფირი 1%', 'ფქვილი', 'ბერძნული იოგურტი 2%', 'უშაქრო კენკროვანი მურაბა'],
      ru: ['Творог 0%', 'Яйцо', 'Кефир 1%', 'Мука', 'Греческий йогурт 2%', 'Ягодный джем без сахара'],
      en: ['Cottage cheese 0%', 'Egg', 'Kefir 1%', 'Flour', 'Greek yogurt 2%', 'Sugar-free berry jam'],
    },
  },
  {
    key: 'lazy-curd-balls',
    day: 'thu',
    mealType: 'breakfast',
    image: img('curd-casserole'),
    weightGrams: 330,
    cookingMethod: 'steamed',
    tags: ['#Завтрак', '#Творог', '#Хит'],
    allergens: ['Яйца', 'Лактоза', 'Глютен'],
    rating: 4.9,
    name: { ru: 'Ленивые вареники с творогом и ягодным соусом', en: 'Lazy Cottage Cheese Dumplings with Berry Sauce' },
    desc: {
      ka: 'ზარმაცი ვარენიკი ხაჭოსგან — ნაზი, მსუბუქი, არაჟნითა და კენკრით.',
      ru: 'Ленивые вареники из обезжиренного творога — нежные, лёгкие, со сметаной и свежими ягодами.',
      en: 'Lazy dumplings made from skim cottage cheese — tender and light, with sour cream and fresh berries.',
    },
    ingredients: {
      ka: ['ხაჭო 0%', 'კვერცხი', 'ბრინჯის ფქვილი', 'ხორბლის ფქვილი', 'არაჟანი 12%', 'კენკრა', 'უშაქრო მურაბა'],
      ru: ['Творог 0%', 'Яйцо', 'Рисовая мука', 'Пшеничная мука', 'Сметана 12%', 'Ягоды', 'Джем без сахара'],
      en: ['Cottage cheese 0%', 'Egg', 'Rice flour', 'Wheat flour', 'Sour cream 12%', 'Berries', 'Sugar-free jam'],
    },
  },

  // ───────────────────────── LUNCH ─────────────────────────
  {
    key: 'lazy-tolma-turkey',
    day: 'mon',
    mealType: 'lunch',
    image: img('chicken-roll-bulgur'),
    weightGrams: 400,
    cookingMethod: 'baked',
    tags: ['#Обед', '#Индейка', '#Классика'],
    allergens: [],
    rating: 4.87,
    name: { ru: 'Ленивая толма с индейкой', en: 'Lazy Tolma with Turkey' },
    desc: {
      ka: 'ზარმაცი თოლმა ინდაურის ფარშით, ბრინჯითა და ნაზი კომბოსტოთი პომიდვრის სოუსში.',
      ru: 'Ленивая толма: фарш из индейки, рис и нежная капуста в томатном соусе — как дома, только полезнее.',
      en: 'Lazy cabbage-roll tolma with turkey mince, rice and tender cabbage in tomato sauce.',
    },
    ingredients: {
      ka: ['ინდაურის ფარში', 'ბრინჯი', 'თეთრი კომბოსტო', 'სტაფილო', 'ხახვი', 'პომიდვრის პასტა'],
      ru: ['Фарш из индейки', 'Рис', 'Белокочанная капуста', 'Морковь', 'Лук', 'Томатная паста'],
      en: ['Turkey mince', 'Rice', 'White cabbage', 'Carrot', 'Onion', 'Tomato paste'],
    },
  },
  {
    key: 'fish-veg-crust-buckwheat',
    day: 'sat',
    mealType: 'lunch',
    image: img('fish-cutlet-potato'),
    weightGrams: 400,
    cookingMethod: 'baked',
    tags: ['#Обед', '#Рыба', '#Омега3'],
    allergens: ['Рыба', 'Лактоза'],
    rating: 4.9,
    name: { ru: 'Рыба под овощной «шубой» с гречкой', en: 'Veggie-Crust Baked Fish with Buckwheat' },
    desc: {
      ka: 'ტილაპია სტაფილოსა და ხახვის „ქურქში“, არაჟნით გამომცხვარი, გვერდზე მსხვრევადი წიწიბურა.',
      ru: 'Филе тилапии под «шубой» из моркови и лука со сметаной, запечённое до нежности, с рассыпчатой гречкой.',
      en: 'Tilapia fillet baked under a carrot-and-onion crust with a touch of sour cream, served with fluffy buckwheat.',
    },
    ingredients: {
      ka: ['ტილაპიის ფილე', 'სტაფილო', 'ხახვი', 'არაჟანი 12%', 'წიწიბურა', 'კიტრი', 'პომიდორი'],
      ru: ['Филе тилапии', 'Морковь', 'Лук', 'Сметана 12%', 'Гречка', 'Огурец', 'Томаты'],
      en: ['Tilapia fillet', 'Carrot', 'Onion', 'Sour cream 12%', 'Buckwheat', 'Cucumber', 'Tomato'],
    },
  },
  {
    key: 'potato-souffle-chicken-cheese',
    day: 'wed',
    mealType: 'lunch',
    image: img('chicken-cheese-buckwheat'),
    weightGrams: 400,
    cookingMethod: 'baked',
    tags: ['#Обед', '#Курица', '#Суфле'],
    allergens: ['Яйца', 'Лактоза'],
    rating: 4.91,
    name: { ru: 'Картофельное суфле с курицей, грибами и сыром', en: 'Potato Soufflé with Chicken, Mushrooms & Cheese' },
    desc: {
      ka: 'ჰაეროვანი კარტოფილის სუფლე ქათმით, შამპინიონითა და ყველის ქერქით.',
      ru: 'Воздушное картофельное суфле с курицей и шампиньонами под сырной корочкой.',
      en: 'Airy potato soufflé with chicken and champignons under a golden cheese crust.',
    },
    ingredients: {
      ka: ['კარტოფილი', 'ქათმის მკერდი', 'შამპინიონი', 'მაგარი ყველი', 'კვერცხის ცილა', 'ბერძნული იოგურტი 2%', 'რძე 1,5%'],
      ru: ['Картофель', 'Куриная грудка', 'Шампиньоны', 'Твёрдый сыр', 'Яичный белок', 'Греческий йогурт 2%', 'Молоко 1,5%'],
      en: ['Potato', 'Chicken breast', 'Champignons', 'Hard cheese', 'Egg whites', 'Greek yogurt 2%', 'Milk 1.5%'],
    },
  },
  {
    key: 'braised-cabbage-turkey',
    day: 'sun',
    mealType: 'lunch',
    image: img('bulgur-mushrooms'),
    weightGrams: 420,
    cookingMethod: 'baked',
    tags: ['#Обед', '#Индейка', '#НизкийЖир'],
    allergens: [],
    rating: 4.84,
    name: { ru: 'Тушёная капуста с индейкой', en: 'Braised Cabbage with Turkey' },
    desc: {
      ka: 'მოშუშული კომბოსტო ინდაურის ფარშით, სტაფილოთი და პაპრიკით — მსუბუქი და დამაკმაყოფილებელი.',
      ru: 'Тушёная капуста с фаршем из индейки, морковью и паприкой — лёгкое и сытное блюдо.',
      en: 'Slow-braised cabbage with turkey mince, carrot and paprika — light yet filling.',
    },
    ingredients: {
      ka: ['ინდაურის ფარში', 'თეთრი კომბოსტო', 'სტაფილო', 'ხახვი', 'პომიდვრის პასტა', 'პაპრიკა'],
      ru: ['Фарш из индейки', 'Белокочанная капуста', 'Морковь', 'Лук', 'Томатная паста', 'Паприка'],
      en: ['Turkey mince', 'White cabbage', 'Carrot', 'Onion', 'Tomato paste', 'Paprika'],
    },
  },
  {
    key: 'beef-mushroom-stroganoff',
    day: 'fri',
    mealType: 'lunch',
    image: img('beef-demiglace-puree'),
    weightGrams: 380,
    cookingMethod: 'baked',
    tags: ['#Обед', '#Говядина', '#Премиум'],
    allergens: ['Лактоза'],
    rating: 4.93,
    name: { ru: 'Говядина с грибами в стиле бефстроганов', en: 'Beef Stroganoff-Style with Mushrooms' },
    desc: {
      ka: 'მჭლე საქონლის ხორცი შამპინიონით არაჟნისა და მდოგვის სოუსში, გვერდზე კარტოფილის პიურე და ბროკოლი.',
      ru: 'Постная говядина с шампиньонами в сметанно-горчичном соусе, с картофельным пюре и брокколи.',
      en: 'Lean beef with champignons in a sour-cream mustard sauce, served with potato purée and broccoli.',
    },
    ingredients: {
      ka: ['საქონლის ხორცი', 'შამპინიონი', 'არაჟანი 10%', 'მდოგვი', 'ხახვი', 'კარტოფილი', 'ბროკოლი'],
      ru: ['Говядина', 'Шампиньоны', 'Сметана 10%', 'Горчица', 'Лук', 'Картофель', 'Брокколи'],
      en: ['Beef', 'Champignons', 'Sour cream 10%', 'Mustard', 'Onion', 'Potato', 'Broccoli'],
    },
  },
  // ───────────────────────── DINNER ─────────────────────────
  {
    key: 'turkey-hedgehogs',
    day: 'tue',
    mealType: 'dinner',
    image: img('fish-cheese-risotto'),
    weightGrams: 380,
    cookingMethod: 'steamed',
    tags: ['#Ужин', '#Индейка', '#ДляДетей'],
    allergens: ['Яйца', 'Лактоза'],
    rating: 4.92,
    name: { ru: 'Ежики из индейки в соусе', en: 'Turkey “Hedgehogs” in Tomato Sauce' },
    desc: {
      ka: 'ინდაურის „ზღარბები“ ბრინჯით ნაზ პომიდვრისა და არაჟნის სოუსში, ახალ ბოსტნეულთან ერთად.',
      ru: 'Нежные «ёжики» из индейки с рисом в томатно-сметанном соусе и свежими овощами.',
      en: 'Tender turkey-and-rice “hedgehog” meatballs in a tomato–sour-cream sauce with fresh vegetables.',
    },
    ingredients: {
      ka: ['ინდაურის ფარში', 'ბრინჯი', 'ხახვი', 'სტაფილო', 'პომიდვრის პასტა', 'არაჟანი 10%', 'ბულგარული წიწაკა'],
      ru: ['Фарш из индейки', 'Рис', 'Лук', 'Морковь', 'Томатная паста', 'Сметана 10%', 'Болгарский перец'],
      en: ['Turkey mince', 'Rice', 'Onion', 'Carrot', 'Tomato paste', 'Sour cream 10%', 'Bell pepper'],
    },
  },
  {
    key: 'lentil-soup-puree',
    day: 'wed',
    mealType: 'dinner',
    image: img('pumpkin-bluecheese'),
    weightGrams: 450,
    cookingMethod: 'steamed',
    tags: ['#Ужин', '#Суп', '#Клетчатка'],
    allergens: ['Лактоза'],
    rating: 4.85,
    name: { ru: 'Чечевичный суп-пюре с курицей', en: 'Red Lentil Cream Soup with Chicken' },
    desc: {
      ka: 'წითელი ოსპის კრემ-სუპი ქათმით — თბილი, ხავერდოვანი, მსუბუქი ვახშმისთვის.',
      ru: 'Бархатный суп-пюре из красной чечевицы с курицей — тёплый и лёгкий ужин.',
      en: 'Velvety red-lentil cream soup with chicken — a warm, light dinner.',
    },
    ingredients: {
      ka: ['წითელი ოსპი', 'ქათმის მკერდი', 'კარტოფილი', 'სტაფილო', 'ხახვი', 'კარაქი'],
      ru: ['Красная чечевица', 'Куриная грудка', 'Картофель', 'Морковь', 'Лук', 'Сливочное масло'],
      en: ['Red lentils', 'Chicken breast', 'Potato', 'Carrot', 'Onion', 'Butter'],
    },
  },
  {
    key: 'bowl-chicken-thigh',
    day: 'mon',
    mealType: 'dinner',
    image: img('chicken-ptitim'),
    weightGrams: 400,
    cookingMethod: 'baked',
    tags: ['#Ужин', '#Боул', '#Курица'],
    allergens: ['Яйца', 'Лактоза'],
    rating: 4.9,
    name: { ru: 'Боул с куриным бедром, гречкой и фетой', en: 'Chicken Thigh Bowl with Buckwheat & Feta' },
    desc: {
      ka: 'ბოული ქათმის ბარკლით, წიწიბურით, მოხარშული კვერცხით, ჩერი პომიდვრითა და ფეტათი.',
      ru: 'Боул с куриным бедром, гречкой, варёным яйцом, черри и сыром фета.',
      en: 'Bowl with chicken thigh, buckwheat, boiled egg, cherry tomatoes and feta.',
    },
    ingredients: {
      ka: ['ქათმის ბარკალი', 'წიწიბურა', 'მოხარშული კვერცხი', 'სალათის ფოთოლი', 'ჩერი პომიდორი', 'კიტრი', 'ფეტა'],
      ru: ['Куриное бедро', 'Гречка', 'Варёное яйцо', 'Салатные листья', 'Черри', 'Огурец', 'Фета'],
      en: ['Chicken thigh', 'Buckwheat', 'Boiled egg', 'Lettuce', 'Cherry tomatoes', 'Cucumber', 'Feta'],
    },
  },
  {
    key: 'chicken-broccoli-buckwheat',
    day: 'thu',
    mealType: 'dinner',
    image: img('chicken-cheese-buckwheat'),
    weightGrams: 420,
    cookingMethod: 'baked',
    tags: ['#Ужин', '#Курица', '#ВысокийБелок'],
    allergens: ['Яйца', 'Лактоза'],
    rating: 4.91,
    name: { ru: 'Курица с брокколи под сырной шапкой и гречкой', en: 'Cheesy Chicken & Broccoli Bake with Buckwheat' },
    desc: {
      ka: 'ქათამი ბროკოლით ნაზ არაჟნიან-ყველიან ზემოდან, გვერდზე მარცვლოვანი წიწიბურა.',
      ru: 'Курица с брокколи под сметанно-сырной заливкой и рассыпчатая гречка на гарнир.',
      en: 'Chicken with broccoli under a creamy cheese bake, with fluffy buckwheat on the side.',
    },
    ingredients: {
      ka: ['ქათმის მკერდი', 'ბროკოლი', 'კვერცხი', 'არაჟანი 12%', 'მაგარი ყველი', 'წიწიბურა'],
      ru: ['Куриная грудка', 'Брокколи', 'Яйцо', 'Сметана 12%', 'Твёрдый сыр', 'Гречка'],
      en: ['Chicken breast', 'Broccoli', 'Egg', 'Sour cream 12%', 'Hard cheese', 'Buckwheat'],
    },
  },
  {
    key: 'bowl-trout',
    day: 'sat',
    mealType: 'dinner',
    image: img('fish-rice'),
    weightGrams: 360,
    cookingMethod: 'raw',
    tags: ['#Ужин', '#Боул', '#Омега3'],
    allergens: ['Рыба', 'Соя'],
    rating: 4.93,
    name: { ru: 'Боул с слабосолёной форелью и авокадо', en: 'Lightly Salted Trout Bowl with Avocado' },
    desc: {
      ka: 'ბოული ოდნავ დამარილებული კალმახით, ავოკადოთი, კიტრითა და სოიოს სოუსით.',
      ru: 'Боул со слабосолёной форелью, авокадо, свежим огурцом и соевым соусом.',
      en: 'Bowl with lightly salted trout, avocado, fresh cucumber and soy dressing.',
    },
    ingredients: {
      ka: ['ბრინჯი', 'ჩუკა', 'კიტრი', 'ოდნავ დამარილებული კალმახი', 'ავოკადო', 'სეზამი', 'სოიოს სოუსი'],
      ru: ['Рис', 'Чука', 'Огурец', 'Слабосолёная форель', 'Авокадо', 'Кунжут', 'Соевый соус'],
      en: ['Rice', 'Chuka seaweed', 'Cucumber', 'Lightly salted trout', 'Avocado', 'Sesame', 'Soy sauce'],
    },
  },
];
const ALLERGEN_KA: Record<string, string> = {
  'Яйца': 'კვერცხი',
  'Лактоза': 'რძე',
  'Глютен': 'გლუტენი',
  'Рыба': 'თევზი',
  'Соя': 'სოია',
};

const CATEGORY: Record<string, string> = {
  'omelet-tomato': 'breakfast',
  'chicken-cutlets-puree': 'poultry',
  'cottage-pancakes': 'breakfast',
  'lazy-curd-balls': 'breakfast',
  'lazy-tolma-turkey': 'poultry',
  'fish-veg-crust-buckwheat': 'fish',
  'potato-souffle-chicken-cheese': 'poultry',
  'braised-cabbage-turkey': 'poultry',
  'beef-mushroom-stroganoff': 'meat',
  'turkey-hedgehogs': 'poultry',
  'lentil-soup-puree': 'poultry',
  'bowl-chicken-thigh': 'poultry',
  'chicken-broccoli-buckwheat': 'poultry',
  'bowl-trout': 'fish',
};

/** Rows ready to upsert into `partner_products`. */
export const rationSeedRows = SPECS.map(s => {
  const r = recipes[s.key];
  return {
    id: `dish-xl-${s.key}`,
    slug: s.key,
    name: { ka: r.nameKa, ru: s.name.ru, en: s.name.en },
    description: s.desc,
    category: CATEGORY[s.key] ?? 'poultry',
    category_name: { ka: CATEGORY[s.key] ?? 'poultry', ru: CATEGORY[s.key] ?? 'poultry', en: CATEGORY[s.key] ?? 'poultry' },
    meal_type: s.mealType,
    day: s.day,
    price: 0, // ration-only: never sold on its own
    cost_price: 0,
    calories: r.calories,
    protein: r.protein,
    fat: r.fat,
    carbs: r.carbs,
    weight_grams: s.weightGrams,
    image: s.image,
    ingredients: s.ingredients,
    allergens: s.allergens.map(a => ALLERGEN_KA[a] ?? a),
    cooking_method: 'classic',
    target_channels: ['site'],
    badge: null,
  };
});
