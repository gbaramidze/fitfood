'use client';

import React, { useState, useMemo } from 'react';
import { usePartner } from '@/context/PartnerContext';

export interface CategoryDef {
  id: string;
  labelRu: string;
  labelKa: string;
  icon: string;
  color: string;
}

export const ANALYTICS_CATEGORIES: CategoryDef[] = [
  { id: 'poultry', labelRu: 'Курица / Птица', labelKa: 'ქათამი / ფრინველი', icon: '🍗', color: '#F59E0B' },
  { id: 'meat', labelRu: 'Мясо / Говядина', labelKa: 'საქონლის ხორცი', icon: '🥩', color: '#EF4444' },
  { id: 'fish', labelRu: 'Рыба & Морепродукты', labelKa: 'თევზი & ზღვის პროდუქტები', icon: '🐟', color: '#38BDF8' },
  { id: 'breakfast', labelRu: 'Завтраки & Творог', labelKa: 'საუზმე & ხაჭო', icon: '🥞', color: '#FBBF24' },
  { id: 'salad', labelRu: 'Салаты & Овощи', labelKa: 'სალათი & ბოსტნეული', icon: '🥗', color: '#10B981' },
  { id: 'soup', labelRu: 'Супы & Первое', labelKa: 'წვნიანი & სუპი', icon: '🍲', color: '#FB923C' },
  { id: 'dessert', labelRu: 'ПП Десерты', labelKa: 'ჯანსაღი დესერტი', icon: '🧁', color: '#EC4899' },
  { id: 'drinks', labelRu: 'Напитки & Смузи', labelKa: 'სასმელები & სმუზი', icon: '🥤', color: '#A855F7' },
];

type PeriodPreset = 'today' | 'yesterday' | '7d' | '14d' | '30d' | 'this_month' | 'last_month' | 'all' | 'custom';
type ChartMetric = 'revenue' | 'units' | 'orders';

export const ManagerAnalyticsView: React.FC = () => {
  const { points, products, getPointStock, sales } = usePartner();

  // State Filters
  const [selectedPointFilter, setSelectedPointFilter] = useState<string>('all'); // 'all' or pointId
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('7d');
  
  // Custom Date Range Defaults
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);
  
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const [customStartDate, setCustomStartDate] = useState<string>(sevenDaysAgoStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Multi-Category Filter
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'charts' | 'categories' | 'points' | 'products' | 'stock'>('charts');
  
  // Main Chart metric toggle
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Helper to categorize products
  const getProductCategory = (productId: string, fallbackName?: string): string => {
    const prod = products.find(p => p.id === productId);
    if (prod?.category) {
      const c = prod.category.toLowerCase();
      if (c.includes('poultry') || c.includes('chicken') || c.includes('ქათამ') || c.includes('птиц')) return 'poultry';
      if (c.includes('meat') || c.includes('beef') || c.includes('pork') || c.includes('ხორც') || c.includes('мяс')) return 'meat';
      if (c.includes('fish') || c.includes('seafood') || c.includes('თევზ') || c.includes('рыб')) return 'fish';
      if (c.includes('breakfast') || c.includes('morning') || c.includes('საუზმ') || c.includes('завтрак')) return 'breakfast';
      if (c.includes('salad') || c.includes('სალათ') || c.includes('салат')) return 'salad';
      if (c.includes('soup') || c.includes('წვნიან') || c.includes('სუპ') || c.includes('суп')) return 'soup';
      if (c.includes('dessert') || c.includes('snack') || c.includes('დესერტ') || c.includes('десерт')) return 'dessert';
      if (c.includes('drink') || c.includes('detox') || c.includes('სასმელ') || c.includes('напит') || c.includes('смузи')) return 'drinks';
      return c;
    }
    const name = (fallbackName || '').toLowerCase();
    if (name.includes('ქათამ') || name.includes('куриц') || name.includes('филе') || name.includes('chicken')) return 'poultry';
    if (name.includes('ხორც') || name.includes('мяс') || name.includes('говяд') || name.includes('beef')) return 'meat';
    if (name.includes('თევზ') || name.includes('рыб') || name.includes('лосос') || name.includes('fish') || name.includes('семг')) return 'fish';
    if (name.includes('საუზმ') || name.includes('სირნიკ') || name.includes('сырник') || name.includes('творог') || name.includes('breakfast')) return 'breakfast';
    if (name.includes('სალათ') || name.includes('салат') || name.includes('salad')) return 'salad';
    if (name.includes('სუპ') || name.includes('წვნიან') || name.includes('суп') || name.includes('борщ') || name.includes('soup')) return 'soup';
    if (name.includes('დესერტ') || name.includes('десерт') || name.includes('чиа') || name.includes('мусс') || name.includes('chia')) return 'dessert';
    if (name.includes('სასმელ') || name.includes('напит') || name.includes('сок') || name.includes('смузи') || name.includes('smoothie')) return 'drinks';
    return 'other';
  };

  // Multi-Category Toggles
  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  // 1. Calculate Date Range Boundaries
  const { startDate, endDate, prevStartDate, prevEndDate, isSingleDay, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();
    let singleDay = false;
    let label = '';

    if (periodPreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 1);
      singleDay = true;
      label = `Сегодня (${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})`;
    } else if (periodPreset === 'yesterday') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 1);
      singleDay = true;
      label = `Вчера (${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})`;
    } else if (periodPreset === '7d') {
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      label = 'Последние 7 дней';
    } else if (periodPreset === '14d') {
      start = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(start.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      label = 'Последние 14 дней';
    } else if (periodPreset === '30d') {
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      label = 'Последние 30 дней';
    } else if (periodPreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const daysInThisMonth = now.getDate();
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), Math.max(1, prevEnd.getDate() - daysInThisMonth + 1), 0, 0, 0, 0);
      label = `Этот месяц (${now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })})`;
    } else if (periodPreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      label = `Прошлый месяц (${start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })})`;
    } else if (periodPreset === 'custom') {
      const s = new Date(customStartDate + 'T00:00:00');
      const e = new Date(customEndDate + 'T23:59:59');
      start = isNaN(s.getTime()) ? new Date(0) : s;
      end = isNaN(e.getTime()) ? new Date() : e;
      const duration = Math.max(1, end.getTime() - start.getTime());
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
      singleDay = customStartDate === customEndDate;
      label = `${start.toLocaleDateString('ru-RU')} — ${end.toLocaleDateString('ru-RU')}`;
    } else {
      // 'all'
      start = new Date(0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(0);
      prevEnd = new Date(0);
      label = 'Всё время работы';
    }

    return {
      startDate: start,
      endDate: end,
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      isSingleDay: singleDay,
      dateRangeLabel: label,
    };
  }, [periodPreset, customStartDate, customEndDate]);

  // 2. Filter Active Sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (s.status === 'refunded') return false;
      if (selectedPointFilter !== 'all' && s.pointId !== selectedPointFilter) return false;
      const saleTime = new Date(s.createdAt).getTime();
      return saleTime >= startDate.getTime() && saleTime <= endDate.getTime();
    });
  }, [sales, selectedPointFilter, startDate, endDate]);

  // Previous Period Sales (for growth rate comparison)
  const prevPeriodSales = useMemo(() => {
    if (periodPreset === 'all') return [];
    return sales.filter(s => {
      if (s.status === 'refunded') return false;
      if (selectedPointFilter !== 'all' && s.pointId !== selectedPointFilter) return false;
      const saleTime = new Date(s.createdAt).getTime();
      return saleTime >= prevStartDate.getTime() && saleTime <= prevEndDate.getTime();
    });
  }, [sales, selectedPointFilter, prevStartDate, prevEndDate, periodPreset]);

  // 3. Category Scoped Totals & Metrics
  const hasCategoryFilter = selectedCategories.length > 0;

  const {
    scopedRevenue,
    scopedUnits,
    scopedCardRev,
    scopedCashRev,
    baseTotalRevenue,
    baseTotalUnits,
    categoryStatsMap,
    productSalesMap,
  } = useMemo(() => {
    let rev = 0;
    let units = 0;
    let card = 0;
    let cash = 0;
    let baseRev = 0;
    let baseUnits = 0;

    const catMap: Record<
      string,
      {
        unitsSold: number;
        revenue: number;
        cardRevenue: number;
        cashRevenue: number;
        dishSales: Record<string, { name: string; qty: number; revenue: number }>;
      }
    > = {};

    ANALYTICS_CATEGORIES.forEach(c => {
      catMap[c.id] = { unitsSold: 0, revenue: 0, cardRevenue: 0, cashRevenue: 0, dishSales: {} };
    });
    catMap['other'] = { unitsSold: 0, revenue: 0, cardRevenue: 0, cashRevenue: 0, dishSales: {} };

    const prodMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};

    filteredSales.forEach(sale => {
      const rawSubtotal = sale.items.reduce((sum, it) => sum + it.totalPrice, 0) || 1;
      const discountRatio = sale.totalAmount / rawSubtotal;

      baseRev += sale.totalAmount;

      sale.items.forEach(it => {
        baseUnits += it.quantity;
        const itCat = getProductCategory(it.productId, it.productName);

        if (!catMap[itCat]) {
          catMap[itCat] = { unitsSold: 0, revenue: 0, cardRevenue: 0, cashRevenue: 0, dishSales: {} };
        }

        const effItemRev = it.totalPrice * discountRatio;
        catMap[itCat].unitsSold += it.quantity;
        catMap[itCat].revenue += effItemRev;

        if (sale.paymentMethod === 'card') {
          catMap[itCat].cardRevenue += effItemRev;
        } else if (sale.paymentMethod === 'cash') {
          catMap[itCat].cashRevenue += effItemRev;
        } else if (sale.paymentMethod === 'split' && sale.splitDetails) {
          const cashRatio = (sale.splitDetails.cashAmount || 0) / (sale.totalAmount || 1);
          catMap[itCat].cashRevenue += effItemRev * cashRatio;
          catMap[itCat].cardRevenue += effItemRev * (1 - cashRatio);
        }

        if (!catMap[itCat].dishSales[it.productId]) {
          catMap[itCat].dishSales[it.productId] = { name: it.productName, qty: 0, revenue: 0 };
        }
        catMap[itCat].dishSales[it.productId].qty += it.quantity;
        catMap[itCat].dishSales[it.productId].revenue += effItemRev;

        // Apply Category Filter Scope
        if (!hasCategoryFilter || selectedCategories.includes(itCat)) {
          units += it.quantity;
          rev += effItemRev;

          if (sale.paymentMethod === 'card') {
            card += effItemRev;
          } else if (sale.paymentMethod === 'cash') {
            cash += effItemRev;
          } else if (sale.paymentMethod === 'split' && sale.splitDetails) {
            const cashRatio = (sale.splitDetails.cashAmount || 0) / (sale.totalAmount || 1);
            cash += effItemRev * cashRatio;
            card += effItemRev * (1 - cashRatio);
          }

          if (!prodMap[it.productId]) {
            prodMap[it.productId] = { name: it.productName, category: itCat, qty: 0, revenue: 0 };
          }
          prodMap[it.productId].qty += it.quantity;
          prodMap[it.productId].revenue += effItemRev;
        }
      });
    });

    return {
      scopedRevenue: rev,
      scopedUnits: units,
      scopedCardRev: card,
      scopedCashRev: cash,
      baseTotalRevenue: baseRev,
      baseTotalUnits: baseUnits,
      categoryStatsMap: catMap,
      productSalesMap: prodMap,
    };
  }, [filteredSales, selectedCategories, hasCategoryFilter]);

  // Previous period scoped revenue for growth calculation
  const prevScopedRevenue = useMemo(() => {
    let pRev = 0;
    prevPeriodSales.forEach(sale => {
      const rawSubtotal = sale.items.reduce((sum, it) => sum + it.totalPrice, 0) || 1;
      const discountRatio = sale.totalAmount / rawSubtotal;
      sale.items.forEach(it => {
        const itCat = getProductCategory(it.productId, it.productName);
        if (!hasCategoryFilter || selectedCategories.includes(itCat)) {
          pRev += it.totalPrice * discountRatio;
        }
      });
    });
    return pRev;
  }, [prevPeriodSales, selectedCategories, hasCategoryFilter]);

  const revenueGrowthPercent = prevScopedRevenue > 0
    ? ((scopedRevenue - prevScopedRevenue) / prevScopedRevenue) * 100
    : null;

  // 4. Time-series Data for Dynamic Timeline Graphs
  const timeSeriesData = useMemo(() => {
    if (isSingleDay) {
      // Hourly Breakdown (08:00 - 23:00)
      const hoursMap: Record<number, { label: string; revenue: number; units: number; orders: number }> = {};
      for (let h = 8; h <= 23; h++) {
        hoursMap[h] = { label: `${String(h).padStart(2, '0')}:00`, revenue: 0, units: 0, orders: 0 };
      }

      filteredSales.forEach(sale => {
        const h = new Date(sale.createdAt).getHours();
        if (hoursMap[h]) {
          const rawSubtotal = sale.items.reduce((sum, it) => sum + it.totalPrice, 0) || 1;
          const discountRatio = sale.totalAmount / rawSubtotal;

          let saleMatchingUnits = 0;
          let saleMatchingRev = 0;

          sale.items.forEach(it => {
            const itCat = getProductCategory(it.productId, it.productName);
            if (!hasCategoryFilter || selectedCategories.includes(itCat)) {
              saleMatchingUnits += it.quantity;
              saleMatchingRev += it.totalPrice * discountRatio;
            }
          });

          if (saleMatchingUnits > 0) {
            hoursMap[h].revenue += saleMatchingRev;
            hoursMap[h].units += saleMatchingUnits;
            hoursMap[h].orders += 1;
          }
        }
      });

      return Object.entries(hoursMap).map(([h, val]) => ({
        key: h,
        label: val.label,
        shortLabel: val.label,
        revenue: val.revenue,
        units: val.units,
        orders: val.orders,
      }));
    } else {
      // Daily Breakdown over the period
      const daysMap: Record<string, { label: string; shortLabel: string; revenue: number; units: number; orders: number; dateObj: Date }> = {};
      
      const curr = new Date(startDate);
      while (curr.getTime() <= endDate.getTime()) {
        const key = curr.toISOString().split('T')[0];
        const dateObj = new Date(curr);
        daysMap[key] = {
          label: dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' }),
          shortLabel: dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
          revenue: 0,
          units: 0,
          orders: 0,
          dateObj,
        };
        curr.setDate(curr.getDate() + 1);
      }

      filteredSales.forEach(sale => {
        const key = new Date(sale.createdAt).toISOString().split('T')[0];
        if (daysMap[key]) {
          const rawSubtotal = sale.items.reduce((sum, it) => sum + it.totalPrice, 0) || 1;
          const discountRatio = sale.totalAmount / rawSubtotal;

          let saleMatchingUnits = 0;
          let saleMatchingRev = 0;

          sale.items.forEach(it => {
            const itCat = getProductCategory(it.productId, it.productName);
            if (!hasCategoryFilter || selectedCategories.includes(itCat)) {
              saleMatchingUnits += it.quantity;
              saleMatchingRev += it.totalPrice * discountRatio;
            }
          });

          if (saleMatchingUnits > 0) {
            daysMap[key].revenue += saleMatchingRev;
            daysMap[key].units += saleMatchingUnits;
            daysMap[key].orders += 1;
          }
        }
      });

      return Object.entries(daysMap).map(([k, val]) => ({
        key: k,
        label: val.label,
        shortLabel: val.shortLabel,
        revenue: val.revenue,
        units: val.units,
        orders: val.orders,
      }));
    }
  }, [filteredSales, isSingleDay, startDate, endDate, hasCategoryFilter, selectedCategories]);

  // Max value in time series for chart scaling
  const maxMetricVal = useMemo(() => {
    if (timeSeriesData.length === 0) return 100;
    const vals = timeSeriesData.map(d => chartMetric === 'revenue' ? d.revenue : chartMetric === 'units' ? d.units : d.orders);
    return Math.max(...vals, 10);
  }, [timeSeriesData, chartMetric]);

  // 5. Day of Week & Peak Hours Breakdown
  const { weekdayStats, peakHoursList } = useMemo(() => {
    const daysArr = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const shortDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const wMap: Record<number, { name: string; short: string; revenue: number; units: number; orders: number }> = {};
    for (let i = 0; i < 7; i++) {
      wMap[i] = { name: daysArr[i], short: shortDays[i], revenue: 0, units: 0, orders: 0 };
    }

    const hMap: Record<number, { hour: number; label: string; revenue: number; units: number; orders: number }> = {};
    for (let h = 8; h <= 23; h++) {
      hMap[h] = { hour: h, label: `${h}:00`, revenue: 0, units: 0, orders: 0 };
    }

    filteredSales.forEach(sale => {
      const d = new Date(sale.createdAt);
      const w = d.getDay();
      const h = d.getHours();

      const rawSubtotal = sale.items.reduce((sum, it) => sum + it.totalPrice, 0) || 1;
      const discountRatio = sale.totalAmount / rawSubtotal;

      let saleMatchingUnits = 0;
      let saleMatchingRev = 0;

      sale.items.forEach(it => {
        const itCat = getProductCategory(it.productId, it.productName);
        if (!hasCategoryFilter || selectedCategories.includes(itCat)) {
          saleMatchingUnits += it.quantity;
          saleMatchingRev += it.totalPrice * discountRatio;
        }
      });

      if (saleMatchingUnits > 0) {
        if (wMap[w]) {
          wMap[w].revenue += saleMatchingRev;
          wMap[w].units += saleMatchingUnits;
          wMap[w].orders += 1;
        }
        if (hMap[h]) {
          hMap[h].revenue += saleMatchingRev;
          hMap[h].units += saleMatchingUnits;
          hMap[h].orders += 1;
        }
      }
    });

    // Reorder week to start from Monday (1..6, 0)
    const reorderedWeek = [1, 2, 3, 4, 5, 6, 0].map(idx => ({ dayIdx: idx, ...wMap[idx] }));
    const peakHours = Object.values(hMap).sort((a, b) => b.revenue - a.revenue);

    return { weekdayStats: reorderedWeek, peakHoursList: peakHours };
  }, [filteredSales, hasCategoryFilter, selectedCategories]);

  // 6. Category Analytics Array
  const categoryAnalyticsList = useMemo(() => {
    return ANALYTICS_CATEGORIES.map(catDef => {
      const data = categoryStatsMap[catDef.id] || { unitsSold: 0, revenue: 0, cardRevenue: 0, cashRevenue: 0, dishSales: {} };
      const shareUnits = baseTotalUnits > 0 ? (data.unitsSold / baseTotalUnits) * 100 : 0;
      const shareRevenue = baseTotalRevenue > 0 ? (data.revenue / baseTotalRevenue) * 100 : 0;
      const topDish = Object.values(data.dishSales).sort((a, b) => b.qty - a.qty)[0] || null;

      const catProducts = products.filter(p => getProductCategory(p.id, p.name?.ru || p.name?.ka) === catDef.id);
      const currentStock = points.reduce((sum, pt) => {
        if (selectedPointFilter !== 'all' && pt.id !== selectedPointFilter) return sum;
        return sum + catProducts.reduce((pSum, p) => pSum + getPointStock(pt.id, p.id), 0);
      }, 0);

      return {
        ...catDef,
        unitsSold: data.unitsSold,
        revenue: data.revenue,
        cardRevenue: data.cardRevenue,
        cashRevenue: data.cashRevenue,
        shareUnits,
        shareRevenue,
        topDish,
        currentStock,
        productsCount: catProducts.length,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [categoryStatsMap, baseTotalUnits, baseTotalRevenue, products, points, selectedPointFilter]);

  // 7. Top Selling Dishes
  const topProducts = useMemo(() => {
    return Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);
  }, [productSalesMap]);

  // 8. Points Comparison
  const pointStats = useMemo(() => {
    return points.map(pt => {
      const ptSales = filteredSales.filter(s => s.pointId === pt.id);
      let ptRev = 0;
      let ptUnits = 0;
      let ptCard = 0;
      let ptCash = 0;

      ptSales.forEach(sale => {
        const rawSubtotal = sale.items.reduce((sum, it) => sum + it.totalPrice, 0) || 1;
        const discountRatio = sale.totalAmount / rawSubtotal;

        sale.items.forEach(it => {
          const itCat = getProductCategory(it.productId, it.productName);
          if (hasCategoryFilter && !selectedCategories.includes(itCat)) return;

          const effRev = it.totalPrice * discountRatio;
          ptUnits += it.quantity;
          ptRev += effRev;

          if (sale.paymentMethod === 'card') ptCard += effRev;
          else if (sale.paymentMethod === 'cash') ptCash += effRev;
          else if (sale.paymentMethod === 'split' && sale.splitDetails) {
            const cashRatio = (sale.splitDetails.cashAmount || 0) / (sale.totalAmount || 1);
            ptCash += effRev * cashRatio;
            ptCard += effRev * (1 - cashRatio);
          }
        });
      });

      const matchingProducts = hasCategoryFilter
        ? products.filter(p => selectedCategories.includes(getProductCategory(p.id, p.name?.ru || p.name?.ka)))
        : products;

      const ptStock = matchingProducts.reduce((sum, p) => sum + getPointStock(pt.id, p.id), 0);

      return {
        point: pt,
        salesCount: ptSales.length,
        revenue: ptRev,
        unitsSold: ptUnits,
        cardRevenue: ptCard,
        cashRevenue: ptCash,
        currentStock: ptStock,
      };
    });
  }, [points, filteredSales, hasCategoryFilter, selectedCategories, products]);

  const totalFilteredStock = useMemo(() => {
    return points.reduce((sum, pt) => {
      if (selectedPointFilter !== 'all' && pt.id !== selectedPointFilter) return sum;
      const matchingProducts = hasCategoryFilter
        ? products.filter(p => selectedCategories.includes(getProductCategory(p.id, p.name?.ru || p.name?.ka)))
        : products;
      return sum + matchingProducts.reduce((pSum, p) => pSum + getPointStock(pt.id, p.id), 0);
    }, 0);
  }, [points, selectedPointFilter, hasCategoryFilter, selectedCategories, products]);

  // SVG Chart Dimensions
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 30;

  return (
    <div className="partner-min-container">
      {/* PAGE HEADER */}
      <div className="partner-min-head" style={{ alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h2>📈 Графики & Аналитика сети FitFood</h2>
          <p style={{ marginTop: '4px', color: '#94A3B8' }}>
            {selectedPointFilter === 'all'
              ? `Сводная статистика сети (${points.length} залов) • ${dateRangeLabel}`
              : `${points.find(p => p.id === selectedPointFilter)?.name.ru} • ${dateRangeLabel}`}
          </p>
        </div>

        {/* POINT FILTER PILLS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div className="partner-min-periods">
            <button
              onClick={() => setSelectedPointFilter('all')}
              className={`period-btn ${selectedPointFilter === 'all' ? 'active' : ''}`}
            >
              🌐 Все точки сети
            </button>
            {points.map(pt => (
              <button
                key={pt.id}
                onClick={() => setSelectedPointFilter(pt.id)}
                className={`period-btn ${selectedPointFilter === pt.id ? 'active' : ''}`}
              >
                {pt.name.ru.replace('FitFood ', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE PERIOD SELECTOR TOOLBAR */}
      <div style={{
        background: '#14171F',
        borderRadius: '12px',
        border: '1px solid #282E3A',
        padding: '12px 16px',
        marginTop: '14px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginRight: '4px' }}>
            📅 Период:
          </span>
          <button
            onClick={() => setPeriodPreset('today')}
            className={`period-btn ${periodPreset === 'today' ? 'active' : ''}`}
          >
            Сегодня
          </button>
          <button
            onClick={() => setPeriodPreset('yesterday')}
            className={`period-btn ${periodPreset === 'yesterday' ? 'active' : ''}`}
          >
            Вчера
          </button>
          <button
            onClick={() => setPeriodPreset('7d')}
            className={`period-btn ${periodPreset === '7d' ? 'active' : ''}`}
          >
            7 дней
          </button>
          <button
            onClick={() => setPeriodPreset('14d')}
            className={`period-btn ${periodPreset === '14d' ? 'active' : ''}`}
          >
            14 дней
          </button>
          <button
            onClick={() => setPeriodPreset('30d')}
            className={`period-btn ${periodPreset === '30d' ? 'active' : ''}`}
          >
            30 дней
          </button>
          <button
            onClick={() => setPeriodPreset('this_month')}
            className={`period-btn ${periodPreset === 'this_month' ? 'active' : ''}`}
          >
            Этот месяц
          </button>
          <button
            onClick={() => setPeriodPreset('last_month')}
            className={`period-btn ${periodPreset === 'last_month' ? 'active' : ''}`}
          >
            Прошлый месяц
          </button>
          <button
            onClick={() => setPeriodPreset('all')}
            className={`period-btn ${periodPreset === 'all' ? 'active' : ''}`}
          >
            Всё время
          </button>
          <button
            onClick={() => setPeriodPreset('custom')}
            className={`period-btn ${periodPreset === 'custom' ? 'active' : ''}`}
            style={{ borderColor: periodPreset === 'custom' ? '#10B981' : undefined }}
          >
            🗓️ Произвольный период
          </button>
        </div>

        {/* Custom Range Date Pickers */}
        {periodPreset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#181B22', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>С:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              style={{
                background: '#111318',
                border: '1px solid #282E3A',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                padding: '4px 8px',
              }}
            />
            <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>По:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              style={{
                background: '#111318',
                border: '1px solid #282E3A',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                padding: '4px 8px',
              }}
            />
          </div>
        )}
      </div>

      {/* MULTI-CATEGORY FILTER BAR */}
      <div style={{
        background: '#14171F',
        borderRadius: '12px',
        border: '1px solid #282E3A',
        padding: '12px 16px',
        marginTop: '10px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#E2E8F0' }}>
              🏷️ Фильтр по категориям:
            </span>
            {hasCategoryFilter && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                Активно категорий: {selectedCategories.length}
              </span>
            )}
          </div>

          {hasCategoryFilter && (
            <button
              onClick={clearCategories}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✕ Сбросить фильтр категорий
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            onClick={clearCategories}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: !hasCategoryFilter ? '#FFFFFF' : '#181B22',
              color: !hasCategoryFilter ? '#090A0F' : '#94A3B8',
              border: `1px solid ${!hasCategoryFilter ? '#FFFFFF' : '#282E3A'}`,
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>🌐 Все категории</span>
            <span style={{
              fontSize: '10.5px',
              opacity: 0.85,
              background: !hasCategoryFilter ? '#090A0F' : '#282E3A',
              color: !hasCategoryFilter ? '#FFFFFF' : '#CBD5E1',
              padding: '1px 6px',
              borderRadius: '10px',
            }}>
              {baseTotalUnits} шт.
            </span>
          </button>

          {ANALYTICS_CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat.id);
            const catData = categoryStatsMap[cat.id] || { unitsSold: 0 };

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.18)' : '#181B22',
                  color: isSelected ? '#34D399' : '#E2E8F0',
                  border: `1px solid ${isSelected ? '#10B981' : '#282E3A'}`,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span>{cat.icon} {cat.labelRu}</span>
                <span style={{
                  fontSize: '10.5px',
                  background: isSelected ? '#10B981' : '#282E3A',
                  color: isSelected ? '#064E3B' : '#94A3B8',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '10px',
                }}>
                  {catData.unitsSold}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP KPI HERO CARDS */}
      <div className="partner-min-kpi-grid" style={{ marginTop: '16px' }}>
        <div className="partner-min-kpi highlight">
          <span className="label">
            {hasCategoryFilter ? `Выручка (${selectedCategories.length} кат.)` : 'Выручка за период'}
          </span>
          <strong className="value">
            {scopedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </strong>
          <span className="sub">
            {revenueGrowthPercent !== null ? (
              <span style={{ color: revenueGrowthPercent >= 0 ? '#34D399' : '#F87171', fontWeight: 700 }}>
                {revenueGrowthPercent >= 0 ? '↗ +' : '↘ '}{revenueGrowthPercent.toFixed(1)}% к прошлому периоду
              </span>
            ) : (
              `${filteredSales.length} чеков`
            )}
          </span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">Продано рационов</span>
          <strong className="value">{scopedUnits} шт.</strong>
          <span className="sub">
            {hasCategoryFilter
              ? `Доля: ${baseTotalUnits > 0 ? ((scopedUnits / baseTotalUnits) * 100).toFixed(1) : 0}% от всех блюд`
              : `Средний чек: ${filteredSales.length > 0 ? (scopedRevenue / filteredSales.length).toFixed(2) : 0} ₾`}
          </span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💳 Оплата картой</span>
          <strong className="value" style={{ color: '#60A5FA' }}>{scopedCardRev.toFixed(2)} ₾</strong>
          <span className="sub">
            Доля: {scopedRevenue > 0 ? ((scopedCardRev / scopedRevenue) * 100).toFixed(0) : 0}% безналичные
          </span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💵 Оплата наличными</span>
          <strong className="value" style={{ color: '#34D399' }}>{scopedCashRev.toFixed(2)} ₾</strong>
          <span className="sub">
            Доля: {scopedRevenue > 0 ? ((scopedCashRev / scopedRevenue) * 100).toFixed(0) : 0}% в кассе
          </span>
        </div>
      </div>

      {/* ANALYTICS NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderBottom: '1px solid #282E3A', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('charts')}
          style={{
            background: activeTab === 'charts' ? '#10B981' : '#181B22',
            color: activeTab === 'charts' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📊 Графики & Динамика
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            background: activeTab === 'categories' ? '#10B981' : '#181B22',
            color: activeTab === 'categories' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🏷️ Статистика по категориям
        </button>
        <button
          onClick={() => setActiveTab('points')}
          style={{
            background: activeTab === 'points' ? '#10B981' : '#181B22',
            color: activeTab === 'points' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🏢 Сводка по точкам
        </button>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            background: activeTab === 'products' ? '#10B981' : '#181B22',
            color: activeTab === 'products' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🏆 Топ продаж рационов
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            background: activeTab === 'stock' ? '#10B981' : '#181B22',
            color: activeTab === 'stock' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📦 Остатки на витринах
        </button>
      </div>

      {/* TAB 1: CHARTS & DYNAMICS */}
      {activeTab === 'charts' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* MAIN TIMELINE AREA / BAR CHART */}
          <div className="partner-min-card">
            <div className="card-title-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title">
                  {isSingleDay ? 'Почасовая динамика продаж за день' : 'Динамика продаж по дням выбранного периода'}
                </h3>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {isSingleDay ? 'Распределение выручки и чеков по часам суток' : `Ежедневные показатели с ${startDate.toLocaleDateString('ru-RU')} по ${endDate.toLocaleDateString('ru-RU')}`}
                </span>
              </div>

              {/* Metric switcher */}
              <div style={{ display: 'flex', gap: '6px', background: '#111318', padding: '4px', borderRadius: '8px', border: '1px solid #282E3A' }}>
                <button
                  onClick={() => setChartMetric('revenue')}
                  style={{
                    background: chartMetric === 'revenue' ? '#10B981' : 'transparent',
                    color: chartMetric === 'revenue' ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  💰 Выручка (₾)
                </button>
                <button
                  onClick={() => setChartMetric('units')}
                  style={{
                    background: chartMetric === 'units' ? '#38BDF8' : 'transparent',
                    color: chartMetric === 'units' ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📦 Порции (шт)
                </button>
                <button
                  onClick={() => setChartMetric('orders')}
                  style={{
                    background: chartMetric === 'orders' ? '#A855F7' : 'transparent',
                    color: chartMetric === 'orders' ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🧾 Чеки
                </button>
              </div>
            </div>

            {/* SVG Visual Area Chart */}
            <div style={{ marginTop: '16px', position: 'relative', width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: '600px' }}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartMetric === 'revenue' ? '#10B981' : chartMetric === 'units' ? '#38BDF8' : '#A855F7'} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={chartMetric === 'revenue' ? '#10B981' : chartMetric === 'units' ? '#38BDF8' : '#A855F7'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + (chartHeight - 2 * paddingY) * (1 - ratio);
                    const val = (maxMetricVal * ratio).toFixed(chartMetric === 'revenue' ? 0 : 0);
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#282E3A"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 8}
                          y={y + 3}
                          fill="#64748B"
                          fontSize="10"
                          textAnchor="end"
                          fontFamily="sans-serif"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Construct Points */}
                  {(() => {
                    if (timeSeriesData.length === 0) return null;

                    const pointSpacing = (chartWidth - 2 * paddingX) / Math.max(1, timeSeriesData.length - 1);
                    const coords = timeSeriesData.map((d, i) => {
                      const val = chartMetric === 'revenue' ? d.revenue : chartMetric === 'units' ? d.units : d.orders;
                      const x = paddingX + i * pointSpacing;
                      const y = paddingY + (chartHeight - 2 * paddingY) * (1 - (val / (maxMetricVal || 1)));
                      return { x, y, data: d, val };
                    });

                    // Area Path
                    const linePathStr = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const areaPathStr = `${linePathStr} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`;

                    const strokeColor = chartMetric === 'revenue' ? '#10B981' : chartMetric === 'units' ? '#38BDF8' : '#A855F7';

                    return (
                      <>
                        <path d={areaPathStr} fill="url(#chartGradient)" />
                        <path d={linePathStr} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {coords.map((c, i) => {
                          const isHovered = hoveredPointIndex === i;
                          const showLabel = timeSeriesData.length <= 14 || i % Math.ceil(timeSeriesData.length / 10) === 0 || i === timeSeriesData.length - 1;

                          return (
                            <g key={i} onMouseEnter={() => setHoveredPointIndex(i)} onMouseLeave={() => setHoveredPointIndex(null)}>
                              {/* X Axis Tick Labels */}
                              {showLabel && (
                                <text
                                  x={c.x}
                                  y={chartHeight - paddingY + 18}
                                  fill="#94A3B8"
                                  fontSize="10"
                                  textAnchor="middle"
                                  fontWeight={isHovered ? 700 : 400}
                                >
                                  {c.data.shortLabel || c.data.label}
                                </text>
                              )}

                              {/* Interactive Circle */}
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={isHovered ? 6 : 4}
                                fill={isHovered ? '#FFFFFF' : strokeColor}
                                stroke="#14171F"
                                strokeWidth="2"
                                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                              />

                              {/* Hover Tooltip Value */}
                              {isHovered && (
                                <g>
                                  <rect
                                    x={Math.max(10, Math.min(chartWidth - 110, c.x - 50))}
                                    y={Math.max(5, c.y - 42)}
                                    width="100"
                                    height="34"
                                    rx="6"
                                    fill="#0F172A"
                                    stroke={strokeColor}
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x={Math.max(10, Math.min(chartWidth - 110, c.x - 50)) + 50}
                                    y={Math.max(5, c.y - 42) + 14}
                                    fill="#94A3B8"
                                    fontSize="9.5"
                                    textAnchor="middle"
                                  >
                                    {c.data.label}
                                  </text>
                                  <text
                                    x={Math.max(10, Math.min(chartWidth - 110, c.x - 50)) + 50}
                                    y={Math.max(5, c.y - 42) + 27}
                                    fill="#FFFFFF"
                                    fontSize="12"
                                    fontWeight="700"
                                    textAnchor="middle"
                                  >
                                    {chartMetric === 'revenue' ? `${c.val.toFixed(2)} ₾` : chartMetric === 'units' ? `${c.val} шт.` : `${c.val} чеков`}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>

          {/* 2 COLS: CATEGORY DONUT CHART (LEFT) & DAY-OF-WEEK / PEAK HOURS (RIGHT) */}
          <div className="partner-min-grid-2col">
            
            {/* Donut Chart: Category Share */}
            <div className="partner-min-card">
              <div className="card-title-row">
                <h3 className="card-title">Доли категорий в продажах</h3>
                <span className="stock-count-tag">
                  {categoryAnalyticsList.filter(c => c.unitsSold > 0).length} активных категорий
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '14px', flexWrap: 'wrap' }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {(() => {
                      let accumulatedPercent = 0;
                      const activeCats = categoryAnalyticsList.filter(c => c.revenue > 0);

                      if (activeCats.length === 0) {
                        return <circle cx="50" cy="50" r="38" fill="transparent" stroke="#282E3A" strokeWidth="18" />;
                      }

                      return activeCats.map(cat => {
                        const strokeDasharray = `${cat.shareRevenue} ${100 - cat.shareRevenue}`;
                        const strokeDashoffset = -accumulatedPercent;
                        accumulatedPercent += cat.shareRevenue;

                        return (
                          <circle
                            key={cat.id}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={cat.color}
                            strokeWidth="18"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            pathLength="100"
                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onClick={() => toggleCategory(cat.id)}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>Выручка</span>
                    <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>{scopedRevenue.toFixed(0)} ₾</strong>
                  </div>
                </div>

                {/* Donut Legend */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                  {categoryAnalyticsList.slice(0, 6).map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        background: selectedCategories.includes(cat.id) ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                        <span style={{ color: '#E2E8F0' }}>{cat.icon} {cat.labelRu}</span>
                      </div>
                      <strong style={{ color: '#F9FAFB' }}>
                        {cat.shareRevenue.toFixed(1)}% <small style={{ color: '#94A3B8', fontWeight: 400 }}>({cat.revenue.toFixed(0)}₾)</small>
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekday Dynamics / Peak hours */}
            <div className="partner-min-card">
              <div className="card-title-row">
                <h3 className="card-title">Продажи по дням недели</h3>
                <span className="stock-count-tag">Активность клиентов</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {weekdayStats.map(w => {
                  const maxDayRev = Math.max(...weekdayStats.map(s => s.revenue), 1);
                  const share = (w.revenue / maxDayRev) * 100;

                  return (
                    <div key={w.dayIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '28px', fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>{w.short}</span>
                      <div style={{ flex: 1, height: '18px', background: '#181B22', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div
                          style={{
                            width: `${share}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #10B981 0%, #38BDF8 100%)',
                            borderRadius: '4px',
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}>
                          {w.revenue.toFixed(0)} ₾ ({w.units} шт.)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {peakHoursList.length > 0 && peakHoursList[0].revenue > 0 && (
                <div style={{ marginTop: '14px', padding: '10px 12px', background: '#111318', borderRadius: '8px', border: '1px solid #282E3A', fontSize: '12px', color: '#94A3B8' }}>
                  🔥 <b>Пиковые часы зала:</b> Самый активный поток заказов фиксируется в <b style={{ color: '#38BDF8' }}>{peakHoursList[0].label}</b> и <b style={{ color: '#38BDF8' }}>{peakHoursList[1]?.label || 'вечером'}</b>.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CATEGORY PERFORMANCE TABLE & MATRIX */}
      {activeTab === 'categories' && (
        <div style={{ marginTop: '18px' }}>
          {/* Category Cards Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {categoryAnalyticsList.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);

              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : '#14171F',
                    border: `1px solid ${isSelected ? '#10B981' : '#282E3A'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#FFFFFF', display: 'block' }}>{cat.labelRu}</strong>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{cat.labelKa}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ Выбрано
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Выручка:</div>
                      <strong style={{ fontSize: '16px', color: '#F9FAFB' }}>{cat.revenue.toFixed(2)} ₾</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Продано:</div>
                      <strong style={{ fontSize: '15px', color: '#10B981' }}>{cat.unitsSold} шт.</strong>
                    </div>
                  </div>

                  {/* Share progress bar */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                      <span>Доля в выручке:</span>
                      <strong style={{ color: '#E2E8F0' }}>{cat.shareRevenue.toFixed(1)}%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#1E2430', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${cat.shareRevenue}%`, height: '100%', background: cat.color, borderRadius: '3px' }} />
                    </div>
                  </div>

                  {cat.topDish && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🏆 Топ: <span style={{ color: '#CBD5E1' }}>{cat.topDish.name} ({cat.topDish.qty} шт.)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Category Table */}
          <div className="partner-min-card">
            <div className="card-title-row">
              <h3 className="card-title">Сравнительная таблица категорий за период ({dateRangeLabel})</h3>
              <span className="stock-count-tag">
                Всего категорий: {categoryAnalyticsList.length}
              </span>
            </div>

            <div className="partner-min-table-wrap">
              <table className="partner-min-table">
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th style={{ textAlign: 'center' }}>Продано (порций)</th>
                    <th>Выручка (₾)</th>
                    <th>Доля в выручке</th>
                    <th>💳 Картой (₾)</th>
                    <th>💵 Наличными (₾)</th>
                    <th>Лидер продаж в категории</th>
                    <th style={{ textAlign: 'right' }}>Остаток на витринах</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryAnalyticsList.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);

                    return (
                      <tr
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.08)' : undefined,
                          cursor: 'pointer',
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                            <div>
                              <strong>{cat.labelRu}</strong>
                              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cat.labelKa}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: '#FFFFFF', fontSize: '13.5px' }}>{cat.unitsSold}</strong> шт.
                        </td>
                        <td>
                          <strong style={{ color: '#FFFFFF', fontSize: '14px' }}>{cat.revenue.toFixed(2)} ₾</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#1E2430', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${cat.shareRevenue}%`, height: '100%', background: cat.color, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', width: '40px' }}>
                              {cat.shareRevenue.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ color: '#60A5FA', fontWeight: 600 }}>{cat.cardRevenue.toFixed(2)} ₾</td>
                        <td style={{ color: '#34D399', fontWeight: 600 }}>{cat.cashRevenue.toFixed(2)} ₾</td>
                        <td>
                          {cat.topDish ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '12px', color: '#E2E8F0' }}>{cat.topDish.name}</div>
                              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cat.topDish.qty} шт. • {cat.topDish.revenue.toFixed(2)} ₾</div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`stock-simple-tag ${cat.currentStock <= 5 ? 'low' : ''}`}>
                            {cat.currentStock} шт.
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid #334155', background: '#0F172A' }}>
                    <td>Итого по всем категориям</td>
                    <td style={{ textAlign: 'center' }}>{baseTotalUnits} шт.</td>
                    <td>{baseTotalRevenue.toFixed(2)} ₾</td>
                    <td>100%</td>
                    <td style={{ color: '#60A5FA' }}>{filteredSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)} ₾</td>
                    <td style={{ color: '#34D399' }}>{filteredSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)} ₾</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right' }}>{points.reduce((sum, pt) => sum + products.reduce((ps, p) => ps + getPointStock(pt.id, p.id), 0), 0)} шт.</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POINTS COMPARISON */}
      {activeTab === 'points' && (
        <div className="partner-min-card" style={{ marginTop: '18px' }}>
          <div className="card-title-row">
            <h3 className="card-title">
              {hasCategoryFilter
                ? `Сводка по точкам (Категории: ${selectedCategories.map(c => ANALYTICS_CATEGORIES.find(ac => ac.id === c)?.icon).join(' ')})`
                : `Сводка по точкам продаж за ${dateRangeLabel}`}
            </h3>
            <span className="stock-count-tag">
              {selectedPointFilter === 'all'
                ? `Остаток на полках: ${totalFilteredStock} шт.`
                : `Остаток точки: ${pointStats.find(p => p.point.id === selectedPointFilter)?.currentStock} шт.`}
            </span>
          </div>

          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>Точка продаж</th>
                  <th>Продано (порций)</th>
                  <th>Выручка (₾)</th>
                  <th>💳 Картой (₾)</th>
                  <th>💵 Наличными (₾)</th>
                  <th style={{ textAlign: 'right' }}>Остаток на витрине</th>
                </tr>
              </thead>
              <tbody>
                {pointStats.map(stat => {
                  const isSelected = selectedPointFilter === stat.point.id;

                  return (
                    <tr
                      key={stat.point.id}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedPointFilter(stat.point.id)}
                      title="Нажмите, чтобы отфильтровать по этой точке"
                    >
                      <td>
                        <strong>{stat.point.name.ru}</strong>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{stat.point.address.ru}</div>
                      </td>
                      <td><strong>{stat.unitsSold}</strong> шт.</td>
                      <td><strong style={{ color: '#FFFFFF' }}>{stat.revenue.toFixed(2)} ₾</strong></td>
                      <td style={{ color: '#60A5FA', fontWeight: 600 }}>{stat.cardRevenue.toFixed(2)} ₾</td>
                      <td style={{ color: '#34D399', fontWeight: 600 }}>{stat.cashRevenue.toFixed(2)} ₾</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`stock-simple-tag ${stat.currentStock <= 5 ? 'low' : ''}`}>
                          {stat.currentStock} шт.
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {selectedPointFilter === 'all' && (
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid #334155', background: '#0F172A' }}>
                    <td>Итого по сети</td>
                    <td>{scopedUnits} шт.</td>
                    <td>{scopedRevenue.toFixed(2)} ₾</td>
                    <td style={{ color: '#60A5FA' }}>{scopedCardRev.toFixed(2)} ₾</td>
                    <td style={{ color: '#34D399' }}>{scopedCashRev.toFixed(2)} ₾</td>
                    <td style={{ textAlign: 'right' }}>{totalFilteredStock} шт.</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TOP SELLING DISHES */}
      {activeTab === 'products' && (
        <div className="partner-min-card" style={{ marginTop: '18px' }}>
          <div className="card-title-row">
            <h3 className="card-title">
              {hasCategoryFilter
                ? `Рейтинг блюд (Выбрано категорий: ${selectedCategories.length})`
                : selectedPointFilter === 'all' ? `Топ продаж по всей сети (${dateRangeLabel})` : `Топ продаж выбранной точки (${dateRangeLabel})`}
            </h3>
            <span className="stock-count-tag">
              Позиций в рейтинге: {topProducts.length}
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="partner-min-empty-card"><p>Продаж по выбранному фильтру нет</p></div>
          ) : (
            <div className="partner-min-table-wrap">
              <table className="partner-min-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Рацион / Блюдо</th>
                    <th>Категория</th>
                    <th style={{ textAlign: 'center' }}>Продано (шт)</th>
                    <th>Выручка (₾)</th>
                    <th>Доля в объеме</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((item, idx) => {
                    const catDef = ANALYTICS_CATEGORIES.find(c => c.id === item.category);
                    const share = scopedUnits > 0 ? (item.qty / scopedUnits) * 100 : 0;

                    return (
                      <tr key={idx}>
                        <td style={{ color: '#64748B', fontWeight: 700 }}>{idx + 1}</td>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            background: '#181B22',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #282E3A',
                            color: '#CBD5E1',
                          }}>
                            {catDef?.icon || '🍱'} {catDef?.labelRu || 'Другое'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ fontSize: '13.5px', color: '#FFFFFF' }}>{item.qty}</strong> шт.
                        </td>
                        <td>
                          <strong style={{ color: '#10B981' }}>{item.revenue.toFixed(2)} ₾</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                            <div style={{ flex: 1, height: '5px', background: '#1E2430', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${share}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#94A3B8', width: '35px' }}>{share.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LIVE SHELF STOCK MATRIX */}
      {activeTab === 'stock' && (
        <div className="partner-min-card" style={{ marginTop: '18px' }}>
          <div className="card-title-row">
            <h3 className="card-title">
              {hasCategoryFilter
                ? `Остатки на витринах (Категории: ${selectedCategories.map(c => ANALYTICS_CATEGORIES.find(ac => ac.id === c)?.icon).join(' ')})`
                : selectedPointFilter === 'all' ? 'Остатки рационов по сети' : 'Остатки на выбранной точке'}
            </h3>
            <span className="stock-count-tag">
              Всего позиций: {totalFilteredStock} шт.
            </span>
          </div>

          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>Рацион</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  {selectedPointFilter === 'all' ? (
                    <>
                      {points.map(pt => (
                        <th key={pt.id} style={{ textAlign: 'center', fontSize: '11px' }}>
                          {pt.name.ru.replace('FitFood ', '')}
                        </th>
                      ))}
                      <th style={{ textAlign: 'right' }}>Всего</th>
                    </>
                  ) : (
                    <th style={{ textAlign: 'right' }}>Остаток</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(prod => !hasCategoryFilter || selectedCategories.includes(getProductCategory(prod.id, prod.name?.ru || prod.name?.ka)))
                  .map(prod => {
                    const prodCat = getProductCategory(prod.id, prod.name?.ru || prod.name?.ka);
                    const catDef = ANALYTICS_CATEGORIES.find(c => c.id === prodCat);

                    if (selectedPointFilter === 'all') {
                      const totalProdStock = points.reduce((sum, pt) => sum + getPointStock(pt.id, prod.id), 0);
                      return (
                        <tr key={prod.id}>
                          <td><strong>{prod.name.ru || prod.name.ka}</strong></td>
                          <td>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              {catDef?.icon} {catDef?.labelRu}
                            </span>
                          </td>
                          <td>{prod.price} ₾</td>
                          {points.map(pt => {
                            const s = getPointStock(pt.id, prod.id);
                            return (
                              <td key={pt.id} style={{ textAlign: 'center' }}>
                                <span style={{ color: s <= 2 ? '#EF4444' : '#E2E8F0', fontWeight: 600 }}>
                                  {s}
                                </span>
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'right' }}>
                            <span className={`stock-simple-tag ${totalProdStock <= 6 ? 'low' : ''}`}>
                              {totalProdStock} шт.
                            </span>
                          </td>
                        </tr>
                      );
                    } else {
                      const stock = getPointStock(selectedPointFilter, prod.id);
                      return (
                        <tr key={prod.id}>
                          <td><strong>{prod.name.ru || prod.name.ka}</strong></td>
                          <td>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              {catDef?.icon} {catDef?.labelRu}
                            </span>
                          </td>
                          <td>{prod.price} ₾</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`stock-simple-tag ${stock <= 3 ? 'low' : ''}`}>
                              {stock} шт.
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
