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
import { PartnerPoint, PartnerSale, PartnerWriteOff } from '@/types/partner';
import { 
  initialAdminPrograms, 
  initialAdminBlogPosts
} from '@/data/adminInitialData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { mapSupabaseProductToAdminDish } from '@/lib/adminDishMapper';
import { partnerDbService } from '@/services/partnerDbService';

export type AdminTab = 
  | 'overview'    // მთავარი მიმოხილვა
  | 'orders'      // შემოსული განაცხადები
  | 'customers'   // კლიენტები & მიწოდება
  | 'sales'       // წერტილების გაყიდვები
  | 'programs'    // რაციონები & მოთხოვნა
  | 'dishes'      // კერძების ბაზა & დღეები
  | 'transfers'   // ლოჯისტიკა წერტილებზე
  | 'writeoffs'   // საქონლის ჩამოწერა (სписание товаров)
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
  writeOffs: PartnerWriteOff[];
  blogPosts: AdminBlogPost[];

  // Financial calculations
  totalRevenue: number;
  siteRevenue: number;
  posRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  netProfit: number;

  // Dishes Actions
  addDish: (dish: Omit<AdminDish, 'id' | 'createdAt'>) => Promise<AdminDish>;
  updateDish: (id: string, updates: Partial<AdminDish>) => Promise<boolean>;
  deleteDish: (id: string) => Promise<boolean>;
  setDishesOrder: (orderedDishes: AdminDish[]) => Promise<boolean>;

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
  createTransfer: (pointId: string, items: { productId: string; quantity: number }[], note?: string) => Promise<AdminPointTransfer>;
  updatePointStock: (pointId: string, productId: string, qty: number) => Promise<void>;
  updateProductPrices: (productId: string, retailPrice: number, costPrice?: number) => void;

  // Write-offs (Списания и порча товаров)
  createWriteOff: (pointId: string, productId: string, quantity: number, reason?: string, reasonText?: string, notes?: string) => Promise<PartnerWriteOff>;
  deleteWriteOff: (id: string, restoreStock?: boolean) => Promise<boolean>;

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
  const [writeOffs, setWriteOffs] = useState<PartnerWriteOff[]>([]);
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
        .select('id, name, category, category_name, price, cost_price, calories, weight_grams, image, badge, created_at, slug, description, meal_type, day, protein, fat, carbs, ingredients, allergens, cooking_method, target_channels, updated_at');

      if (!prodErr && dbProducts && dbProducts.length > 0) {
        let mapped = dbProducts.map(mapSupabaseProductToAdminDish);

        // Sort by custom saved order or sortOrder
        if (typeof window !== 'undefined') {
          try {
            const savedOrderStr = localStorage.getItem('fitfood_admin_dishes_order');
            if (savedOrderStr) {
              const savedIds: string[] = JSON.parse(savedOrderStr);
              if (Array.isArray(savedIds) && savedIds.length > 0) {
                mapped.sort((a, b) => {
                  const idxA = savedIds.indexOf(a.id);
                  const idxB = savedIds.indexOf(b.id);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return 0;
                });
              }
            } else {
              mapped.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
            }
          } catch {
            mapped.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
          }
        } else {
          mapped.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
        }

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
        const pts = await partnerDbService.getPoints();
        if (pts && pts.length > 0) {
          setPoints(pts);
        }
      } catch (e) {
        console.warn('Supabase points fetch error:', e);
      }

      // 5. Fetch Sales
      try {
        const dbSales = await partnerDbService.getSales();
        if (dbSales && dbSales.length > 0) {
          setSales(dbSales);
        }
      } catch (e) {
        console.warn('Supabase sales fetch error:', e);
      }

      // 6. Fetch Stocks
      try {
        const stocksMap = await partnerDbService.getStocks();
        if (stocksMap) {
          setStocks(stocksMap);
        }
      } catch (e) {
        console.warn('Supabase stocks fetch error:', e);
      }

      // 7. Fetch Shipments / Transfers
      try {
        const { data: dbShipments, error: shipErr } = await supabase
          .from('partner_shipments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!shipErr && dbShipments && dbShipments.length > 0) {
          const mappedTransfers: AdminPointTransfer[] = dbShipments.map((s: any) => {
            const pt = points.find(p => p.id === s.point_id);
            const items = Array.isArray(s.items) ? s.items : [];
            const totalCost = items.reduce((sum: number, it: any) => sum + ((it.costPrice || 0) * (it.quantity || 0)), 0);
            const totalRetail = items.reduce((sum: number, it: any) => sum + ((it.retailPrice || 0) * (it.quantity || 0)), 0);
            return {
              id: s.id,
              transferNumber: s.shipment_number || s.id,
              pointId: s.point_id,
              pointName: pt ? (typeof pt.name === 'object' ? pt.name.ka : pt.name) : s.point_id,
              items: items,
              totalUnits: s.total_units || items.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0),
              totalCost,
              totalRetail,
              status: s.status === 'delivered' || s.status === 'received' ? 'received' : 'in_transit',
              dispatchedAt: s.created_at,
              driverName: 'კურიერი',
              note: s.note || '',
            };
          });
          setTransfers(mappedTransfers);
        }
      } catch (e) {
        console.warn('Supabase shipments fetch error:', e);
      }

      // 8. Fetch Write-offs
      try {
        const dbWriteOffs = await partnerDbService.getWriteOffs();
        if (dbWriteOffs) setWriteOffs(dbWriteOffs);
      } catch (e) {
        console.warn('Supabase writeoffs fetch error:', e);
      }
    };

    fetchSupabaseData();

    // Supabase Real-time listeners for products, sales and stocks
    try {
      const prodChannel = supabase
        .channel('admin_products_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_products' }, async () => {
          await refreshDishes();
        })
        .subscribe();

      const salesChannel = supabase
        .channel('admin_sales_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_sales' }, async () => {
          const freshSales = await partnerDbService.getSales();
          if (freshSales) setSales(freshSales);
        })
        .subscribe();

      const stocksChannel = supabase
        .channel('admin_stocks_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_stocks' }, async () => {
          const freshStocks = await partnerDbService.getStocks();
          if (freshStocks) setStocks(freshStocks);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(prodChannel);
        supabase.removeChannel(salesChannel);
        supabase.removeChannel(stocksChannel);
      };
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }, []);

  // Real Financial Calculations (With Safe Number Fallbacks to prevent NaN)
  const posRevenue = useMemo(() => {
    return sales
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [sales]);

  const siteRevenue = useMemo(() => {
    return customers
      .filter(c => c.paymentStatus === 'paid')
      .reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
  }, [customers]);

  const totalRevenue = (Number(posRevenue) || 0) + (Number(siteRevenue) || 0);
  const totalExpenses = useMemo(() => expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0), [expenses]);
  const totalPayroll = useMemo(() => salaries.reduce((a, b) => a + (Number(b.totalToPay) || 0), 0), [salaries]);
  const netProfit = totalRevenue - totalExpenses - totalPayroll;

  // Dishes Actions (Direct Supabase Upsert + Delete)
  const addDish = async (dishData: Omit<AdminDish, 'id' | 'createdAt'>): Promise<AdminDish> => {
    const newDish: AdminDish = {
      ...dishData,
      id: `dish-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    
    setDishes(prev => [newDish, ...prev]);

    if (newDish.image) {
      const { productImageService } = await import('@/services/productImageService');
      productImageService.setCachedImage(newDish.id, newDish.image);
    }

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

      try {
        const { error } = await supabase.from('partner_products').upsert(fullRow);
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
          await supabase.from('partner_products').upsert(basicRow);
        }
      } catch (err) {
        console.error('Failed to add dish to Supabase:', err);
      }
    }

    return newDish;
  };

  const updateDish = async (id: string, updates: Partial<AdminDish>): Promise<boolean> => {
    let mergedDish: AdminDish | null = null;
    setDishes(prev => {
      const updated = prev.map(d => {
        if (d.id === id) {
          mergedDish = { ...d, ...updates };
          return mergedDish;
        }
        return d;
      });
      return updated;
    });

    if (updates.image) {
      const { productImageService } = await import('@/services/productImageService');
      productImageService.setCachedImage(id, updates.image);
    }

    if (isSupabaseConfigured && mergedDish) {
      const d: AdminDish = mergedDish;
      const fullRow = {
        id: d.id,
        slug: d.slug,
        name: d.name,
        description: d.description,
        category: d.category,
        category_name: { ka: d.category, ru: d.category, en: d.category },
        meal_type: d.mealType,
        day: d.day,
        price: d.retailPrice,
        cost_price: d.costPrice,
        calories: d.macros.calories,
        protein: d.macros.protein,
        fat: d.macros.fat,
        carbs: d.macros.carbs,
        weight_grams: d.macros.weightGrams,
        image: d.image,
        ingredients: d.ingredients,
        allergens: d.allergens,
        cooking_method: d.cookingMethod,
        target_channels: d.targetChannels,
        updated_at: new Date().toISOString(),
      };

      try {
        const { error } = await supabase.from('partner_products').upsert(fullRow);
        if (error) {
          const basicRow = {
            id: d.id,
            name: d.name,
            category: d.category,
            category_name: { ka: d.category, ru: d.category, en: d.category },
            price: d.retailPrice,
            cost_price: d.costPrice,
            calories: d.macros.calories,
            weight_grams: d.macros.weightGrams,
            image: d.image,
            badge: { ka: d.day, ru: d.day, en: d.day },
          };
          await supabase.from('partner_products').upsert(basicRow);
        }
      } catch (err) {
        console.error('Failed to update dish in Supabase:', err);
      }
    }
    return true;
  };

  const deleteDish = async (id: string): Promise<boolean> => {
    setDishes(prev => prev.filter(d => d.id !== id));
    try {
      const { productImageService } = await import('@/services/productImageService');
      productImageService.invalidateImage(id);
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('partner_products').delete().eq('id', id);
        if (error) console.error('Supabase product delete error:', error);
      } catch (err) {
        console.error('Failed to delete dish from Supabase:', err);
      }
    }
    return true;
  };

  const setDishesOrder = async (orderedDishes: AdminDish[]): Promise<boolean> => {
    setDishes(orderedDishes);

    if (typeof window !== 'undefined') {
      try {
        const idList = orderedDishes.map(d => d.id);
        localStorage.setItem('fitfood_admin_dishes_order', JSON.stringify(idList));
      } catch {}
    }

    if (isSupabaseConfigured) {
      try {
        const promises = orderedDishes.map((dish, index) =>
          supabase
            .from('partner_products')
            .update({ sort_order: index, updated_at: new Date().toISOString() })
            .eq('id', dish.id)
        );
        const results = await Promise.allSettled(promises);
        results.forEach((res) => {
          if (res.status === 'fulfilled' && (res.value as any)?.error) {
            const err = (res.value as any).error;
            if (err.code === 'PGRST204') {
              console.info('Supabase: sort_order სვეტი ჯერ არ არსებობს partner_products ცხრილში. თანმიმდევრობა შენახულია ლოკალურად.');
            }
          }
        });
      } catch (err) {
        console.warn('Could not update sort_order in Supabase:', err);
      }
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
  const createTransfer = async (pointId: string, items: { productId: string; quantity: number }[], note?: string): Promise<AdminPointTransfer> => {
    const targetPoint = points.find(p => p.id === pointId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const transferNumber = `TR-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const detailedItems = items.map(it => {
      const dish = dishes.find(d => d.id === it.productId);
      return {
        productId: it.productId,
        productName: dish ? (typeof dish.name === 'object' ? dish.name.ka : dish.name) : it.productId,
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
      pointName: targetPoint ? (typeof targetPoint.name === 'object' ? targetPoint.name.ka : targetPoint.name) : 'წერტილი',
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

    const nextPointStocks: Record<string, number> = { ...(stocks[pointId] || {}) };
    items.forEach(it => {
      nextPointStocks[it.productId] = (nextPointStocks[it.productId] || 0) + it.quantity;
    });

    setStocks(prev => ({
      ...prev,
      [pointId]: nextPointStocks,
    }));

    // Save shipment and update point stocks in Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('partner_shipments').upsert({
          id: newTr.id,
          shipment_number: newTr.transferNumber,
          point_id: newTr.pointId,
          items: newTr.items,
          total_units: newTr.totalUnits,
          status: 'pending',
          note: newTr.note,
          created_at: newTr.dispatchedAt,
        });

        for (const it of items) {
          const qty = nextPointStocks[it.productId] || it.quantity;
          await supabase.from('partner_stocks').upsert({
            point_id: pointId,
            product_id: it.productId,
            quantity: qty,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Supabase transfer save error:', err);
      }
    }

    return newTr;
  };

  const updatePointStock = async (pointId: string, productId: string, qty: number): Promise<void> => {
    const finalQty = Math.max(0, qty);
    setStocks(prev => ({
      ...prev,
      [pointId]: {
        ...(prev[pointId] || {}),
        [productId]: finalQty,
      },
    }));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('partner_stocks').upsert({
          point_id: pointId,
          product_id: productId,
          quantity: finalQty,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Supabase stock update error:', err);
      }
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

  // Write-offs (Списание испорченных / поврежденных товаров)
  const createWriteOff = async (
    pointId: string,
    productId: string,
    quantity: number,
    reason: string = 'expired',
    reasonText?: string,
    notes?: string
  ): Promise<PartnerWriteOff> => {
    const dish = dishes.find(d => d.id === productId);
    const prodName = dish ? (typeof dish.name === 'object' ? (dish.name.ka || dish.name.ru || dish.name.en) : dish.name) : productId;
    const costPrice = dish ? dish.costPrice : 0;
    const retailPrice = dish ? dish.retailPrice : 15;

    const finalReasonText = reasonText || (
      reason === 'expired' ? 'ვადაგასული / გაფუჭდა (Истёк срок / испортился)' :
      reason === 'damaged' ? 'დაზიანებული / ბრაკი (Поврежден / брак)' :
      reason === 'sample' ? 'დეგუსტაცია / პრორაბოტკა (Дегустация)' :
      reason === 'kitchen_waste' ? 'სამზარეულოს დანაკარგი (Кухонные потери)' : 'სხვა მიზეზი (Другое)'
    );

    const newWriteOff: PartnerWriteOff = {
      id: `wo-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      pointId,
      productId,
      productName: prodName,
      quantity,
      reason,
      reasonText: finalReasonText,
      notes: notes || '',
      costPrice,
      retailPrice,
      createdAt: new Date().toISOString(),
    };

    setWriteOffs(prev => [newWriteOff, ...prev]);

    // Deduct quantity from point stock
    const currentStock = stocks[pointId]?.[productId] || 0;
    const nextStock = Math.max(0, currentStock - quantity);

    setStocks(prev => ({
      ...prev,
      [pointId]: {
        ...(prev[pointId] || {}),
        [productId]: nextStock,
      },
    }));

    // Persist write-off and updated stock to Supabase
    try {
      await partnerDbService.saveWriteOff(newWriteOff);
      await partnerDbService.updateStock(pointId, productId, nextStock);
    } catch (err) {
      console.error('Error saving write-off to DB:', err);
    }

    return newWriteOff;
  };

  const deleteWriteOff = async (id: string, restoreStock: boolean = true): Promise<boolean> => {
    const target = writeOffs.find(w => w.id === id);
    if (target && restoreStock) {
      const currentStock = stocks[target.pointId]?.[target.productId] || 0;
      const restoredStock = currentStock + target.quantity;

      setStocks(prev => ({
        ...prev,
        [target.pointId]: {
          ...(prev[target.pointId] || {}),
          [target.productId]: restoredStock,
        },
      }));

      try {
        await partnerDbService.updateStock(target.pointId, target.productId, restoredStock);
      } catch (err) {
        console.error('Error restoring stock on write-off delete:', err);
      }
    }

    setWriteOffs(prev => prev.filter(w => w.id !== id));

    try {
      await partnerDbService.deleteWriteOff(id);
    } catch (err) {
      console.error('Error deleting write-off in DB:', err);
    }

    return true;
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
        setDishesOrder,
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
        writeOffs,
        createWriteOff,
        deleteWriteOff,
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
