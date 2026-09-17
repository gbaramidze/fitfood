export interface AllergenCategory {
  id: string;
  label: {
    ru: string;
    ka: string;
    en: string;
  };
}

export interface AllergenItem {
  id: string;
  name: {
    ru: string;
    ka: string;
    en: string;
  };
  categoryId: string;
  isCommonAllergen?: boolean;
  keywords: {
    ru: string[];
    ka: string[];
    en: string[];
  };
}

export const ALLERGEN_CATEGORIES: AllergenCategory[] = [
  {
    id: 'all',
    label: { ru: 'Все', ka: 'ყველა', en: 'All' },
  },
  {
    id: 'popular',
    label: { ru: 'Главные аллергены', ka: 'ძირითადი ალერგენები', en: 'Top Allergens' },
  },
  {
    id: 'nuts_seeds',
    label: { ru: 'Орехи и кунжут', ka: 'თხილი & სეზამი', en: 'Nuts & Seeds' },
  },
  {
    id: 'eggs_poultry',
    label: { ru: 'Яйца и птица', ka: 'კვერცხი & ფრინველი', en: 'Eggs & Poultry' },
  },
  {
    id: 'dairy',
    label: { ru: 'Молочка и лактоза', ka: 'რძის პროდუქტები', en: 'Dairy & Lactose' },
  },
  {
    id: 'seafood',
    label: { ru: 'Рыба и морепродукты', ka: 'თევზი & ზღვის პროდუქტები', en: 'Fish & Seafood' },
  },
  {
    id: 'gluten_grains',
    label: { ru: 'Глютен и злаки', ka: 'გლუტენი & მარცვლეული', en: 'Gluten & Cereals' },
  },
  {
    id: 'vegetables',
    label: { ru: 'Овощи и зелень', ka: 'ბოსტნეული & მწვანილი', en: 'Vegetables & Herbs' },
  },
  {
    id: 'meat',
    label: { ru: 'Мясо', ka: 'ხორცი', en: 'Meat' },
  },
  {
    id: 'mushrooms',
    label: { ru: 'Грибы', ka: 'სოკო', en: 'Mushrooms' },
  },
  {
    id: 'soy_legumes',
    label: { ru: 'Соя и бобовые', ka: 'სოიო & პარკოსნები', en: 'Soy & Legumes' },
  },
  {
    id: 'fruits_berries',
    label: { ru: 'Фрукты и ягоды', ka: 'ხილი & კენკრა', en: 'Fruits & Berries' },
  },
  {
    id: 'other',
    label: { ru: 'Сахар, мед и соусы', ka: 'შაქარი & სოუსები', en: 'Sugar, Honey & Other' },
  },
];

export const ALLERGENS_DATABASE: AllergenItem[] = [
  // --- NUTS & SEEDS ---
  {
    id: 'sesame',
    name: {
      ru: 'Кунжут и сезам',
      ka: 'სეზამი და ქუნჯუთი',
      en: 'Sesame & Tahini',
    },
    categoryId: 'nuts_seeds',
    isCommonAllergen: true,
    keywords: {
      ru: ['кунжут', 'сезам', 'кунжутное', 'тахини', 'тхина'],
      ka: ['სეზამი', 'ქუნჯუთი', 'ტაჰინი', 'ტახინი'],
      en: ['sesame', 'tahini', 'sesame seeds', 'sesame oil'],
    },
  },
  {
    id: 'peanuts',
    name: {
      ru: 'Арахис',
      ka: 'არაქისი',
      en: 'Peanuts',
    },
    categoryId: 'nuts_seeds',
    isCommonAllergen: true,
    keywords: {
      ru: ['арахис', 'земляной орех', 'арахисовая паста', 'арахисовое'],
      ka: ['არაქისი', 'მიწის თხილი', 'არაქისის კარაქი'],
      en: ['peanuts', 'peanut butter', 'groundnuts'],
    },
  },
  {
    id: 'walnuts',
    name: {
      ru: 'Грецкий орех',
      ka: 'ნიგოზი',
      en: 'Walnuts',
    },
    categoryId: 'nuts_seeds',
    isCommonAllergen: true,
    keywords: {
      ru: ['грецкий орех', 'грецкие орехи', 'орех', 'орехи'],
      ka: ['ნიგოზი', 'ნიგვზის', 'კაკალი'],
      en: ['walnuts', 'walnut'],
    },
  },
  {
    id: 'hazelnuts',
    name: {
      ru: 'Фундук и лесной орех',
      ka: 'თხილი',
      en: 'Hazelnuts',
    },
    categoryId: 'nuts_seeds',
    isCommonAllergen: true,
    keywords: {
      ru: ['фундук', 'лесной орех', 'лещина'],
      ka: ['თხილი', 'ტყის თხილი'],
      en: ['hazelnuts', 'filberts', 'hazelnut'],
    },
  },
  {
    id: 'almonds',
    name: {
      ru: 'Миндаль',
      ka: 'ნუში',
      en: 'Almonds',
    },
    categoryId: 'nuts_seeds',
    isCommonAllergen: true,
    keywords: {
      ru: ['миндаль', 'миндальная мука', 'миндальное'],
      ka: ['ნუში', 'ნუშის'],
      en: ['almonds', 'almond flour', 'almond milk'],
    },
  },
  {
    id: 'cashews',
    name: {
      ru: 'Кешью',
      ka: 'კეშიუ',
      en: 'Cashews',
    },
    categoryId: 'nuts_seeds',
    isCommonAllergen: true,
    keywords: {
      ru: ['кешью', 'орехи кешью'],
      ka: ['კეშიუ'],
      en: ['cashews', 'cashew'],
    },
  },
  {
    id: 'pine_nuts',
    name: {
      ru: 'Кедровый орех',
      ka: 'კედარის თხილი',
      en: 'Pine Nuts',
    },
    categoryId: 'nuts_seeds',
    keywords: {
      ru: ['кедровый орех', 'кедровые орехи'],
      ka: ['კედარის კაკალი', 'კედარის თხილი'],
      en: ['pine nuts', 'pine nut'],
    },
  },
  {
    id: 'chia_seeds',
    name: {
      ru: 'Семена чиа',
      ka: 'ჩიას თესლი',
      en: 'Chia Seeds',
    },
    categoryId: 'nuts_seeds',
    keywords: {
      ru: ['чиа', 'семена чиа'],
      ka: ['ჩია', 'ჩიას თესლი'],
      en: ['chia', 'chia seeds'],
    },
  },
  {
    id: 'sunflower_seeds',
    name: {
      ru: 'Семена подсолнечника',
      ka: 'მზესუმზირა',
      en: 'Sunflower Seeds',
    },
    categoryId: 'nuts_seeds',
    keywords: {
      ru: ['подсолнечник', 'семечки', 'семена подсолнечника'],
      ka: ['მზესუმზირა', 'მზესუმზირის თესლი'],
      en: ['sunflower', 'sunflower seeds'],
    },
  },
  {
    id: 'pumpkin_seeds',
    name: {
      ru: 'Тыквенные семечки',
      ka: 'გოგრის თესლი',
      en: 'Pumpkin Seeds',
    },
    categoryId: 'nuts_seeds',
    keywords: {
      ru: ['тыква', 'тыквенные семечки', 'семена тыквы'],
      ka: ['გოგრის თესლი', 'გოგრა'],
      en: ['pumpkin seeds', 'pepitas'],
    },
  },

  // --- EGGS & POULTRY ---
  {
    id: 'eggs',
    name: {
      ru: 'Куриные яйца и омлеты',
      ka: 'ქათმის კვერცხი & ომლეტი',
      en: 'Chicken Eggs & Omelets',
    },
    categoryId: 'eggs_poultry',
    isCommonAllergen: true,
    keywords: {
      ru: ['яйца', 'яйцо', 'яичный', 'белок', 'желток', 'омлет', 'меланж'],
      ka: ['კვერცხი', 'კვერცხის ცილა', 'კვერცხის გული', 'ომლეტი'],
      en: ['egg', 'eggs', 'egg whites', 'yolk', 'omelet'],
    },
  },
  {
    id: 'quail_eggs',
    name: {
      ru: 'Перепелиные яйца',
      ka: 'მწყრის კვერცხი',
      en: 'Quail Eggs',
    },
    categoryId: 'eggs_poultry',
    keywords: {
      ru: ['перепелиные', 'перепелиное яйцо'],
      ka: ['მწყრის კვერცხი'],
      en: ['quail eggs', 'quail egg'],
    },
  },
  {
    id: 'chicken',
    name: {
      ru: 'Куриное мясо и филе',
      ka: 'ქათმის ხორცი & ფილე',
      en: 'Chicken Meat & Breast',
    },
    categoryId: 'eggs_poultry',
    keywords: {
      ru: ['курица', 'куриное филе', 'куриная грудка', 'цыпленок'],
      ka: ['ქათამი', 'ქათმის ფილე', 'ქათმის ხორცი'],
      en: ['chicken', 'chicken breast', 'poultry'],
    },
  },
  {
    id: 'turkey',
    name: {
      ru: 'Индейка',
      ka: 'ინდაურის ხორცი',
      en: 'Turkey',
    },
    categoryId: 'eggs_poultry',
    keywords: {
      ru: ['индейка', 'филе индейки', 'индейки'],
      ka: ['ინდაური', 'ინდაურის ფილე'],
      en: ['turkey', 'turkey breast'],
    },
  },

  // --- DAIRY & LACTOSE ---
  {
    id: 'lactose',
    name: {
      ru: 'Лактоза и коровье молоко',
      ka: 'ლაქტოზა & ძროხის რძე',
      en: 'Lactose & Cow Milk',
    },
    categoryId: 'dairy',
    isCommonAllergen: true,
    keywords: {
      ru: ['лактоза', 'молоко', 'сливки', 'сыворотка', 'молочный'],
      ka: ['ლაქტოზა', 'რძე', 'ნაღები', 'რძის'],
      en: ['lactose', 'milk', 'dairy', 'whey'],
    },
  },
  {
    id: 'cottage_cheese',
    name: {
      ru: 'Творог и рикотта',
      ka: 'ხაჭო და რიკოტა',
      en: 'Cottage Cheese & Ricotta',
    },
    categoryId: 'dairy',
    keywords: {
      ru: ['творог', 'творожный', 'рикотта', 'сырники'],
      ka: ['ხაჭო', 'რიკოტა', 'სირნიკები'],
      en: ['cottage cheese', 'ricotta', 'curd'],
    },
  },
  {
    id: 'cheese',
    name: {
      ru: 'Сыр (пармезан, сулугуни, моцарелла)',
      ka: 'ყველი (მოცარელა, სულგუნი, პარმეზანი)',
      en: 'Cheese (Mozzarella, Parmesan, Sulguni)',
    },
    categoryId: 'dairy',
    keywords: {
      ru: ['сыр', 'пармезан', 'сулугуни', 'моцарелла', 'чеддер', 'гауда', 'фета'],
      ka: ['ყველი', 'სულგუნი', 'მოცარელა', 'პარმეზანი', 'ფეტა'],
      en: ['cheese', 'parmesan', 'sulguni', 'mozzarella', 'cheddar', 'feta'],
    },
  },
  {
    id: 'butter',
    name: {
      ru: 'Сливочное масло и гхи',
      ka: 'კარაქი & ერბო',
      en: 'Butter & Ghee',
    },
    categoryId: 'dairy',
    keywords: {
      ru: ['сливочное масло', 'масло сливочное', 'гхи'],
      ka: ['კარაქი', 'ერბო'],
      en: ['butter', 'ghee'],
    },
  },
  {
    id: 'yogurt_sourcream',
    name: {
      ru: 'Йогурт и сметана',
      ka: 'იოგურტი და არაჟანი',
      en: 'Yogurt & Sour Cream',
    },
    categoryId: 'dairy',
    keywords: {
      ru: ['йогурт', 'греческий йогурт', 'сметана', 'мацони'],
      ka: ['იოგურტი', 'არაჟანი', 'მაწონი'],
      en: ['yogurt', 'greek yogurt', 'sour cream'],
    },
  },

  // --- SEAFOOD & FISH ---
  {
    id: 'fish',
    name: {
      ru: 'Рыба (лосось, тунец, сибас, треска)',
      ka: 'თევზი (ორაგული, თუნუსი, სიბასი)',
      en: 'Fish (Salmon, Tuna, Seabass, Cod)',
    },
    categoryId: 'seafood',
    isCommonAllergen: true,
    keywords: {
      ru: ['рыба', 'лосось', 'семга', 'тунец', 'сибас', 'треска', 'хек', 'дорадо', 'форель'],
      ka: ['თევზი', 'ორაგული', 'თუნუსი', 'სიბასი', 'კალმახი', 'ვირთევზა'],
      en: ['fish', 'salmon', 'tuna', 'seabass', 'cod', 'trout', 'dorado'],
    },
  },
  {
    id: 'shrimp_crustaceans',
    name: {
      ru: 'Креветки и ракообразные',
      ka: 'კრევეტები და კიბოსნაირნი',
      en: 'Shrimp & Crustaceans',
    },
    categoryId: 'seafood',
    isCommonAllergen: true,
    keywords: {
      ru: ['креветки', 'креветка', 'краб', 'раки', 'омар', 'лангустин'],
      ka: ['კრევეტები', 'კრევეტი', 'კიბორჩხალა', 'ლანგუსტი'],
      en: ['shrimp', 'prawns', 'crab', 'lobster', 'crustaceans'],
    },
  },
  {
    id: 'squid_molluscs',
    name: {
      ru: 'Кальмары, осьминоги и мидии',
      ka: 'კალმარი, რვაფეხა & მიდიები',
      en: 'Squid, Octopus & Mussels',
    },
    categoryId: 'seafood',
    isCommonAllergen: true,
    keywords: {
      ru: ['кальмар', 'кальмары', 'осьминог', 'мидии', 'моллюски', 'гребешки'],
      ka: ['კალმარი', 'რვაფეხა', 'მიდიები', 'ზღვის სავარცხელი'],
      en: ['squid', 'calamari', 'octopus', 'mussels', 'scallops', 'molluscs'],
    },
  },

  // --- GLUTEN & GRAINS ---
  {
    id: 'gluten',
    name: {
      ru: 'Глютен и пшеничная мука',
      ka: 'გლუტენი & ხორბლის ფქვილი',
      en: 'Gluten & Wheat Flour',
    },
    categoryId: 'gluten_grains',
    isCommonAllergen: true,
    keywords: {
      ru: ['глютен', 'пшеница', 'пшеничная', 'мука', 'макароны', 'паста'],
      ka: ['გლუტენი', 'ხორბალი', 'ფქვილი', 'მაკარონი', 'პასტა'],
      en: ['gluten', 'wheat', 'flour', 'pasta'],
    },
  },
  {
    id: 'oats',
    name: {
      ru: 'Овсянка и овсяные хлопья',
      ka: 'შვრია & შვრიის ფანტელები',
      en: 'Oats & Oatmeal',
    },
    categoryId: 'gluten_grains',
    keywords: {
      ru: ['овсянка', 'овес', 'овсяные', 'геркулес'],
      ka: ['შვრია', 'ჰერკულესი'],
      en: ['oats', 'oatmeal', 'rolled oats'],
    },
  },
  {
    id: 'bulgur_couscous',
    name: {
      ru: 'Булгур, кускус и ячмень',
      ka: 'ბულგური, კუსკუსი & ქერი',
      en: 'Bulgur, Couscous & Barley',
    },
    categoryId: 'gluten_grains',
    keywords: {
      ru: ['булгур', 'кускус', 'ячмень', 'перловка', 'полба', 'рожь'],
      ka: ['ბულგური', 'კუსკუსი', 'ქერი', 'ჭვავი'],
      en: ['bulgur', 'couscous', 'barley', 'rye'],
    },
  },

  // --- VEGETABLES & HERBS ---
  {
    id: 'onion_garlic',
    name: {
      ru: 'Лук и чеснок',
      ka: 'ხახვი და ნიორი',
      en: 'Onion & Garlic',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['лук', 'чеснок', 'зеленый лук', 'порей', 'шалот'],
      ka: ['ხახვი', 'ნიორი', 'მწვანე ხახვი', 'პრასი'],
      en: ['onion', 'garlic', 'green onion', 'leek', 'shallot'],
    },
  },
  {
    id: 'cilantro',
    name: {
      ru: 'Кинза и кориандр',
      ka: 'ქინძი',
      en: 'Cilantro & Fresh Coriander',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['кинза', 'кориандр', 'свежая кинза'],
      ka: ['ქინძი', 'ცოცხალი ქინძი'],
      en: ['cilantro', 'coriander'],
    },
  },
  {
    id: 'celery',
    name: {
      ru: 'Сельдерей (стебель и корень)',
      ka: 'ნიახური',
      en: 'Celery (Stalk & Root)',
    },
    categoryId: 'vegetables',
    isCommonAllergen: true,
    keywords: {
      ru: ['сельдерей', 'стебель сельдерея', 'корень сельдерея'],
      ka: ['ნიახური'],
      en: ['celery', 'celeriac', 'celery stalk'],
    },
  },
  {
    id: 'tomatoes',
    name: {
      ru: 'Помидоры и томатная паста',
      ka: 'პომიდორი & ტომატ-პასტა',
      en: 'Tomatoes & Tomato Paste',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['помидоры', 'томаты', 'помидор', 'черри', 'томатная паста', 'томатный соус'],
      ka: ['პომიდორი', 'ჩერი', 'ტომატი', 'ტომატ-პასტა'],
      en: ['tomatoes', 'tomato', 'cherry tomatoes', 'tomato sauce'],
    },
  },
  {
    id: 'bell_pepper',
    name: {
      ru: 'Болгарский и сладкий перец',
      ka: 'ბულგარული წიწაკა',
      en: 'Bell Pepper & Sweet Paprika',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['болгарский перец', 'перец болгарский', 'паприка', 'сладкий перец'],
      ka: ['ბულგარული წიწაკა', 'ტკბილი წიწაკა', 'პაპრიკა'],
      en: ['bell pepper', 'sweet pepper', 'paprika'],
    },
  },
  {
    id: 'eggplant',
    name: {
      ru: 'Баклажаны',
      ka: 'ბადრიჯანი',
      en: 'Eggplant & Aubergine',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['баклажан', 'баклажаны'],
      ka: ['ბადრიჯანი'],
      en: ['eggplant', 'aubergine'],
    },
  },
  {
    id: 'cucumber',
    name: {
      ru: 'Свежие огурцы',
      ka: 'კიტრი',
      en: 'Cucumbers',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['огурцы', 'огурец', 'малосольные огурцы'],
      ka: ['კიტრი'],
      en: ['cucumber', 'cucumbers'],
    },
  },
  {
    id: 'dill_parsley',
    name: {
      ru: 'Укроп и петрушка',
      ka: 'კამა და ოხრახუში',
      en: 'Dill & Parsley',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['укроп', 'петрушка', 'зелень'],
      ka: ['კამა', 'ოხრახუში', 'მწვანილი'],
      en: ['dill', 'parsley', 'fresh herbs'],
    },
  },
  {
    id: 'broccoli',
    name: {
      ru: 'Брокколи и цветная капуста',
      ka: 'ბროკოლი & ყვავილოვანი კომბოსტო',
      en: 'Broccoli & Cauliflower',
    },
    categoryId: 'vegetables',
    keywords: {
      ru: ['брокколи', 'цветная капуста', 'капуста'],
      ka: ['ბროკოლი', 'ყვავილოვანი კომბოსტო', 'კომბოსტო'],
      en: ['broccoli', 'cauliflower', 'cabbage'],
    },
  },

  // --- MUSHROOMS ---
  {
    id: 'mushrooms',
    name: {
      ru: 'Грибы (шампиньоны, вешенки, белые)',
      ka: 'სოკო (შამპინიონი, კალმახა სოკო)',
      en: 'Mushrooms (Champignon, Oyster, Porcini)',
    },
    categoryId: 'mushrooms',
    keywords: {
      ru: ['грибы', 'шампиньоны', 'вешенки', 'белые грибы', 'грибной'],
      ka: ['სოკო', 'შამპინიონი', 'კალმახა სოკო'],
      en: ['mushrooms', 'champignon', 'porcini', 'oyster mushrooms'],
    },
  },

  // --- MEAT ---
  {
    id: 'pork',
    name: {
      ru: 'Свинина и бекон',
      ka: 'ღორის ხორცი და ბეკონი',
      en: 'Pork & Bacon',
    },
    categoryId: 'meat',
    keywords: {
      ru: ['свинина', 'бекон', 'свиной'],
      ka: ['ღორის ხორცი', 'ბეკონი', 'ღორი'],
      en: ['pork', 'bacon', 'ham'],
    },
  },
  {
    id: 'beef',
    name: {
      ru: 'Говядина и телятина',
      ka: 'საქონლის ხორცი & ხბოს ხორცი',
      en: 'Beef & Veal',
    },
    categoryId: 'meat',
    keywords: {
      ru: ['говядина', 'телятина', 'говяжий фарш', 'стейк'],
      ka: ['საქონლის ხორცი', 'ხბოს ხორცი', 'საქონელი'],
      en: ['beef', 'veal', 'steak'],
    },
  },
  {
    id: 'lamb',
    name: {
      ru: 'Баранина',
      ka: 'ცხვრის ხორცი',
      en: 'Lamb & Mutton',
    },
    categoryId: 'meat',
    keywords: {
      ru: ['баранина', 'ягненок'],
      ka: ['ცხვრის ხორცი', 'ბატკანი'],
      en: ['lamb', 'mutton'],
    },
  },

  // --- SOY & LEGUMES ---
  {
    id: 'soy',
    name: {
      ru: 'Соя, тофу и соевый соус',
      ka: 'სოიო, ტოფუ & სოიოს სოუსი',
      en: 'Soy, Tofu & Soy Sauce',
    },
    categoryId: 'soy_legumes',
    isCommonAllergen: true,
    keywords: {
      ru: ['соя', 'тофу', 'соевый соус', 'соевые бобы', 'эдамаме'],
      ka: ['სოიო', 'ტოფუ', 'სოიოს სოუსი'],
      en: ['soy', 'soya', 'tofu', 'soy sauce', 'edamame'],
    },
  },
  {
    id: 'beans_chickpeas',
    name: {
      ru: 'Фасоль, нут и чечевица',
      ka: 'ლობიო, მუხუდო & ოსპი',
      en: 'Beans, Chickpeas & Lentils',
    },
    categoryId: 'soy_legumes',
    keywords: {
      ru: ['фасоль', 'нут', 'чечевица', 'горох', 'бобовые', 'лобио'],
      ka: ['ლობიო', 'მუხუდო', 'ოსპი', 'ბარდა'],
      en: ['beans', 'chickpeas', 'lentils', 'peas', 'legumes'],
    },
  },

  // --- FRUITS & BERRIES ---
  {
    id: 'citrus',
    name: {
      ru: 'Цитрусовые (лимон, апельсин, грейпфрут)',
      ka: 'ციტრუსი (ლიმონი, ფორთოხალი, გრეიპფრუტი)',
      en: 'Citrus (Lemon, Orange, Grapefruit)',
    },
    categoryId: 'fruits_berries',
    keywords: {
      ru: ['лимон', 'апельсин', 'лайм', 'грейпфрут', 'мандарин', 'цитрус'],
      ka: ['ლიმონი', 'ფორთოხალი', 'ლაიმი', 'გრეიპფრუტი', 'მანდარინი', 'ციტრუსი'],
      en: ['citrus', 'lemon', 'orange', 'lime', 'grapefruit'],
    },
  },
  {
    id: 'strawberries_berries',
    name: {
      ru: 'Клубника и лесные ягоды',
      ka: 'მარწყვი & ტყის კენკრა',
      en: 'Strawberries & Berries',
    },
    categoryId: 'fruits_berries',
    keywords: {
      ru: ['клубника', 'земляника', 'малина', 'ежевика', 'черника', 'брусника', 'ягоды'],
      ka: ['მარწყვი', 'ჟოლო', 'მაყვალი', 'მოცვი', 'კენკრა'],
      en: ['strawberry', 'strawberries', 'raspberry', 'blackberry', 'blueberry', 'berries'],
    },
  },
  {
    id: 'kiwi',
    name: {
      ru: 'Киви',
      ka: 'კივი',
      en: 'Kiwi Fruit',
    },
    categoryId: 'fruits_berries',
    keywords: {
      ru: ['киви'],
      ka: ['კივი'],
      en: ['kiwi', 'kiwifruit'],
    },
  },
  {
    id: 'banana',
    name: {
      ru: 'Бананы',
      ka: 'ბანანი',
      en: 'Bananas',
    },
    categoryId: 'fruits_berries',
    keywords: {
      ru: ['банан', 'бананы'],
      ka: ['ბანანი'],
      en: ['banana', 'bananas'],
    },
  },
  {
    id: 'avocado',
    name: {
      ru: 'Авокадо',
      ka: 'ავოკადო',
      en: 'Avocado',
    },
    categoryId: 'fruits_berries',
    keywords: {
      ru: ['авокадо', 'гуакамоле'],
      ka: ['ავოკადო'],
      en: ['avocado', 'guacamole'],
    },
  },

  // --- OTHER / SAUCES ---
  {
    id: 'sugar_syrups',
    name: {
      ru: 'Сахар и сладкие сиропы',
      ka: 'შაქარი & სიროფები',
      en: 'Added Sugar & Syrups',
    },
    categoryId: 'other',
    keywords: {
      ru: ['сахар', 'сироп', 'глюкоза', 'карамель'],
      ka: ['შაქარი', 'სიროფი'],
      en: ['sugar', 'syrup', 'cane sugar'],
    },
  },
  {
    id: 'honey',
    name: {
      ru: 'Натуральный мед',
      ka: 'ნატურალური თაფლი',
      en: 'Natural Honey',
    },
    categoryId: 'other',
    keywords: {
      ru: ['мед', 'мёд', 'медовый'],
      ka: ['თაფლი'],
      en: ['honey'],
    },
  },
  {
    id: 'mustard',
    name: {
      ru: 'Горчица и семена горчицы',
      ka: 'მდოგვი',
      en: 'Mustard & Mustard Seeds',
    },
    categoryId: 'other',
    isCommonAllergen: true,
    keywords: {
      ru: ['горчица', 'дижонская горчица', 'зерна горчицы'],
      ka: ['მდოგვი', 'დიჟონის მდოგვი'],
      en: ['mustard', 'dijon mustard', 'mustard seeds'],
    },
  },
  {
    id: 'spicy_chili',
    name: {
      ru: 'Острое (перец чили, халапеньо, табаско)',
      ka: 'ცხარე (ჩილი, ჰალაპენიო, ტაბასკო)',
      en: 'Spicy (Chili Pepper, Jalapeño, Hot Sauce)',
    },
    categoryId: 'other',
    keywords: {
      ru: ['острое', 'чили', 'перец чили', 'халапеньо', 'кайенский', 'табаско', 'острый'],
      ka: ['ცხარე', 'ჩილი', 'ჰალაპენიო', 'მწარე წიწაკა'],
      en: ['spicy', 'chili', 'hot pepper', 'jalapeno', 'cayenne', 'hot sauce'],
    },
  },
  {
    id: 'mayo_vinegar',
    name: {
      ru: 'Майонез и уксус',
      ka: 'მაიონეზი & ძმარი',
      en: 'Mayonnaise & Vinegar',
    },
    categoryId: 'other',
    keywords: {
      ru: ['майонез', 'уксус', 'бальзамический уксус', 'яблочный уксус'],
      ka: ['მაიონეზი', 'ძმარი'],
      en: ['mayonnaise', 'mayo', 'vinegar'],
    },
  },
];

export const getAllergenDisplayName = (idOrCustom: string, locale: 'ru' | 'ka' | 'en'): string => {
  const item = ALLERGENS_DATABASE.find(a => a.id === idOrCustom);
  if (item && item.name && item.name[locale]) {
    return item.name[locale];
  }
  return idOrCustom;
};

