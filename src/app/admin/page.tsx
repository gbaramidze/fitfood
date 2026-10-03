import React from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { AdminClientLayout } from './AdminClientLayout';
import { AdminDish, AdminExpense, AdminSalary } from '@/types/admin';
import { PartnerPoint, PartnerSale } from '@/types/partner';

import { mapSupabaseProductToAdminDish } from '@/lib/adminDishMapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  let initialDishes: AdminDish[] = [];
  let initialExpenses: AdminExpense[] = [];
  let initialSalaries: AdminSalary[] = [];
  let initialPoints: PartnerPoint[] = [];
  let initialSales: PartnerSale[] = [];

  if (isSupabaseConfigured) {
    try {
      // 1. SSR Fetch Dishes / Products (Metadata only)
      const { data: dbProducts } = await supabase
        .from('partner_products')
        .select('id, name, category, category_name, price, cost_price, calories, weight_grams, image, badge, created_at, slug, description, meal_type, day, protein, fat, carbs, ingredients, allergens, cooking_method, target_channels, updated_at');

      if (dbProducts && dbProducts.length > 0) {
        initialDishes = dbProducts.map(mapSupabaseProductToAdminDish);
      }

      // 2. SSR Fetch Expenses
      const { data: dbExp } = await supabase
        .from('admin_expenses')
        .select('*')
        .order('date', { ascending: false });
      if (dbExp && dbExp.length > 0) initialExpenses = dbExp;

      // 3. SSR Fetch Salaries
      const { data: dbSal } = await supabase
        .from('admin_salaries')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbSal && dbSal.length > 0) initialSalaries = dbSal;

      // 4. SSR Fetch Points
      const { data: dbPts } = await supabase
        .from('partner_points')
        .select('*');
      if (dbPts && dbPts.length > 0) initialPoints = dbPts;

      // 5. SSR Fetch Sales
      const { data: dbSales } = await supabase
        .from('partner_sales')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbSales && dbSales.length > 0) initialSales = dbSales;
    } catch (e) {
      console.warn('SSR Supabase fetch warning:', e);
    }
  }

  return (
    <AdminClientLayout
      initialDishes={initialDishes}
      initialExpenses={initialExpenses}
      initialSalaries={initialSalaries}
      initialPoints={initialPoints}
      initialSales={initialSales}
    />
  );
}
