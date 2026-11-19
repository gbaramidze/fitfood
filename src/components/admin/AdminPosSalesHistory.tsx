'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { PartnerSale } from '@/types/partner';
import {
  COOK_CATEGORIES,
  DEFAULT_EXCLUDED_CATEGORIES,
  isCookItem,
  calculateSaleCookBreakdown,
  calculateCookBreakdownFromProducts
} from '@/lib/cookCommissionHelper';
import { partnerDbService, SalesSummary, SalesQueryFilters } from '@/services/partnerDbService';
import { getSalesDateRange, SalesPeriod } from '@/lib/salesPeriod';
import { AdminPagination } from './AdminPagination';

type PeriodType = SalesPeriod;

const EMPTY_SUMMARY: SalesSummary = {
  receipts: 0,
  gross: 0,
  net: 0,
  discount: 0,
  noItemsReceipts: 0,
  noItemsGross: 0,
  products: [],
};

export const AdminPosSalesHistory: React.FC = () => {
  // `sales` (the full list kept in context) is only used as a "something changed" signal for realtime refresh;
  // totals come from the database (SUM/COUNT) and the table is paginated on the server.
  const { sales: liveSales, points, searchQuery, dishes } = useAdmin();

  const [selectedPointFilter, setSelectedPointFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  // Categories excluded from cook's 5% bonus (e.g. drinks, coffee)
  const [excludedCategories, setExcludedCategories] = useState<string[]>(DEFAULT_EXCLUDED_CATEGORIES);

  // Default custom range: from 1st day of current month until today
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Toggle category inclusion/exclusion for cook
  const toggleCategoryExclusion = (categoryId: string) => {
    setExcludedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(c => c !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Helper to get nominal original amount of a single sale (used for the receipts shown in the table)
  const getSaleOriginalAmount = (s: PartnerSale): number => {
    if (Number(s.originalAmount) > 0) return Number(s.originalAmount);
    if (Array.isArray(s.items) && s.items.length > 0) {
      return s.items.reduce((sum, it) => sum + ((Number(it.pricePerUnit) || 16) * (Number(it.quantity) || 1)), 0);
    }
    return Number(s.totalAmount) || 0;
  };

  // ---------- Server-side data: filters -> totals (SUM) + one page of receipts ----------
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filters: SalesQueryFilters = useMemo(() => {
    const range = getSalesDateRange(selectedPeriod, customStartDate, customEndDate);
    return {
      from: range.from,
      to: range.to,
      pointId: selectedPointFilter,
      paymentMethod: paymentFilter,
      search: debouncedSearch,
    };
  }, [selectedPeriod, customStartDate, customEndDate, selectedPointFilter, paymentFilter, debouncedSearch]);

  const [pageSize, setPageSize] = useState<number>(50);

  // The page number belongs to one set of filters; when the filters (or the page size) change it falls back to 1.
  const filtersKey = JSON.stringify([filters, pageSize]);
  const [pageState, setPageState] = useState<{ key: string; page: number }>({ key: filtersKey, page: 1 });
  const page = pageState.key === filtersKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filtersKey, page: p });

  const [summary, setSummary] = useState<SalesSummary>(EMPTY_SUMMARY);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
  const [pageRows, setPageRows] = useState<PartnerSale[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  // Ignore responses of requests that were superseded by newer filters
  const summaryReq = useRef(0);
  const pageReq = useRef(0);

  useEffect(() => {
    const reqId = ++summaryReq.current;
    setIsSummaryLoading(true);
    partnerDbService.getSalesSummary(filters).then(result => {
      if (reqId !== summaryReq.current) return;
      if (result) {
        setSummary(result);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
      setIsSummaryLoading(false);
    });
  }, [filters, liveSales]);

  useEffect(() => {
    const reqId = ++pageReq.current;
    setIsPageLoading(true);
    partnerDbService.getSalesPage(filters, page, pageSize).then(result => {
      if (reqId !== pageReq.current) return;
      if (result) {
        setPageRows(result.rows);
        setTotalRows(result.total);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
      setIsPageLoading(false);
    });
  }, [filters, page, pageSize, liveSales]);

  // Helper to resolve a sold item's dish category
  const resolveItemCategory = (it: { productId?: string; productName: string }): string => {
    const nameNorm = (it.productName || '').trim().toLowerCase();
    const dish = dishes.find(d =>
      (it.productId && d.id === it.productId) ||
      (typeof d.name === 'object' && (
        (d.name.ka && d.name.ka.trim().toLowerCase() === nameNorm) ||
        (d.name.ru && d.name.ru.trim().toLowerCase() === nameNorm) ||
        (d.name.en && d.name.en.trim().toLowerCase() === nameNorm)
      )) ||
      (typeof d.name === 'string' && (d.name as string).trim().toLowerCase() === nameNorm)
    );
    return dish?.category || 'other';
  };

  // Breakdown of sold positions by dish category for ALL receipts of the selected period/filters
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { quantity: number; revenue: number }> = {};

    summary.products.forEach(p => {
      const catId = resolveItemCategory(p);
      if (!map[catId]) map[catId] = { quantity: 0, revenue: 0 };
      map[catId].quantity += p.quantity;
      map[catId].revenue += p.revenue;
    });

    const totalRevenue = Object.values(map).reduce((sum, c) => sum + c.revenue, 0);

    return Object.entries(map)
      .map(([id, data]) => {
        const catInfo = COOK_CATEGORIES.find(c => c.id === id);
        return {
          id,
          label: catInfo?.label || 'სხვა',
          icon: catInfo?.icon || '🍽️',
          quantity: data.quantity,
          revenue: data.revenue,
          sharePercent: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [summary, dishes]);

  // Overall financial figures: totals come from the database, the cook split is applied to per-product totals
  const salesStats = useMemo(() => {
    const cook = calculateCookBreakdownFromProducts(summary.products, dishes, excludedCategories, {
      receipts: summary.noItemsReceipts,
      gross: summary.noItemsGross,
    });
    const avgCheck = summary.receipts > 0 ? (summary.net / summary.receipts).toFixed(2) : '0.00';

    return {
      totalGross: summary.gross,
      totalNet: summary.net,
      totalDiscount: summary.discount,
      totalCookGross: cook.cookGross,
      totalExcludedGross: cook.excludedGross,
      totalCookUnits: cook.cookUnits,
      totalExcludedUnits: cook.excludedUnits,
      totalUnits: cook.cookUnits + cook.excludedUnits,
      cookCommission: cook.cookCommission,
      avgCheck,
    };
  }, [summary, dishes, excludedCategories]);

  // Copy Summary text for report / messenger
  const handleCopyCookSummary = () => {
    const periodLabel = selectedPeriod === 'today' ? 'დღეს' :
      selectedPeriod === 'yesterday' ? 'გუშინ' :
      selectedPeriod === 'week' ? 'ბოლო 7 დღე' :
      selectedPeriod === 'month' ? 'მიმდინარე თვე' :
      selectedPeriod === 'last_month' ? 'წინა თვე' :
      selectedPeriod === 'custom' ? `${customStartDate} — ${customEndDate}` : 'ყველა დრო';

    const text = `FitFood ანგარიში (${periodLabel}):\n` +
      `- სრული გაყიდვები (ნომინალით): ${salesStats.totalGross.toFixed(2)} ₾\n` +
      `- ფაქტობრივი სალარო (ფასდაკლებით): ${salesStats.totalNet.toFixed(2)} ₾\n` +
      `- ფასდაკლებები / უფასო: -${salesStats.totalDiscount.toFixed(2)} ₾\n` +
      `---------------------------------\n` +
      `სამზარეულოს კერძები (მზარეულისთვის): ${salesStats.totalCookGross.toFixed(2)} ₾ (${salesStats.totalCookUnits} ულუფა)\n` +
      `გამორიცხულია (ყავა/სასმელები): ${salesStats.totalExcludedGross.toFixed(2)} ₾ (${salesStats.totalExcludedUnits} ცალი)\n` +
      `---------------------------------\n` +
      `მზარეულის 5% (კერძების სრული ფასიდან): ${salesStats.cookCommission.toFixed(2)} ₾`;

    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">გაყიდვები წერტილებში & მზარეულის ანგარიში</h1>
          <p className="admin-page-subtitle">
            სალაროს ჩეკები, ფასდაკლებები და მზარეულის 5%-იანი ანაზღაურება სამზარეულოს კერძებიდან (ყავისა და სასმელების გარეშე)
          </p>
        </div>
        <div className="admin-hero-actions">
          <button onClick={handleCopyCookSummary} className="admin-btn-secondary" title="დააკოპირეთ ანგარიში">
            {copiedSummary ? '✓ დაკოპირებულია!' : '📋 ანგარიშის კოპირება'}
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="admin-filters-bar" style={{ marginBottom: '12px', background: '#111827' }}>
        <div className="admin-filter-group">
          <span className="filter-group-label">პერიოდი:</span>
          <div className="admin-toggle-buttons">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`filter-toggle-btn ${selectedPeriod === 'today' ? 'active' : ''}`}
            >
              დღეს
            </button>
            <button
              onClick={() => setSelectedPeriod('yesterday')}
              className={`filter-toggle-btn ${selectedPeriod === 'yesterday' ? 'active' : ''}`}
            >
              გუშინ
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`filter-toggle-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            >
              7 დღე
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`filter-toggle-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            >
              მიმდინარე თვე
            </button>
            <button
              onClick={() => setSelectedPeriod('last_month')}
              className={`filter-toggle-btn ${selectedPeriod === 'last_month' ? 'active' : ''}`}
            >
              წინა თვე
            </button>
            <button
              onClick={() => setSelectedPeriod('custom')}
              className={`filter-toggle-btn ${selectedPeriod === 'custom' ? 'active' : ''}`}
            >
              📅 პერიოდი (თარიღით)
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`filter-toggle-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
            >
              ყველა დრო
            </button>
          </div>
        </div>

        {selectedPeriod === 'custom' && (
          <div className="admin-date-range-container">
            <span className="admin-date-range-label">დან:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="admin-date-input"
            />
            <span className="admin-date-range-label">მდე:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="admin-date-input"
            />
          </div>
        )}
      </div>

      {/* Category Exclusion Settings Bar */}
      <div className="admin-filters-bar" style={{ marginBottom: '16px', background: '#0F172A', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', color: '#FCD34D', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚙️</span> მზარეულის კატეგორიები (5% ერიცხება):
          </span>
          <div className="admin-category-chips">
            {COOK_CATEGORIES.map(cat => {
              const isExcluded = excludedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategoryExclusion(cat.id)}
                  className={`admin-category-chip ${isExcluded ? 'excluded' : 'active'}`}
                  title={isExcluded ? `დააჭირეთ ჩასართავად (${cat.label})` : `დააჭირეთ გამოსარიცხად (${cat.label})`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 800 }}>
                    {isExcluded ? '✕ გამორიცხულია' : '✓ ჩართულია'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-kpi-grid">
        {/* 1. COOK'S 5% COMMISSION */}
        <div className="admin-kpi-card card-cook">
          <div className="kpi-header">
            <span className="kpi-title" style={{ color: '#F59E0B' }}>👨‍🍳 მზარეულის 5% (სამზარეულოდან)</span>
            <span className="kpi-icon">⭐</span>
          </div>
          <div className="kpi-value text-amber">
            {salesStats.cookCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-footer-note" style={{ color: '#FCD34D' }}>
            5% კერძებიდან ({salesStats.totalCookGross.toFixed(0)} ₾ × 5%), ყავისა და სასმელების გარეშე
          </div>
        </div>

        {/* 2. Kitchen Dishes Nominal (for Cook) */}
        <div className="admin-kpi-card card-gross">
          <div className="kpi-header">
            <span className="kpi-title">სამზარეულოს კერძები (ნომინალი)</span>
            <span className="kpi-icon">🍳</span>
          </div>
          <div className="kpi-value text-purple">
            {salesStats.totalCookGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-sub-breakdown">
            <span>🍱 <b>{salesStats.totalCookUnits} ულუფა</b> მომზადებულია</span>
            <span>☕ ყავა/სასმელი: <b>{salesStats.totalExcludedGross.toFixed(2)} ₾</b> (გამორიცხულია)</span>
          </div>
        </div>

        {/* 3. Net collected revenue */}
        <div className="admin-kpi-card card-revenue">
          <div className="kpi-header">
            <span className="kpi-title">ფაქტობრივი სალარო (შემოსავალი)</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value text-success">
            {salesStats.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-footer-note">
            სრული ნომინალი: {salesStats.totalGross.toFixed(2)} ₾ (ყველა საქონელი)
          </div>
        </div>

        {/* 4. Discounts & Free */}
        <div className="admin-kpi-card card-discount">
          <div className="kpi-header">
            <span className="kpi-title">ფასდაკლებები & უფასო</span>
            <span className="kpi-icon">🎁</span>
          </div>
          <div className="kpi-value" style={{ color: '#F43F5E' }}>
            -{salesStats.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-footer-note">50% აქციები, დეგუსტაცია</div>
        </div>

        {/* 5. Units & Receipts */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">სულ გაყიდული პოზიციები</span>
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-value text-cyan">
            {salesStats.totalUnits} ცალი
          </div>
          <div className="kpi-footer-note">
            {summary.receipts} ჩეკი | საშუალო ჩეკი: <b>{salesStats.avgCheck} ₾</b>
          </div>
        </div>
      </div>

      {/* Explanatory Info Banner */}
      <div className="admin-info-banner">
        <span style={{ fontSize: '20px' }}>💡</span>
        <div>
          <b>კატეგორიების გამორიცხვა:</b> მზარეული იღებს 5%-ს მხოლოდ იმ კერძებიდან, რომელსაც თავად ამზადებს (<b>{salesStats.totalCookGross.toFixed(2)} ₾ × 5% = {salesStats.cookCommission.toFixed(2)} ₾</b>).
          სასმელები, ყავა და ჩაი (ჯამში <b>{salesStats.totalExcludedGross.toFixed(2)} ₾</b>) ავტომატურად <b>არ ერიცხება</b> მზარეულის ბონუსში.
        </div>
      </div>

      {/* Sales by Category Breakdown */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="admin-card-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> გაყიდვები კატეგორიების მიხედვით
            </h3>
            <p>რაოდენობა და შემოსავალი კერძების კატეგორიების მიხედვით არჩეულ პერიოდში</p>
          </div>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#9CA3AF' }}>
            არჩეულ პერიოდში გაყიდვები არ მოიძებნა.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>კატეგორია</th>
                  <th>გაყიდულია</th>
                  <th>შემოსავალი (ნომინალი)</th>
                  <th>წილი</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      <span style={{ marginRight: '6px' }}>{cat.icon}</span>
                      <b>{cat.label}</b>
                    </td>
                    <td>{cat.quantity} ცალი</td>
                    <td><b className="text-success">{cat.revenue.toFixed(2)} ₾</b></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-bg" style={{ width: '80px' }}>
                          <div className="progress-bar-fill" style={{ width: `${cat.sharePercent}%` }}></div>
                        </div>
                        <span style={{ fontSize: '12px' }}>{cat.sharePercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Secondary Filters Bar: Points & Payment Method */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <span className="filter-group-label">წერტილი:</span>
          <select
            value={selectedPointFilter}
            onChange={(e) => setSelectedPointFilter(e.target.value)}
            className="admin-select-input"
          >
            <option value="all">ყველა წერტილი ({points.length})</option>
            {points.map(pt => (
              <option key={pt.id} value={pt.id}>{pt.name.ka}</option>
            ))}
          </select>
        </div>

        <div className="admin-filter-group">
          <span className="filter-group-label">გადახდის მეთოდი:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="admin-select-input"
          >
            <option value="all">ყველა მეთოდი</option>
            <option value="card">💳 საბანკო ბარათი</option>
            <option value="cash">💵 ნაღდი ფული</option>
            <option value="split">⚡ გაყოფილი (ნაღდი + ბარათი)</option>
            <option value="free">🎁 უფასო / დეგუსტაცია</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>
          სულ პერიოდში: <b>{summary.receipts}</b> დასრულებული ჩეკი ({salesStats.totalUnits} პოზიცია)
        </div>
      </div>

      {loadError && (
        <div className="admin-info-banner" style={{ borderLeftColor: '#EF4444' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <b>მონაცემები ვერ ჩაიტვირთა.</b> თუ ეს პირველი გაშვებაა, Supabase SQL Editor-ში გაუშვით ფაილი{' '}
            <code>supabase/add_sales_summary_rpc.sql</code> (ერთხელ), შემდეგ განაახლეთ გვერდი.
          </div>
        </div>
      )}

      {/* Sales Receipts Table */}
      <div className="admin-card" style={{ opacity: isSummaryLoading || isPageLoading ? 0.85 : 1, transition: 'opacity 0.15s' }}>
        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ჩეკის #</th>
                <th>გაყიდვის წერტილი</th>
                <th>გაყიდული კერძები & რაოდენობა</th>
                <th>ნომინალი / სალარო</th>
                <th>👨‍🍳 მზარეული (5%)</th>
                <th>გადახდის ტიპი</th>
                <th>მოლარე / როლი</th>
                <th>თარიღი & დრო</th>
                <th>სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
                    {isPageLoading ? (
                      <div style={{ fontWeight: 700 }}>იტვირთება…</div>
                    ) : (
                      <>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>🧾</div>
                        <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '2px' }}>არჩეულ პერიოდში გაყიდვები არ მოიძებნა</div>
                        <div style={{ fontSize: '12px' }}>სცადეთ შეცვალოთ თარიღის ფილტრი ან გაყიდვის წერტილი.</div>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((sale) => {
                  const point = points.find(p => p.id === sale.pointId);
                  const isRefund = sale.status === 'refunded';
                  const origAmount = getSaleOriginalAmount(sale);
                  const discAmount = Number(sale.discountAmount) || Math.max(0, origAmount - sale.totalAmount);

                  // Calculate cook breakdown for this receipt
                  const saleBreakdown = Array.isArray(sale.items) && sale.items.length > 0
                    ? calculateSaleCookBreakdown(sale.items, dishes, excludedCategories)
                    : { cookGross: origAmount, excludedGross: 0, cookCommission: origAmount * 0.05 };

                  return (
                    <tr key={sale.id} className={isRefund ? 'table-row-refunded' : ''}>
                      <td>
                        <b style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{sale.receiptNumber}</b>
                      </td>

                      <td>
                        <b>{point ? point.name.ka : sale.pointId}</b>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{point?.address.ka}</div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {Array.isArray(sale.items) && sale.items.map((it, idx) => {
                            const isCook = isCookItem(it, dishes, excludedCategories);
                            const itemPrice = it.totalPrice || (it.pricePerUnit * it.quantity);
                            return (
                              <div key={idx} style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span title={isCook ? 'სამზარეულოს კერძი' : 'გამორიცხულია (ყავა/სასმელი)'}>
                                  {isCook ? '🍳' : '☕'}
                                </span>
                                <span>
                                  <b>{it.quantity}x</b> {it.productName} — <span style={{ color: '#94A3B8' }}>{itemPrice} ₾</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Amounts: Nominal vs Actual Net */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <b className="text-success" style={{ fontSize: '14px' }}>
                            {sale.totalAmount} ₾
                          </b>
                          {discAmount > 0 && (
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              <span style={{ textDecoration: 'line-through' }}>{origAmount.toFixed(2)} ₾</span>{' '}
                              <span style={{ color: '#F43F5E' }}>(-{discAmount.toFixed(2)} ₾)</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cook's 5% share (only on kitchen items) */}
                      <td>
                        {saleBreakdown.cookGross > 0 ? (
                          <span className="badge-cook">
                            👨‍🍳 +{saleBreakdown.cookCommission.toFixed(2)} ₾
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>
                            ☕ 0.00 ₾ (ყავა)
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`table-badge ${
                          sale.paymentMethod === 'card' ? 'badge-blue' :
                          sale.paymentMethod === 'cash' ? 'badge-green' : 'badge-purple'
                        }`}>
                          {sale.paymentMethod === 'card' ? '💳 ბარათი' :
                           sale.paymentMethod === 'cash' ? '💵 ნაღდი' :
                           sale.paymentMethod === 'split' ? '⚡ გაყოფილი' : '🎁 უფასო'}
                        </span>
                        {sale.splitDetails && (
                          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                            ბარათი: {sale.splitDetails.cardAmount}₾ | ნაღდი: {sale.splitDetails.cashAmount}₾
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '12px' }}>
                          {sale.sellerRole === 'manager' ? '💼 მენეჯერი' : '👤 მოლარე'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px' }}>
                          {new Date(sale.createdAt).toLocaleDateString('ka-GE')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {new Date(sale.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td>
                        <span className={`table-badge ${isRefund ? 'badge-red' : 'badge-green'}`}>
                          {isRefund ? 'დაბრუნებული' : '✓ დასრულებული'}
                        </span>
                        {sale.refundReason && (
                          <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '2px' }}>
                            {sale.refundReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={totalRows}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isLoading={isPageLoading}
        />
      </div>
    </div>
  );
};
