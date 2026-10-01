import { 
  AdminDish, 
  AdminProgram, 
  AdminExpense, 
  AdminSalary, 
  AdminPointTransfer,
  AdminCustomerSubscription,
  AdminIncomingOrder,
  AdminBlogPost
} from '@/types/admin';
import { dishes } from './dishes';
import { programs } from './programs';
import { partnerProducts } from './partnerData';

// NO MOCK DISHES (Empty by default, loaded from Supabase or added by admin)
export const initialAdminDishes: AdminDish[] = [];

// Real diets / programs defined on fitnessfood.ge
export const initialAdminPrograms: AdminProgram[] = programs.map((prog) => ({
  id: prog.id,
  slug: prog.slug,
  badge: prog.badge,
  title: prog.title,
  description: prog.description,
  target: prog.target,
  calorieRange: prog.calorieRange,
  targetCalories: prog.slug === 'slim' ? 1200 : prog.slug === 'balance' ? 1800 : prog.slug === 'power' ? 2500 : 1100,
  mealsPerDay: prog.mealsPerDay,
  prices: {
    trialTwoDays: prog.prices.trialTwoDays,
    sixDays: prog.prices.sixDays,
    twelveDays: prog.prices.twelveDays,
    twentyFourDays: prog.prices.twentyFourDays,
    thirtyDays: prog.prices.thirtyDays,
  },
  costPerDay: 0,
  active: true,
  accentColor: '#10B981',
  features: prog.features,
  activeSubscribersCount: 0,
  ordersSharePercent: 0,
  demandLevel: 'moderate',
}));

// NO MOCK CUSTOMERS (Empty by default, populated when real orders arrive or admin adds them)
export const initialAdminCustomers: AdminCustomerSubscription[] = [];

// NO MOCK INCOMING ORDERS (Empty by default, populated in real-time from website checkout)
export const initialAdminIncomingOrders: AdminIncomingOrder[] = [];

// NO MOCK EXPENSES (Empty by default, entered by executive)
export const initialAdminExpenses: AdminExpense[] = [];

// NO MOCK SALARIES (Empty by default, entered by executive)
export const initialAdminSalaries: AdminSalary[] = [];

// NO MOCK TRANSFERS (Empty by default)
export const initialAdminTransfers: AdminPointTransfer[] = [];

// NO MOCK BLOG POSTS
export const initialAdminBlogPosts: AdminBlogPost[] = [];
