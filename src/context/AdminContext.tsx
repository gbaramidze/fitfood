'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  AdminDish, 
  AdminProgram, 
  AdminExpense, 
  AdminSalary, 
  AdminPointTransfer, 
  AdminCustomerSubscription,
  AdminIncomingOrder,
  AdminBlogPost,
  ExpenseCategory,
  EmployeeRole
} from '@/types/admin';
import { PartnerPoint, PartnerSale } from '@/types/partner';
import { 
  initialAdminPrograms, 
  initialAdminBlogPosts
} from '@/data/adminInitialData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { mapSupabaseProductToAdminDish } from '@/lib/adminDishMapper';

export type AdminTab = 
  | 'overview'    // მთავარი მიმოხილვა
  | 'orders'      // შემოსული განაცხადები
  | 'customers'   // კლიენტები & მიწოდება
  | 'sales'       // წერტილების გაყიდვები
  | 'programs'    // რაციონები & მოთხოვნა
  | 'dishes'      // კერძების ბაზა & დღეები
  | 'transfers'   // ლოჯისტიკა წერტილებზე
  | 'expenses'    // ხარჯები & ხელფასები
  | 'points';     // წერტილების პარამეტრები

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Data
  dishes: AdminDish[];
  isLoadingDishes: boolean;
  refreshDishes: () => Promise<void>;
  programs: AdminProgram[];
  customers: AdminCustomerSubscription[];
  incomingOrders: AdminIncomingOrder[];
  expenses: AdminExpense[];
  salaries: AdminSalary[];
  transfers: AdminPointTransfer[];
  points: PartnerPoint[];
  stocks: Record<string, Record<string, number>>;
  sales: PartnerSale[];
  blogPosts: AdminBlogPost[];

  // Financial calculations
  totalRevenue: number;
  siteRevenue: number;
  posRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  netProfit: number;

  // Dishes Actions
  addDish: (dish: Omit<AdminDish, 'id' | 'createdAt'>) => AdminDish;
  updateDish: (id: string, updates: Partial<AdminDish>) => boolean;
  deleteDish: (id: string) => boolean;

  // Programs Actions
  addProgram: (program: Omit<AdminProgram, 'id'>) => AdminProgram;
  updateProgram: (id: string, updates: Partial<AdminProgram>) => boolean;
  deleteProgram: (id: string) => boolean;
  toggleProgramActive: (id: string) => boolean;

  // Customers & Subscriptions Actions
  addCustomer: (customer: Omit<AdminCustomerSubscription, 'id' | 'createdAt'>) => AdminCustomerSubscription;
  updateCustomer: (id: string, updates: Partial<AdminCustomerSubscription>) => boolean;
  recordDayDelivery: (id: string) => boolean;
  deleteCustomer: (id: string) => boolean;

  // Incoming Orders Actions
  updateOrderStatus: (id: string, status: AdminIncomingOrder['status']) => boolean;
  convertOrderToSubscription: (orderId: string) => boolean;
  deleteIncomingOrder: (id: string) => boolean;

  // POS Logistics & Stock Actions
  createTransfer: (pointId: string, items: { productId: string; quantity: number }[], note?: string) => AdminPointTransfer;
  updatePointStock: (pointId: string, productId: string, qty: number) => void;
  updateProductPrices: (productId: string, retailPrice: number, costPrice?: number) => void;

  // Expenses & Salaries
  addExpense: (expense: Omit<AdminExpense, 'id' | 'createdAt'>) => AdminExpense;
  deleteExpense: (id: string) => boolean;
  addSalaryRecord: (salary: Omit<AdminSalary, 'id' | 'totalToPay'>) => AdminSalary;
  updateSalaryRecord: (id: string, updates: Partial<AdminSalary>) => boolean;
  markSalaryPaid: (id: string) => boolean;
  deleteSalaryRecord: (id: string) => boolean;

  // Points Actions
  addPoint: (point: Omit<PartnerPoint, 'id'>) => PartnerPoint;
  updatePoint: (id: string, updates: Partial<PartnerPoint>) => boolean;

  // Blog Actions
  addBlogPost: (post: Omit<AdminBlogPost, 'id' | 'viewsCount'>) => AdminBlogPost;
  updateBlogPost: (id: string, updates: Partial<AdminBlogPost>) => boolean;
  deleteBlogPost: (id: string) => boolean;
  togglePostPublished: (id: string) => boolean;

  // System
  resetAllToDefaults: () => void;
  exportDataJson: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: React.ReactNode;
  initialServerDishes?: AdminDish[];
  initialServerExpenses?: AdminExpense[];
  initialServerSalaries?: AdminSalary[];
  initialServerPoints?: PartnerPoint[];
  initialServerSales?: PartnerSale[];
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ 
  children,
  initialServerDishes = [],
  initialServerExpenses = [],
  initialServerSalaries = [],
  initialServerPoints = [],
  initialServerSales = [],
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dishes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [dishes, setDishes] = useState<AdminDish[]>(initialServerDishes);
  const [isLoadingDishes, setIsLoadingDishes] = useState<boolean>(false);

  const [programs, setPrograms] = useState<AdminProgram[]>(initialAdminPrograms);
  const [customers, setCustomers] = useState<AdminCustomerSubscription[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<AdminIncomingOrder[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>(initialServerExpenses);
  const [salaries, setSalaries] = useState<AdminSalary[]>(initialServerSalaries);
  const [transfers, setTransfers] = useState<AdminPointTransfer[]>([]);
  const [points, setPoints] = useState<PartnerPoint[]>(initialServerPoints);
  const [stocks, setStocks] = useState<Record<string, Record<string, number>>>({});
  const [sales, setSales] = useState<PartnerSale[]>(initialServerSales);
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>(initialAdminBlogPosts);

  // Sync server props when available
  useEffect(() => {
    if (initialServerDishes && initialServerDishes.length > 0) setDishes(initialServerDishes);
  }, [initialServerDishes]);

  useEffect(() => {
    if (initialServerExpenses && initialServerExpenses.length > 0) setExpenses(initialServerExpenses);
  }, [initialServerExpenses]);

  useEffect(() => {
    if (initialServerSalaries && initialServerSalaries.length > 0) setSalaries(initialServerSalaries);
  }, [initialServerSalaries]);

  useEffect(() => {
    if (initialServerPoints && initialServerPoints.length > 0) setPoints(initialServerPoints);
  }, [initialServerPoints]);

  useEffect(() => {
    if (initialServerSales && initialServerSales.length > 0) setSales(initialServerSales);
  }, [initialServerSales]);

  // Dedicated function to refresh dishes directly from Supabase
  const refreshDishes = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingDishes(true);
    try {
      const { data: dbProducts, error: prodErr } = await supabase
        .from('partner_products')
        .select('*');

      if (!prodErr && dbProducts && dbProducts.length > 0) {
        const mapped = dbProducts.map(mapSupabaseProductToAdminDish);
        setDishes(mapped);
      }
    } catch (e) {
      console.warn('Error refreshing dishes from Supabase:', e);
    } finally {
      setIsLoadingDishes(false);
    }
  };

  // Load from Supabase on mount + Real-time synchronization
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchSupabaseData = async () => {
      // 1. Fetch Dishes / Products from Supabase
      await refreshDishes();

      // 2. Fetch Expenses
      try {
        const { data: dbExp, error: expErr } = await supabase
          .from('admin_expenses')
          .select('*')
          .order('date', { ascending: false });
        if (!expErr && dbExp && dbExp.length > 0) {
          setExpenses(dbExp);
        }
      } catch (e) {
        console.warn('Supabase expenses fetch error:', e);
      }

      // 3. Fetch Salaries
      try {
        const { data: dbSal, error: salErr } = await supabase
          .from('admin_salaries')
          .select('*')
          .order('created_at', { ascending: false });
        if (!salErr && dbSal && dbSal.length > 0) {
          setSalaries(dbSal);
        }
      } catch (e) {
        console.warn('Supabase salaries fetch error:', e);
      }

      // 4. Fetch Points
      try {
        const { data: dbPts, error: ptsErr } = await supabase
          .from('partner_points')
          .select('*');
        if (!ptsErr && dbPts && dbPts.length > 0) {
          setPoints(dbPts);
        }
      } catch (e) {
        console.warn('Supabase points fetch error:', e);
      }

      // 5. Fetch Sales
      try {
        const { data: dbSales, error: salesErr } = await supabase
          .from('partner_sales')
          .select('*')
          .order('created_at', { ascending: false });
        if (!salesErr && dbSales && dbSales.length > 0) {
          setSales(dbSales);
        }
      } catch (e) {
        console.warn('Supabase sales fetch error:', e);
      }

      // 6. Fetch Stocks
      try {
        const { data: dbStocks, error: stocksErr } = await supabase
          .from('partner_stocks')
          .select('*');
        if (!stocksErr && dbStocks && dbStocks.length > 0) {
          const stocksMap: Record<string, Record<string, number>> = {};
          dbStocks.forEach((row: any) => {
            if (!stocksMap[row.point_id]) stocksMap[row.point_id] = {};
            stocksMap[row.point_id][row.product_id] = row.quantity;
          });
          setStocks(stocksMap);
        }
      } catch (e) {
        console.warn('Supabase stocks fetch error:', e);
      }
    };

    fetchSupabaseData();

    // Supabase Real-time listener for partner_products table
    try {
      const channel = supabase
        .channel('admin_products_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_products' }, async () => {
          await refreshDishes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }, []);

  // Real Financial Calculations
  const posRevenue = useMemo(() => {
    return sales
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales]);

  const siteRevenue = useMemo(() => {
    return customers
      .filter(c => c.paymentStatus === 'paid')
      .reduce((sum, c) => sum + c.totalAmount, 0);
  }, [customers]);

  const totalRevenue = posRevenue + siteRevenue;
  const totalExpenses = useMemo(() => expenses.reduce((a, b) => a + b.amount, 0), [expenses]);
  const totalPayroll = useMemo(() => salaries.reduce((a, b) => a + b.totalToPay, 0), [salaries]);
  const netProfit = totalRevenue - totalExpenses - totalPayroll;

  // Dishes Actions (Direct Supabase Upsert + Delete)
  const addDish = (dishData: Omit<AdminDish, 'id' | 'createdAt'>): AdminDish => {
    const newDish: AdminDish = {
      ...dishData,
      id: `dish-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    
    setDishes(prev => [newDish, ...prev]);

    if (isSupabaseConfigured) {
      const fullRow = {
        id: newDish.id,
        slug: newDish.slug,
        name: newDish.name,
        description: newDish.description,
        category: newDish.category,
        category_name: { ka: newDish.category, ru: newDish.category, en: newDish.category },
        meal_type: newDish.mealType,
        day: newDish.day,
        price: newDish.retailPrice,
        cost_price: newDish.costPrice,
        calories: newDish.macros.calories,
        protein: newDish.macros.protein,
        fat: newDish.macros.fat,
        carbs: newDish.macros.carbs,
        weight_grams: newDish.macros.weightGrams,
        image: newDish.image,
        ingredients: newDish.ingredients,
        allergens: newDish.allergens,
        cooking_method: newDish.cookingMethod,
        target_channels: newDish.targetChannels,
        created_at: newDish.createdAt,
        updated_at: new Date().toISOString(),
      };

      supabase.from('partner_products').upsert(fullRow).then(({ error }) => {
        if (error) {
          console.warn('Full Supabase product insert returned notice, trying basic row:', error.message);
          const basicRow = {
            id: newDish.id,
            name: newDish.name,
            category: newDish.category,
            category_name: { ka: newDish.category, ru: newDish.category, en: newDish.category },
            price: newDish.retailPrice,
            cost_price: newDish.costPrice,
            calories: newDish.macros.calories,
            weight_grams: newDish.macros.weightGrams,
            image: newDish.image,
            badge: { ka: newDish.day, ru: newDish.day, en: newDish.day },
          };
          supabase.from('partner_products').upsert(basicRow);
        }
      });
    }

    return newDish;
  };

  const updateDish = (id: string, updates: Partial<AdminDish>): boolean => {
    setDishes(prev => {
      const updated = prev.map(d => {
        if (d.id === id) {
          const merged = { ...d, ...updates };
          if (isSupabaseConfigured) {
            const fullRow = {
              id: merged.id,
              slug: merged.slug,
              name: merged.name,
              description: merged.description,
              category: merged.category,
              category_name: { ka: merged.category, ru: merged.category, en: merged.category },
              meal_type: merged.mealType,
              day: merged.day,
              price: merged.retailPrice,
              cost_price: merged.costPrice,
              calories: merged.macros.calories,
              protein: merged.macros.protein,
              fat: merged.macros.fat,
              carbs: merged.macros.carbs,
              weight_grams: merged.macros.weightGrams,
              image: merged.image,
              ingredients: merged.ingredients,
              allergens: merged.allergens,
              cooking_method: merged.cookingMethod,
              target_channels: merged.targetChannels,
              updated_at: new Date().toISOString(),
            };
            supabase.from('partner_products').upsert(fullRow).then(({ error }) => {
              if (error) {
                const basicRow = {
                  id: merged.id,
                  name: merged.name,
                  category: merged.category,
                  category_name: { ka: merged.category, ru: merged.category, en: merged.category },
                  price: merged.retailPrice,
                  cost_price: merged.costPrice,
                  calories: merged.macros.calories,
                  weight_grams: merged.macros.weightGrams,
                  image: merged.image,
                  badge: { ka: merged.day, ru: merged.day, en: merged.day },
                };
                supabase.from('partner_products').upsert(basicRow);
              }
            });
          }
          return merged;
        }
        return d;
      });
      return updated;
    });
    return true;
  };

  const deleteDish = (id: string): boolean => {
    setDishes(prev => prev.filter(d => d.id !== id));
    if (isSupabaseConfigured) {
      supabase.from('partner_products').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase product delete error:', error);
      });
    }
    return true;
  };

  // Programs Actions
  const addProgram = (progData: Omit<AdminProgram, 'id'>): AdminProgram => {
    const newProg: AdminProgram = {
      ...progData,
      id: `prog-${Date.now().toString(36)}`,
    };
    setPrograms(prev => [...prev, newProg]);
    return newProg;
  };

  const updateProgram = (id: string, updates: Partial<AdminProgram>): boolean => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return true;
  };

  const deleteProgram = (id: string): boolean => {
    setPrograms(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const toggleProgramActive = (id: string): boolean => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    return true;
  };

  // Customers & Subscriptions Actions
  const addCustomer = (custData: Omit<AdminCustomerSubscription, 'id' | 'createdAt'>): AdminCustomerSubscription => {
    const newCust: AdminCustomerSubscription = {
      ...custData,
      id: `sub-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<AdminCustomerSubscription>): boolean => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return true;
  };

  const recordDayDelivery = (id: string): boolean => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id && c.remainingDays > 0) {
        const nextDelivered = c.deliveredDays + 1;
        const nextRemaining = c.remainingDays - 1;
        const nextStatus = nextRemaining === 0 ? 'completed' : c.status;
        return {
          ...c,
          deliveredDays: nextDelivered,
          remainingDays: nextRemaining,
          status: nextStatus,
        };
      }
      return c;
    }));
    return true;
  };

  const deleteCustomer = (id: string): boolean => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // Incoming Orders Actions
  const updateOrderStatus = (id: string, status: AdminIncomingOrder['status']): boolean => {
    setIncomingOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    return true;
  };

  const convertOrderToSubscription = (orderId: string): boolean => {
    const order = incomingOrders.find(o => o.id === orderId);
    if (!order) return false;

    addCustomer({
      clientName: order.customerName,
      phone: order.phone,
      address: order.address,
      zone: order.zone || 'ბათუმი',
      programId: 'prog-slim',
      programTitle: order.programTitle,
      calories: 1500,
      totalDays: order.daysDuration || 30,
      deliveredDays: 0,
      remainingDays: order.daysDuration || 30,
      deliverySlot: order.deliverySlot.includes('საღამო') ? 'evening' : 'morning',
      startDate: new Date().toISOString().slice(0, 10),
      paymentStatus: 'paid',
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalPriceGEL,
      status: 'active',
      notes: order.notes,
    });

    updateOrderStatus(orderId, 'confirmed');
    return true;
  };

  const deleteIncomingOrder = (id: string): boolean => {
    setIncomingOrders(prev => prev.filter(o => o.id !== id));
    return true;
  };

  // Logistics & Transfers
  const createTransfer = (pointId: string, items: { productId: string; quantity: number }[], note?: string): AdminPointTransfer => {
    const targetPoint = points.find(p => p.id === pointId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const transferNumber = `TR-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const detailedItems = items.map(it => {
      const dish = dishes.find(d => d.id === it.productId);
      return {
        productId: it.productId,
        productName: dish ? dish.name.ka : it.productId,
        quantity: it.quantity,
        costPrice: dish ? dish.costPrice : 0,
        retailPrice: dish ? dish.retailPrice : 15,
      };
    });

    const totalUnits = detailedItems.reduce((a, b) => a + b.quantity, 0);
    const totalCost = detailedItems.reduce((a, b) => a + b.quantity * b.costPrice, 0);
    const totalRetail = detailedItems.reduce((a, b) => a + b.quantity * b.retailPrice, 0);

    const newTr: AdminPointTransfer = {
      id: `tr-${Date.now().toString(36)}`,
      transferNumber,
      pointId,
      pointName: targetPoint ? targetPoint.name.ka : 'წერტილი',
      items: detailedItems,
      totalUnits,
      totalCost,
      totalRetail,
      status: 'in_transit',
      dispatchedAt: new Date().toISOString(),
      driverName: 'კურიერი',
      note: note || '',
    };

    setTransfers(prev => [newTr, ...prev]);

    setStocks(prev => {
      const pointStock = { ...(prev[pointId] || {}) };
      items.forEach(it => {
        pointStock[it.productId] = (pointStock[it.productId] || 0) + it.quantity;
      });
      return { ...prev, [pointId]: pointStock };
    });

    // Save shipment in Supabase
    if (isSupabaseConfigured) {
      supabase.from('partner_shipments').upsert({
        id: newTr.id,
        shipment_number: newTr.transferNumber,
        point_id: newTr.pointId,
        items: newTr.items,
        total_units: newTr.totalUnits,
        status: 'pending',
        note: newTr.note,
        created_at: newTr.dispatchedAt,
      });
    }

    return newTr;
  };

  const updatePointStock = (pointId: string, productId: string, qty: number) => {
    const finalQty = Math.max(0, qty);
    setStocks(prev => ({
      ...prev,
      [pointId]: {
        ...(prev[pointId] || {}),
        [productId]: finalQty,
      },
    }));

    if (isSupabaseConfigured) {
      supabase.from('partner_stocks').upsert({
        point_id: pointId,
        product_id: productId,
        quantity: finalQty,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const updateProductPrices = (productId: string, retailPrice: number, costPrice?: number) => {
    setDishes(prev => prev.map(d => {
      if (d.id === productId) {
        const updated = {
          ...d,
          retailPrice,
          costPrice: costPrice !== undefined ? costPrice : d.costPrice,
        };
        if (isSupabaseConfigured) {
          supabase.from('partner_products').update({
            price: updated.retailPrice,
            cost_price: updated.costPrice,
            updated_at: new Date().toISOString(),
          }).eq('id', productId);
        }
        return updated;
      }
      return d;
    }));
  };

  // Expenses & Salaries
  const addExpense = (expenseData: Omit<AdminExpense, 'id' | 'createdAt'>): AdminExpense => {
    const newExp: AdminExpense = {
      ...expenseData,
      id: `exp-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExp, ...prev]);

    if (isSupabaseConfigured) {
      supabase.from('admin_expenses').upsert({
        id: newExp.id,
        category: newExp.category,
        title: newExp.title,
        amount: newExp.amount,
        date: newExp.date,
        point_id: newExp.pointId,
        payment_method: newExp.paymentMethod,
        receipt_number: newExp.receiptNumber,
        notes: newExp.notes,
        created_at: newExp.createdAt,
      });
    }

    return newExp;
  };

  const deleteExpense = (id: string): boolean => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (isSupabaseConfigured) {
      supabase.from('admin_expenses').delete().eq('id', id);
    }
    return true;
  };

  const addSalaryRecord = (salData: Omit<AdminSalary, 'id' | 'totalToPay'>): AdminSalary => {
    const totalToPay = (salData.monthlySalary || 0) + (salData.bonus || 0) - (salData.deductions || 0);
    const newSal: AdminSalary = {
      ...salData,
      id: `sal-${Date.now().toString(36)}`,
      totalToPay: Math.max(0, totalToPay),
    };
    setSalaries(prev => [...prev, newSal]);

    if (isSupabaseConfigured) {
      supabase.from('admin_salaries').upsert({
        id: newSal.id,
        employee_name: newSal.employeeName,
        role: newSal.role,
        monthly_salary: newSal.monthlySalary,
        bonus: newSal.bonus,
        deductions: newSal.deductions,
        total_to_pay: newSal.totalToPay,
        payment_status: newSal.paymentStatus,
        last_paid_date: newSal.lastPaidDate,
        notes: newSal.notes,
        created_at: new Date().toISOString(),
      });
    }

    return newSal;
  };

  const updateSalaryRecord = (id: string, updates: Partial<AdminSalary>): boolean => {
    setSalaries(prev => prev.map(s => {
      if (s.id === id) {
        const merged = { ...s, ...updates };
        const totalToPay = (merged.monthlySalary || 0) + (merged.bonus || 0) - (merged.deductions || 0);
        const finalSal = { ...merged, totalToPay: Math.max(0, totalToPay) };

        if (isSupabaseConfigured) {
          supabase.from('admin_salaries').update({
            employee_name: finalSal.employeeName,
            role: finalSal.role,
            monthly_salary: finalSal.monthlySalary,
            bonus: finalSal.bonus,
            deductions: finalSal.deductions,
            total_to_pay: finalSal.totalToPay,
            payment_status: finalSal.paymentStatus,
            last_paid_date: finalSal.lastPaidDate,
            notes: finalSal.notes,
          }).eq('id', id);
        }

        return finalSal;
      }
      return s;
    }));
    return true;
  };

  const markSalaryPaid = (id: string): boolean => {
    const dateStr = new Date().toISOString().slice(0, 10);
    setSalaries(prev => prev.map(s => s.id === id ? { ...s, paymentStatus: 'paid', lastPaidDate: dateStr } : s));
    if (isSupabaseConfigured) {
      supabase.from('admin_salaries').update({
        payment_status: 'paid',
        last_paid_date: dateStr,
      }).eq('id', id);
    }
    return true;
  };

  const deleteSalaryRecord = (id: string): boolean => {
    setSalaries(prev => prev.filter(s => s.id !== id));
    if (isSupabaseConfigured) {
      supabase.from('admin_salaries').delete().eq('id', id);
    }
    return true;
  };

  // Points
  const addPoint = (pointData: Omit<PartnerPoint, 'id'>): PartnerPoint => {
    const newPt: PartnerPoint = { ...pointData, id: `point-${Date.now().toString(36)}` };
    setPoints(prev => [...prev, newPt]);

    if (isSupabaseConfigured) {
      supabase.from('partner_points').upsert({
        id: newPt.id,
        name: newPt.name,
        city: newPt.city,
        address: newPt.address,
        cashier_pin: newPt.cashierPin,
        manager_pin: newPt.managerPin,
        commission_percent: newPt.commissionPercent || 0,
        phone: newPt.phone,
        status: newPt.status,
      });
    }

    return newPt;
  };

  const updatePoint = (id: string, updates: Partial<PartnerPoint>): boolean => {
    setPoints(prev => prev.map(p => {
      if (p.id === id) {
        const merged = { ...p, ...updates };
        if (isSupabaseConfigured) {
          supabase.from('partner_points').update({
            name: merged.name,
            city: merged.city,
            address: merged.address,
            cashier_pin: merged.cashierPin,
            manager_pin: merged.managerPin,
            commission_percent: merged.commissionPercent || 0,
            phone: merged.phone,
            status: merged.status,
          }).eq('id', id);
        }
        return merged;
      }
      return p;
    }));
    return true;
  };

  // Blog CMS
  const addBlogPost = (postData: Omit<AdminBlogPost, 'id' | 'viewsCount'>): AdminBlogPost => {
    const newPost: AdminBlogPost = { ...postData, id: `blog-${Date.now().toString(36)}`, viewsCount: 0 };
    setBlogPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  const updateBlogPost = (id: string, updates: Partial<AdminBlogPost>): boolean => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return true;
  };

  const deleteBlogPost = (id: string): boolean => {
    setBlogPosts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const togglePostPublished = (id: string): boolean => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, published: !p.published } : p));
    return true;
  };

  const resetAllToDefaults = () => {
    if (confirm('გასუფთავდეს ყველა ლოკალური მონაცემი?')) {
      setCustomers([]);
      setIncomingOrders([]);
      setExpenses([]);
      setSalaries([]);
      setTransfers([]);
      alert('მონაცემები განახლდა.');
    }
  };

  const exportDataJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      dishes,
      programs,
      customers,
      incomingOrders,
      expenses,
      salaries,
      transfers,
      points,
      stocks,
      sales,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `FitFood_Live_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        dishes,
        isLoadingDishes,
        refreshDishes,
        programs,
        customers,
        incomingOrders,
        expenses,
        salaries,
        transfers,
        points,
        stocks,
        sales,
        blogPosts,
        totalRevenue,
        siteRevenue,
        posRevenue,
        totalExpenses,
        totalPayroll,
        netProfit,
        addDish,
        updateDish,
        deleteDish,
        addProgram,
        updateProgram,
        deleteProgram,
        toggleProgramActive,
        addCustomer,
        updateCustomer,
        recordDayDelivery,
        deleteCustomer,
        updateOrderStatus,
        convertOrderToSubscription,
        deleteIncomingOrder,
        createTransfer,
        updatePointStock,
        updateProductPrices,
        addExpense,
        deleteExpense,
        addSalaryRecord,
        updateSalaryRecord,
        markSalaryPaid,
        deleteSalaryRecord,
        addPoint,
        updatePoint,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        togglePostPublished,
        resetAllToDefaults,
        exportDataJson,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
