export type Locale = 'ka' | 'ru' | 'en';

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'dessert' | 'smoothie';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface MacroNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  weightGrams: number;
}

export interface DishReview {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: {
    ka: string;
    ru: string;
    en: string;
  };
  verifiedBuyer: boolean;
}

export interface Dish {
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
  mealType: MealType;
  day: DayOfWeek;
  macros: MacroNutrients;
  image: string;
  boxImage?: string;
  tags: string[];
  allergens: string[];
  isGeorgianFit: boolean;
  cookingMethod?: 'sous_vide' | 'baked' | 'steamed' | 'grilled' | 'raw';
  ingredients: {
    ka: string[];
    ru: string[];
    en: string[];
  };
  reviews: DishReview[];
  rating: number;
  swappableWith?: string[]; // IDs of dishes that can replace this one
}

export interface Program {
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
  mealsPerDay: number;
  prices: {
    trialTwoDays: number;
    sixDays: number;
    twelveDays: number;
    twentyFourDays: number;
    thirtyDays: number;
    // Legacy compatibility fields
    oneDay?: number;
    fiveDaysTourist?: number;
    sevenDaysWeek?: number;
    twentyEightDaysMonth?: number;
  };
  popular?: boolean;
  features: {
    ka: string[];
    ru: string[];
    en: string[];
  };
  accentColor: string;
  iconName?: string;
}

export interface BatumiZone {
  id: string;
  name: {
    ka: string;
    ru: string;
    en: string;
  };
  priceGEL: number;
  deliveryTimeNotice: {
    ka: string;
    ru: string;
    en: string;
  };
  popularHotels: string[];
}

export type CardDesignTheme = 'obsidian-gold' | 'holo-aurora' | 'emerald-cyber' | 'titanium-silver';

export type CertificateDeliveryType = 'digital' | 'luxury-box';

export interface GiftCertificate {
  id: string;
  recipientName: string;
  senderName: string;
  message: string;
  calorieTier: string; // '1000' | '1500' | '2000' | '2500' | 'custom'
  durationDays: number; // 2 | 6 | 12 | 24 | 30
  cardDesign: CardDesignTheme;
  deliveryFormat: CertificateDeliveryType;
  priceGEL: number;
  cardCode: string;
}

export interface CartItem {
  id?: string;
  type?: 'subscription' | 'certificate';
  programId?: string;
  programTitle?: string;
  daysDuration?: number;
  dailyCalories?: number;
  dailyPrice?: number;
  totalPriceGEL: number;
  deliverySlot?: 'morning' | 'comfort' | 'evening';
  deliveryZoneId?: string;
  startDate?: string;
  allergiesStopList?: string[];
  customSwaps?: Record<string, string>; // dishId -> replacementDishId
  certificateDetails?: GiftCertificate;
}

export interface OrderConfirmation {
  orderId: string;
  createdAt: string;
  status: 'preparing' | 'on_way' | 'delivered';
  customerName: string;
  phone: string;
  address: string;
  zone: string;
  deliveryDate: string;
  deliverySlot: string;
  paymentMethod: 'tbc' | 'bog_apple_pay' | 'cash';
  totalPriceGEL: number;
  cartItem: CartItem;
}

export interface QuizState {
  step: number;
  goal: 'weight_loss' | 'balance' | 'muscle_gain' | 'tourist_detox';
  gender: 'female' | 'male';
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'moderate' | 'high' | 'pro_athlete';
  allergies: string[];
  dietaryPreference: 'standard' | 'no_pork' | 'no_fish' | 'vegetarian';
  format: 'week' | 'tourist_pass' | 'trial_day';
}

export interface UserSubscription {
  isActive: boolean;
  programTitle: string;
  calories: number;
  totalDays: number;
  remainingDays: number;
  startDate: string;
  endDate: string;
  frozenDates: string[]; // dates format YYYY-MM-DD
  todayStatus: 'delivered' | 'cooking' | 'on_the_way' | 'paused';
  address: string;
  zoneName: string;
  referralCode: string;
  bonusPointsGEL: number;
}
