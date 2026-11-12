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

// Photos are NOT stored here: a stand-in picture of another dish is worse than none. Upload real ones in the admin panel.
const img = (_name: string) => '';

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
  // ───────────────────── SECOND BATCH (workbook, status "existing") ─────────────────────
  {
    key: 'syrniki', day: 'sat', mealType: 'breakfast', image: '', weightGrams: 0, cookingMethod: 'baked',
    tags: ['#Завтрак', '#ВысокийБелок'], allergens: ['Яйца', 'Лактоза', 'Глютен'], rating: 4.9,
    name: { ru: 'Сырники со сметаной и ягодами', en: 'Cottage Cheese Syrniki with Berries' },
    desc: {
      ka: 'ნაზი ხაჭოს სირნიკები არაჟნითა და ახალი კენკროვანით.',
      ru: 'Нежные сырники из обезжиренного творога со сметаной и ягодами.',
      en: 'Tender low-fat cottage cheese pancakes with sour cream and berries.',
    },
    ingredients: {
      ka: ['ხაჭო 0%', 'კვერცხის გული', 'ბრინჯის ფქვილი', 'ხორბლის ფქვილი', 'ფხვნილი შაქარი', 'კარაქი', 'არაჟანი 12%', 'უშაქრო კენკროვანი მურაბა', 'სეზონური კენკრა'],
      ru: ['Творог 0%', 'Яичный желток', 'Рисовая мука', 'Пшеничная мука', 'Сахарная пудра', 'Сливочное масло', 'Сметана 12%', 'Ягодный джем без сахара', 'Сезонные ягоды'],
      en: ['Cottage cheese 0%', 'Egg yolk', 'Rice flour', 'Wheat flour', 'Powdered sugar', 'Butter', 'Sour cream 12%', 'Sugar-free berry jam', 'Seasonal berries'],
    },
  },
  {
    key: 'protein-oatmeal', day: 'sun', mealType: 'breakfast', image: '', weightGrams: 300, cookingMethod: 'steamed',
    tags: ['#Завтрак', '#ВысокийБелок'], allergens: ['Лактоза', 'Глютен'], rating: 4.8,
    name: { ru: 'Протеиновая овсянка', en: 'Protein Oatmeal' },
    desc: {
      ka: 'ცილოვანი შვრიის ფაფა შოკოლადის გემოთი და ჩიას თესლით.',
      ru: 'Овсянка с шоколадным протеином и семенами чиа.',
      en: 'Oatmeal with chocolate protein and chia seeds.',
    },
    ingredients: {
      ka: ['შოკოლადის პროტეინი', 'შვრიის ფანტელი', 'რძე 1,5%', 'ჩიას თესლი', 'კარაქი'],
      ru: ['Шоколадный протеин', 'Овсяные хлопья', 'Молоко 1,5%', 'Семена чиа', 'Сливочное масло'],
      en: ['Chocolate protein', 'Rolled oats', 'Milk 1.5%', 'Chia seeds', 'Butter'],
    },
  },
  {
    key: 'dushbara-potato-chicken', day: 'sun', mealType: 'lunch', image: '', weightGrams: 500, cookingMethod: 'baked',
    tags: ['#Обед', '#ВысокийБелок'], allergens: [], rating: 4.8,
    name: { ru: 'Картофель «душбара» с куриным бедром', en: 'Dushbara-style Potatoes with Chicken Thigh' },
    desc: {
      ka: 'კარტოფილი ქათმის ბარკლით, სტაფილოთი და ბულგარული წიწაკით.',
      ru: 'Картофель с куриным бедром, морковью и болгарским перцем.',
      en: 'Potatoes with chicken thigh, carrot and bell pepper.',
    },
    ingredients: {
      ka: ['ქათმის ბარკლის ფილე', 'კარტოფილი', 'სტაფილო', 'ხახვი', 'ბულგარული წიწაკა', 'მწვანილი', 'კარი'],
      ru: ['Филе куриного бедра', 'Картофель', 'Морковь', 'Лук', 'Болгарский перец', 'Зелень', 'Карри'],
      en: ['Chicken thigh fillet', 'Potato', 'Carrot', 'Onion', 'Bell pepper', 'Herbs', 'Curry'],
    },
  },
  {
    key: 'bowl-bbq-chicken', day: 'fri', mealType: 'dinner', image: '', weightGrams: 430, cookingMethod: 'baked',
    tags: ['#Ужин', '#Боул'], allergens: [], rating: 4.9,
    name: { ru: 'Боул с курицей BBQ', en: 'BBQ Chicken Bowl' },
    desc: {
      ka: 'ბოული BBQ სოუსში ქათმით, ბასმათის ბრინჯითა და ავოკადოთი.',
      ru: 'Боул с курицей в соусе BBQ, рисом басмати и авокадо.',
      en: 'Bowl with BBQ chicken, basmati rice and avocado.',
    },
    ingredients: {
      ka: ['ქათმის ფილე', 'ბასმათის ბრინჯი', 'BBQ სოუსი', 'კიტრი', 'ჩერი პომიდორი', 'სიმინდი', 'ავოკადო', 'პაპრიკა'],
      ru: ['Куриное филе', 'Рис басмати', 'Соус BBQ', 'Огурец', 'Черри', 'Кукуруза', 'Авокадо', 'Паприка'],
      en: ['Chicken fillet', 'Basmati rice', 'BBQ sauce', 'Cucumber', 'Cherry tomatoes', 'Corn', 'Avocado', 'Paprika'],
    },
  },
  {
    key: 'bowl-shrimp', day: 'sun', mealType: 'dinner', image: '', weightGrams: 480, cookingMethod: 'raw',
    tags: ['#Ужин', '#Боул'], allergens: ['Ракообразные', 'Рыба', 'Яйца', 'Сезам'], rating: 4.8,
    name: { ru: 'Боул с креветками', en: 'Shrimp Bowl' },
    desc: {
      ka: 'ბოული კრევეტით, ბრინჯით, ავოკადოთი და ახალი ბოსტნეულით.',
      ru: 'Боул с креветками, рисом, авокадо и свежими овощами.',
      en: 'Bowl with shrimp, rice, avocado and fresh vegetables.',
    },
    ingredients: {
      ka: ['ბრინჯი', 'კრევეტი', 'კიტრი', 'პომიდორი', 'სიმინდი', 'ავოკადო', 'კრაბის ჯოხები', 'ყველი', 'მაიონეზი', 'სეზამი'],
      ru: ['Рис', 'Креветки', 'Огурец', 'Помидор', 'Кукуруза', 'Авокадо', 'Крабовые палочки', 'Сыр', 'Майонез', 'Кунжут'],
      en: ['Rice', 'Shrimp', 'Cucumber', 'Tomato', 'Corn', 'Avocado', 'Crab sticks', 'Cheese', 'Mayonnaise', 'Sesame'],
    },
  },
  {
    key: 'poke-chicken-teriyaki', day: 'tue', mealType: 'dinner', image: '', weightGrams: 290, cookingMethod: 'raw',
    tags: ['#Ужин', '#Поке'], allergens: ['Соя', 'Сезам'], rating: 4.8,
    name: { ru: 'Поке с курицей терияки', en: 'Chicken Teriyaki Poke' },
    desc: {
      ka: 'პოკე ქათმის მკერდით ტერიაკის სოუსში, ავოკადოთი და ედამამეთი.',
      ru: 'Поке с куриной грудкой в соусе терияки, авокадо и эдамаме.',
      en: 'Poke with teriyaki chicken breast, avocado and edamame.',
    },
    ingredients: {
      ka: ['ქათმის მკერდი', 'ბრინჯი', 'ტერიაკის სოუსი', 'ავოკადო', 'კიტრი', 'ედამამე', 'სეზამი'],
      ru: ['Куриная грудка', 'Рис', 'Соус терияки', 'Авокадо', 'Огурец', 'Эдамаме', 'Кунжут'],
      en: ['Chicken breast', 'Rice', 'Teriyaki sauce', 'Avocado', 'Cucumber', 'Edamame', 'Sesame'],
    },
  },
  // ── light salads and desserts: snack / dessert slots of the 4-6 meal rations ──
  {
    key: 'salad-crab', day: 'wed', mealType: 'snack', image: '', weightGrams: 225, cookingMethod: 'raw',
    tags: ['#Перекус', '#Салат'], allergens: ['Рыба', 'Яйца'], rating: 4.6,
    name: { ru: 'Диетический салат с крабовыми палочками', en: 'Light Crab Stick Salad' },
    desc: {
      ka: 'მსუბუქი სალათი კრაბის ჯოხებით, სიმინდითა და კიტრით.',
      ru: 'Лёгкий салат с крабовыми палочками, кукурузой и огурцом.',
      en: 'Light salad with crab sticks, corn and cucumber.',
    },
    ingredients: {
      ka: ['კრაბის ჯოხები', 'სიმინდი', 'კვერცხი', 'კიტრი', 'ბრინჯი', 'მაიონეზი'],
      ru: ['Крабовые палочки', 'Кукуруза', 'Яйцо', 'Огурец', 'Рис', 'Майонез'],
      en: ['Crab sticks', 'Corn', 'Egg', 'Cucumber', 'Rice', 'Mayonnaise'],
    },
  },
  {
    key: 'salad-olivier', day: 'thu', mealType: 'snack', image: '', weightGrams: 235, cookingMethod: 'steamed',
    tags: ['#Перекус', '#Салат'], allergens: ['Яйца'], rating: 4.6,
    name: { ru: 'Диетический «Оливье»', en: 'Light Olivier Salad' },
    desc: {
      ka: 'დიეტური ოლივიე ქათმის მკერდით და მსუბუქი მაიონეზით.',
      ru: 'Диетический оливье с куриной грудкой и лёгким майонезом.',
      en: 'Light Olivier salad with chicken breast.',
    },
    ingredients: {
      ka: ['ქათმის მკერდი', 'კარტოფილი', 'სტაფილო', 'კვერცხი', 'მარილიანი კიტრი', 'მწვანე ბარდა', 'მაიონეზი'],
      ru: ['Куриная грудка', 'Картофель', 'Морковь', 'Яйцо', 'Солёный огурец', 'Зелёный горошек', 'Майонез'],
      en: ['Chicken breast', 'Potato', 'Carrot', 'Egg', 'Pickled cucumber', 'Green peas', 'Mayonnaise'],
    },
  },
  {
    key: 'salad-stolichny', day: 'fri', mealType: 'snack', image: '', weightGrams: 260, cookingMethod: 'steamed',
    tags: ['#Перекус', '#Салат'], allergens: ['Яйца'], rating: 4.6,
    name: { ru: 'Диетический «Столичный» салат', en: 'Light Stolichny Salad' },
    desc: {
      ka: 'დიეტური „სტოლიჩნი“ მჭლე საქონლის ხორცით.',
      ru: 'Диетический «Столичный» с нежирной говядиной.',
      en: 'Light Stolichny salad with lean beef.',
    },
    ingredients: {
      ka: ['მჭლე საქონლის ხორცი', 'კარტოფილი', 'სტაფილო', 'კვერცხი', 'მარილიანი კიტრი', 'მაიონეზი'],
      ru: ['Нежирная говядина', 'Картофель', 'Морковь', 'Яйцо', 'Солёный огурец', 'Майонез'],
      en: ['Lean beef', 'Potato', 'Carrot', 'Egg', 'Pickled cucumber', 'Mayonnaise'],
    },
  },
  {
    key: 'salad-shrimp', day: 'sat', mealType: 'snack', image: '', weightGrams: 500, cookingMethod: 'raw',
    tags: ['#Перекус', '#Салат'], allergens: ['Ракообразные'], rating: 4.7,
    name: { ru: 'Салат с креветками', en: 'Shrimp Salad' },
    desc: {
      ka: 'სალათი კრევეტით, ავოკადოთი, არუგულითა და ჩერი პომიდორით.',
      ru: 'Салат с креветками, авокадо, рукколой и черри.',
      en: 'Salad with shrimp, avocado, arugula and cherry tomatoes.',
    },
    ingredients: {
      ka: ['კრევეტი', 'კიტრი', 'ჩერი პომიდორი', 'ავოკადო', 'არუგულა', 'სიმინდი', 'ლიმონის წვენი', 'ზეითუნის ზეთი'],
      ru: ['Креветки', 'Огурец', 'Черри', 'Авокадо', 'Руккола', 'Кукуруза', 'Лимонный сок', 'Оливковое масло'],
      en: ['Shrimp', 'Cucumber', 'Cherry tomatoes', 'Avocado', 'Arugula', 'Corn', 'Lemon juice', 'Olive oil'],
    },
  },
  {
    key: 'trifle-brownie', day: 'sun', mealType: 'dessert', image: '', weightGrams: 0, cookingMethod: 'baked',
    tags: ['#Десерт', '#ВысокийБелок'], allergens: ['Яйца', 'Глютен', 'Лактоза'], rating: 4.9,
    name: { ru: 'Трайфл брауни', en: 'Brownie Trifle' },
    desc: {
      ka: 'ცილოვანი ტრაიფლ-ბრაუნი შოკოლადის პუდინგითა და კენკროვანით.',
      ru: 'Протеиновый трайфл-брауни с шоколадным пудингом и ягодами.',
      en: 'Protein brownie trifle with chocolate pudding and berries.',
    },
    ingredients: {
      ka: ['შვრია', 'კვერცხი', 'კაკაო', 'კეფირი', 'ცილოვანი შოკოლადის პუდინგი', 'კენკრა'],
      ru: ['Овсяные хлопья', 'Яйцо', 'Какао', 'Кефир', 'Протеиновый шоколадный пудинг', 'Ягоды'],
      en: ['Oats', 'Egg', 'Cocoa', 'Kefir', 'Chocolate protein pudding', 'Berries'],
    },
  },
  {
    key: 'cheesecake', day: 'mon', mealType: 'dessert', image: '', weightGrams: 0, cookingMethod: 'baked',
    tags: ['#Десерт', '#ВысокийБелок'], allergens: ['Яйца', 'Глютен', 'Лактоза'], rating: 4.9,
    name: { ru: 'Чизкейк', en: 'Cheesecake' },
    desc: {
      ka: 'მსუბუქი ჩიზქეიქი 0% ხაჭოთი.',
      ru: 'Лёгкий чизкейк на твороге 0%.',
      en: 'Light cheesecake made with 0% cottage cheese.',
    },
    ingredients: {
      ka: ['ორცხობილა', 'კარამელის პუდინგი', 'ხაჭო 0%', 'კვერცხი', 'ვანილი'],
      ru: ['Печенье', 'Карамельный пудинг', 'Творог 0%', 'Яйцо', 'Ваниль'],
      en: ['Biscuit', 'Caramel pudding', 'Cottage cheese 0%', 'Egg', 'Vanilla'],
    },
  },
];
const ALLERGEN_KA: Record<string, string> = {
  'Яйца': 'კვერცხი',
  'Лактоза': 'რძე',
  'Глютен': 'გლუტენი',
  'Рыба': 'თევზი',
  'Соя': 'სოია',
  'Орехи': 'კაკალი',
  'Ракообразные': 'კიბოსნაირები',
  'Сезам': 'სეზამი',
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
  'syrniki': 'breakfast',
  'protein-oatmeal': 'breakfast',
  'dushbara-potato-chicken': 'poultry',
  'bowl-bbq-chicken': 'poultry',
  'bowl-shrimp': 'fish',
  'poke-chicken-teriyaki': 'poultry',
  'salad-crab': 'salad',
  'salad-olivier': 'salad',
  'salad-stolichny': 'salad',
  'salad-shrimp': 'salad',
  'trifle-brownie': 'dessert',
  'cheesecake': 'dessert',
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

// ───────────────────────── SNACKS ─────────────────────────
// Light snacks for the 4-6 meals-a-day rations. Typed by hand (not in the Excel base): the numbers
// are per-portion reference values — check them against the kitchen's real products and fix in the
// admin panel if they differ. Push only these with:
//   node --experimental-strip-types scripts/seed_ration_dishes.mts --snacks [--write]
interface SnackSpec {
  key: string;
  day: DayOfWeek;
  weightGrams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  allergens: string[];
  name: { ka: string; ru: string; en: string };
  desc: { ka: string; ru: string; en: string };
  ingredients: { ka: string[]; ru: string[]; en: string[] };
}

const SNACKS: SnackSpec[] = [
  {
    key: 'snack-apple', day: 'mon', weightGrams: 180, calories: 94, protein: 0.5, fat: 0.4, carbs: 25, allergens: [],
    name: { ka: 'ვაშლი', ru: 'Яблоко', en: 'Apple' },
    desc: { ka: 'ახალი ვაშლი.', ru: 'Свежее яблоко.', en: 'A fresh apple.' },
    ingredients: { ka: ['ვაშლი'], ru: ['Яблоко'], en: ['Apple'] },
  },
  {
    key: 'snack-banana', day: 'tue', weightGrams: 120, calories: 107, protein: 1.3, fat: 0.4, carbs: 27, allergens: [],
    name: { ka: 'ბანანი', ru: 'Банан', en: 'Banana' },
    desc: { ka: 'ახალი ბანანი.', ru: 'Свежий банан.', en: 'A fresh banana.' },
    ingredients: { ka: ['ბანანი'], ru: ['Банан'], en: ['Banana'] },
  },
  {
    key: 'snack-barni', day: 'wed', weightGrams: 30, calories: 130, protein: 2, fat: 6, carbs: 17, allergens: ['Глютен', 'Лактоза', 'Яйца'],
    name: { ka: 'ბარნი', ru: 'Барни', en: 'Barni cake' },
    desc: { ka: 'რბილი ბისკვიტი რძის კრემით.', ru: 'Мягкий бисквит с молочной начинкой.', en: 'Soft sponge cake with a milk filling.' },
    ingredients: { ka: ['ბისკვიტი', 'რძის კრემი'], ru: ['Бисквит', 'Молочная начинка'], en: ['Sponge cake', 'Milk filling'] },
  },
  {
    key: 'snack-oat-cookie', day: 'thu', weightGrams: 40, calories: 170, protein: 3, fat: 6, carbs: 26, allergens: ['Глютен', 'Яйца'],
    name: { ka: 'შვრიის ორცხობილა', ru: 'Овсяное печенье', en: 'Oat cookie' },
    desc: { ka: 'შვრიის ორცხობილა.', ru: 'Овсяное печенье.', en: 'An oat cookie.' },
    ingredients: { ka: ['შვრიის ფანტელი', 'ფქვილი', 'კვერცხი'], ru: ['Овсяные хлопья', 'Мука', 'Яйцо'], en: ['Oats', 'Flour', 'Egg'] },
  },
  {
    key: 'snack-greek-yogurt', day: 'fri', weightGrams: 150, calories: 110, protein: 14, fat: 3, carbs: 7, allergens: ['Лактоза'],
    name: { ka: 'ბერძნული იოგურტი', ru: 'Греческий йогурт', en: 'Greek yogurt' },
    desc: { ka: 'ბერძნული იოგურტი, მაღალი ცილით.', ru: 'Греческий йогурт, много белка.', en: 'Greek yogurt, high in protein.' },
    ingredients: { ka: ['ბერძნული იოგურტი'], ru: ['Греческий йогурт'], en: ['Greek yogurt'] },
  },
  {
    key: 'snack-nuts', day: 'sat', weightGrams: 30, calories: 180, protein: 5, fat: 16, carbs: 4, allergens: ['Орехи'],
    name: { ka: 'თხილეულის ნაკრები', ru: 'Микс орехов', en: 'Nut mix' },
    desc: { ka: 'ნუშის, თხილისა და ნიგვზის ნარევი.', ru: 'Смесь миндаля, фундука и грецкого ореха.', en: 'A mix of almonds, hazelnuts and walnuts.' },
    ingredients: { ka: ['ნუში', 'თხილი', 'ნიგოზი'], ru: ['Миндаль', 'Фундук', 'Грецкий орех'], en: ['Almonds', 'Hazelnuts', 'Walnuts'] },
  },
  {
    key: 'snack-pear', day: 'sun', weightGrams: 170, calories: 98, protein: 0.6, fat: 0.2, carbs: 26, allergens: [],
    name: { ka: 'მსხალი', ru: 'Груша', en: 'Pear' },
    desc: { ka: 'ახალი მსხალი.', ru: 'Свежая груша.', en: 'A fresh pear.' },
    ingredients: { ka: ['მსხალი'], ru: ['Груша'], en: ['Pear'] },
  },
];

/** Snack rows ready to upsert into `partner_products` (channel "site"). No photo yet — upload in the admin panel. */
export const snackSeedRows = SNACKS.map(s => ({
  id: `dish-sn-${s.key}`,
  slug: s.key,
  name: s.name,
  description: s.desc,
  category: 'snack',
  category_name: { ka: 'snack', ru: 'snack', en: 'snack' },
  meal_type: 'snack' as MealType,
  day: s.day,
  price: 0,
  cost_price: 0,
  calories: s.calories,
  protein: s.protein,
  fat: s.fat,
  carbs: s.carbs,
  weight_grams: s.weightGrams,
  image: '',
  ingredients: s.ingredients,
  allergens: s.allergens.map(a => ALLERGEN_KA[a] ?? a),
  cooking_method: 'classic',
  target_channels: ['site'],
  badge: null,
}));
