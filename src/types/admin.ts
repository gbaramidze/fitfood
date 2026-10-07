import { MealType, DayOfWeek } from './index';

export type DishCategory = 'poultry' | 'fish' | 'meat' | 'breakfast' | 'dessert' | 'drinks' | 'soup' | 'salad';

export interface AdminDish {
  id: string;
  slug: string;
  name: {
    ka: string;
    ru: string;
    en: string;
  };
  description: {
    ka: string;
    ru: string;
    en: string;
  };
  category: DishCategory;
  mealType: MealType;
  day?: DayOfWeek; // კვირის დღე (ორშ, სამშ, ოთხშ, ხუთშ, პარ, შაბ, კვირ)
  macros: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    weightGrams: number;
  };
  costPrice: number;    // თვითღირებულება (Food Cost) GEL
  retailPrice: number;  // გასაყიდი ფასი GEL
  targetChannels: ('site' | 'pos')[]; // სად იყიდება (საიტის რაციონები / დარბაზის ვიტრინა)
  image: string;
  tags: string[];
  allergens: string[];
  cookingMethod: 'sous_vide' | 'baked' | 'steamed' | 'grilled' | 'raw';
  ingredients: {
    ka: string[];
    ru: string[];
    en: string[];
  };
  isGeorgianFit: boolean;
  inStockCount?: number;
  sortOrder?: number;
  createdAt: string;
}

export interface AdminProgram {
  id: string;
  slug: string;
  badge?: {
    ka: string;
    ru: string;
    en: string;
  };
  title: {
    ka: string;
    ru: string;
    en: string;
  };
  description: {
    ka: string;
    ru: string;
    en: string;
  };
  target: {
    ka: string;
    ru: string;
    en: string;
  };
  calorieRange: string;
  targetCalories: number;
  mealsPerDay: number;
  prices: {
    trialTwoDays: number;
    sixDays: number;
    twelveDays: number;
    twentyFourDays: number;
    thirtyDays: number;
  };
  costPerDay: number; // დღიური თვითღირებულება (GEL)
  active: boolean;
  accentColor: string;
  features: {
    ka: string[];
    ru: string[];
    en: string[];
  };
  // მოთხოვნის ანალიტიკა
  activeSubscribersCount?: number;
  ordersSharePercent?: number;
  demandLevel?: 'high' | 'medium' | 'moderate';
}

export interface AdminCustomerSubscription {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  zone: string;
  programId: string;
  programTitle: string;
  calories: number;
  totalDays: number;       // სულ შეძენილი დღეები
  deliveredDays: number;   // უკვე მიწოდებული დღეები
  remainingDays: number;   // დარჩენილი დღეები
  deliverySlot: 'morning' | 'comfort' | 'evening';
  startDate: string;
  paymentStatus: 'paid' | 'pending';
  paymentMethod: string;
  totalAmount: number;     // გადახდილი თანხა (GEL)
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface AdminIncomingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  programTitle: string;
  daysDuration: number;
  totalPriceGEL: number;
  address: string;
  zone: string;
  deliverySlot: string;
  paymentMethod: string;
  status: 'new' | 'confirmed' | 'in_delivery' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'rent' 
  | 'utilities' 
  | 'packaging' 
  | 'marketing' 
  | 'logistics' 
  | 'ingredients' 
  | 'equipment' 
  | 'taxes' 
  | 'other';

export interface AdminExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number; // GEL
  date: string;   // YYYY-MM-DD
  pointId: string;
  paymentMethod: 'bank' | 'cash' | 'card';
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export type EmployeeRole = 
  | 'executive' 
  | 'chef' 
  | 'sous_chef' 
  | 'cook' 
  | 'packer' 
  | 'courier' 
  | 'manager' 
  | 'nutritionist';

export interface AdminSalary {
  id: string;
  employeeName: string;
  role: EmployeeRole;
  phone: string;
  monthlySalary: number;  // ხელფასი GEL
  shiftsCount?: number;   // ცვლა
  bonus: number;          // ბონუსი GEL
  deductions: number;     // დაკავება GEL
  totalToPay: number;     // გასაცემი თანხა
  paymentStatus: 'paid' | 'pending';
  lastPaidDate?: string;
  notes?: string;
}

export interface AdminPointTransfer {
  id: string;
  transferNumber: string;
  pointId: string;
  pointName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    retailPrice: number;
  }[];
  totalUnits: number;
  totalCost: number;
  totalRetail: number;
  status: 'in_transit' | 'received';
  dispatchedAt: string;
  receivedAt?: string;
  driverName?: string;
  note?: string;
}

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: {
    ka: string;
    ru: string;
    en: string;
  };
  excerpt: {
    ka: string;
    ru: string;
    en: string;
  };
  content: {
    ka: string;
    ru: string;
    en: string;
  };
  category: 'nutrition' | 'fitness' | 'recipes' | 'company' | 'lifestyle';
  coverImage: string;
  readTimeMin: number;
  author: string;
  published: boolean;
  publishedAt: string;
  viewsCount: number;
  seoTitle?: {
    ka: string;
    ru: string;
    en: string;
  };
  seoDescription?: {
    ka: string;
    ru: string;
    en: string;
  };
}
