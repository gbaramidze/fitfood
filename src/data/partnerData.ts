import { PartnerPoint, PartnerProduct, PartnerSale, PartnerShipment, PartnerWriteOff } from '@/types/partner';

export const initialPartnerPoints: PartnerPoint[] = [
  {
    id: 'point-mega-gym',
    name: {
      ru: 'Mega Gym',
      ka: 'Mega Gym',
      en: 'Mega Gym',
    },
    city: 'Batumi',
    address: {
      ru: 'ул. Качинских 5Б',
      ka: 'კაჩინსკების 5ბ',
      en: '5B Kachinski St',
    },
    cashierPin: '1111',
    managerPin: '7777',
    commissionPercent: 0,
    phone: '+995 555 11 22 33',
    status: 'active',
  },
  {
    id: 'point-xxl',
    name: {
      ru: 'XXL',
      ka: 'XXL',
      en: 'XXL',
    },
    city: 'Batumi',
    address: {
      ru: 'ул. Качинских 1',
      ka: 'კაცინსკების 1',
      en: '1 Kachinski St',
    },
    cashierPin: '2222',
    managerPin: '8888',
    commissionPercent: 0,
    phone: '+995 555 22 33 44',
    status: 'active',
  },
  {
    id: 'point-fitness-academy',
    name: {
      ru: 'Fitness Academy',
      ka: 'Fitness Academy',
      en: 'Fitness Academy',
    },
    city: 'Batumi',
    address: {
      ru: 'ул. Пиросмани 18',
      ka: 'ფიროსმანის 18',
      en: '18 Pirosmani St',
    },
    cashierPin: '3333',
    managerPin: '9999',
    commissionPercent: 0,
    phone: '+995 555 33 44 55',
    status: 'active',
  },
];

export const partnerProducts: PartnerProduct[] = [
  {
    id: 'prod-chicken-quinoa',
    name: {
      ru: 'Куриное филе гриль с киноа и брокколи',
      ka: 'ქათმის ფილე გრილზე კინოათი და ბროკოლით',
      en: 'Grilled Chicken Breast with Quinoa & Broccoli',
    },
    category: 'poultry',
    categoryName: {
      ru: 'Птица / Питание',
      ka: 'ქათამი / კვება',
      en: 'Poultry / Meals',
    },
    price: 16,
    costPrice: 9.5,
    calories: 420,
    weightGrams: 320,
    image: '/images/meals/chicken-cheese-buckwheat.webp',
    badge: {
      ru: 'Хит продаж',
      ka: 'ტოპ გაყიდვა',
      en: 'Top Seller',
    },
  },
  {
    id: 'prod-tuna-steak',
    name: {
      ru: 'Стейк из тунца с диким рисом и спаржей',
      ka: 'თუნუქის სტეიკი ველური ბრინჯით და სატაცურით',
      en: 'Tuna Steak with Wild Rice & Asparagus',
    },
    category: 'fish',
    categoryName: {
      ru: 'Рыба и Морепродукты',
      ka: 'თევზი და ზღვის პროდუქტები',
      en: 'Fish & Seafood',
    },
    price: 22,
    costPrice: 13,
    calories: 380,
    weightGrams: 300,
    image: '/images/meals/fish-rice.webp',
    badge: {
      ru: 'High Protein',
      ka: 'მაღალი ცილა',
      en: 'High Protein',
    },
  },
  {
    id: 'prod-beef-bowl',
    name: {
      ru: 'Протеиновый боул с говядиной и авокадо',
      ka: 'პროტეინის ბოული საქონლის ხორცით და ავოკადოთი',
      en: 'Protein Beef Bowl with Avocado & Egg',
    },
    category: 'meat',
    categoryName: {
      ru: 'Мясные рационы',
      ka: 'ხორცის რაციონები',
      en: 'Meat Meals',
    },
    price: 19,
    costPrice: 11,
    calories: 510,
    weightGrams: 340,
    image: '/images/meals/beef-demiglace-puree.webp',
    badge: {
      ru: 'Набор массы',
      ka: 'მასის მომატება',
      en: 'Gain Meal',
    },
  },
  {
    id: 'prod-salmon-steamed',
    name: {
      ru: 'Атлантический лосось с запеченными овощами',
      ka: 'ატლანტიკური ორაგული გამომცხვარი ბოსტნეულით',
      en: 'Steamed Atlantic Salmon with Vegetables',
    },
    category: 'fish',
    categoryName: {
      ru: 'Рыба и Морепродукты',
      ka: 'თევზი და ზღვის პროდუქტები',
      en: 'Fish & Seafood',
    },
    price: 24,
    costPrice: 14.5,
    calories: 460,
    weightGrams: 310,
    image: '/images/meals/fish-cheese-risotto.webp',
  },
  {
    id: 'prod-syrniki-berry',
    name: {
      ru: 'Фермерские сырники с клубничным соусом',
      ka: 'ფერმერული სირნიკები მარწყვის სოუსით',
      en: 'Farm Cottage Cheese Syrniki with Berries',
    },
    category: 'breakfast',
    categoryName: {
      ru: 'Завтраки',
      ka: 'საუზმე',
      en: 'Breakfast',
    },
    price: 12,
    costPrice: 6.5,
    calories: 345,
    weightGrams: 260,
    image: '/images/meals/syrniki-strawberry.webp',
    badge: {
      ru: 'Без сахара',
      ka: 'უშაქრო',
      en: 'Zero Sugar',
    },
  },
  {
    id: 'prod-detox-smoothie',
    name: {
      ru: 'Зеленый Детокс Смузи (Шпинат, Киви, Мята)',
      ka: 'მწვანე დეტოქს სმუზი (ისპანახი, კივი, პიტნა)',
      en: 'Green Detox Smoothie (Spinach, Kiwi, Mint)',
    },
    category: 'drinks',
    categoryName: {
      ru: 'Напитки / Детокс',
      ka: 'სასმელები / დეტოქსი',
      en: 'Drinks & Detox',
    },
    price: 9,
    costPrice: 4.5,
    calories: 140,
    weightGrams: 400,
    image: '/images/meals/cream-cranberry.webp',
  },
  {
    id: 'prod-protein-pudding',
    name: {
      ru: 'Шоколадно-протеиновый мусс с чиа',
      ka: 'შოკოლადის პროტეინის მუსი ჩიათი',
      en: 'Chocolate Protein Mousse with Chia Seeds',
    },
    category: 'dessert',
    categoryName: {
      ru: 'Десерты FIT',
      ka: 'FIT დესერტები',
      en: 'Fit Desserts',
    },
    price: 10,
    costPrice: 5,
    calories: 210,
    weightGrams: 180,
    image: '/images/meals/mousse-granola.webp',
  },
];

// Initial Stock levels per point (clean / zeroed)
export const initialStocks: Record<string, Record<string, number>> = {
  'point-mega-gym': {},
  'point-xxl': {},
  'point-fitness-academy': {},
};

// Clean Shipments (No mock data)
export const initialShipments: PartnerShipment[] = [];

// Clean Sales History (No mock data)
export const initialSales: PartnerSale[] = [];

// Clean Write-Offs (No mock data)
export const initialWriteOffs: PartnerWriteOff[] = [];

