'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { PartnerSale } from '@/types/partner';
import { 
  COOK_CATEGORIES, 
  DEFAULT_EXCLUDED_CATEGORIES, 
  isCookItem, 
  calculateSaleCookBreakdown 
} from '@/lib/cookCommissionHelper';

type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom' | 'all';

export const AdminPosSalesHistory: React.FC = () => {
  const { sales, points, searchQuery, dishes } = useAdmin();

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

  // Helper for date filtering
  const filterByDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();

    if (selectedPeriod === 'today') {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (selectedPeriod === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return (
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate()
      );
    }
    if (selectedPeriod === 'week') {
      const diffMs = now.getTime() - d.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    if (selectedPeriod === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (selectedPeriod === 'last_month') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === prevMonthDate.getFullYear() && d.getMonth() === prevMonthDate.getMonth();
    }
    if (selectedPeriod === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (d < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    }
    return true; // 'all'
  };

  // Helper to get nominal original amount of a single sale
  const getSaleOriginalAmount = (s: PartnerSale): number => {
    if (Number(s.originalAmount) > 0) return Number(s.originalAmount);
    if (Array.isArray(s.items) && s.items.length > 0) {
      return s.items.reduce((sum, it) => sum + ((Number(it.pricePerUnit) || 16) * (Number(it.quantity) || 1)), 0);
    }
    return Number(s.totalAmount) || 0;
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // 1. Period filter
      if (!filterByDate(s.createdAt)) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = s.receiptNumber.toLowerCase().includes(q);
        const matchItems = Array.isArray(s.items) && s.items.some(it => it.productName.toLowerCase().includes(q));
        if (!matchNum && !matchItems) return false;
      }

      // 3. Point filter
      if (selectedPointFilter !== 'all' && s.pointId !== selectedPointFilter) return false;

      // 4. Payment method filter
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;

      return true;
    });
  }, [sales, selectedPeriod, customStartDate, customEndDate, searchQuery, selectedPointFilter, paymentFilter]);

  const completedSales = useMemo(() => {
    return filteredSales.filter(s => s.status === 'completed');
  }, [filteredSales]);

  // Overall Financial Calculations with Category Differentiation
  const salesStats = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalDiscount = 0;
    let totalCookGross = 0;
    let totalExcludedGross = 0;
    let totalCookUnits = 0;
    let totalExcludedUnits = 0;

    completedSales.forEach(s => {
      const orig = getSaleOriginalAmount(s);
      const net = Number(s.totalAmount) || 0;
      const disc = Number(s.discountAmount) > 0 ? Number(s.discountAmount) : Math.max(0, orig - net);

      totalGross += orig;
      totalNet += net;
      totalDiscount += disc;

      if (Array.isArray(s.items) && s.items.length > 0) {
        const breakdown = calculateSaleCookBreakdown(s.items, dishes, excludedCategories);
        totalCookGross += breakdown.cookGross;
        totalExcludedGross += breakdown.excludedGross;
        totalCookUnits += breakdown.cookUnits;
        totalExcludedUnits += breakdown.excludedUnits;
      } else {
        // Fallback if items array empty
        totalCookGross += orig;
        totalCookUnits += 1;
      }
    });

    const cookCommission = Math.round((totalCookGross * 0.05) * 100) / 100;
    const totalUnits = totalCookUnits + totalExcludedUnits;
    const avgCheck = completedSales.length > 0 ? (totalNet / completedSales.length).toFixed(2) : '0.00';

    return {
      totalGross,
      totalNet,
      totalDiscount,
      totalCookGross,
      totalExcludedGross,
      totalCookUnits,
      totalExcludedUnits,
      totalUnits,
      cookCommission,
      avgCheck,
    };
  }, [completedSales, dishes, excludedCategories]);

  // Copy Summary text for report / messenger
  const handleCopyCookSummary = () => {
    const periodLabel = selectedPeriod === 'today' ? 'დღეს' :
      selectedPeriod === 'yesterday' ? 'გუშინ' :
      selectedPeriod === 'week' ? 'ბოლო 7 დღე' :
      selectedPeriod === 'month' ? 'მიმდინარე თვე' :
      selectedPeriod === 'last_month' ? 'წინა თვე' :
      selectedPeriod === 'custom' ? `${customStartDate} — ${customEndDate}` : 'ყველა დრო';

    const text = `📊 FitFood ანგარიში (${periodLabel}):\n` +
      `• სრული გაყიდვები (ნომინალით): ${salesStats.totalGross.toFixed(2)} ₾\n` +
      `• ფაქტობრივი სალარო (ფასდაკლებით): ${salesStats.totalNet.toFixed(2)} ₾\n` +
      `• ფასდაკლებები / უფასო: -${salesStats.totalDiscount.toFixed(2)} ₾\n` +
      `---------------------------------\n` +
      `🍳 სამზარეულოს კერძები (მზარეულისთვის): ${salesStats.totalCookGross.toFixed(2)} ₾ (${salesStats.totalCookUnits} ულუფა)\n` +
      `☕ გამორიცხულია (ყავა/სასმელები): ${salesStats.totalExcludedGross.toFixed(2)} ₾ (${salesStats.totalExcludedUnits} ცალი)\n` +
      `---------------------------------\n` +
      `👨‍🍳 მზარეულის 5% (კერძების სრული ფასიდან): ${salesStats.cookCommission.toFixed(2)} ₾`;

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
            {completedSales.length} ჩეკი | საშუალო ჩეკი: <b>{salesStats.avgCheck} ₾</b>
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
          ჩვენება: <b>{completedSales.length}</b> ჩეკი ({salesStats.totalUnits} პოზიცია)
        </div>
      </div>

      {/* Sales Receipts Table */}
      <div className="admin-card">
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
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🧾</div>
                    <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '2px' }}>არჩეულ პერიოდში გაყიდვები არ მოიძებნა</div>
                    <div style={{ fontSize: '12px' }}>სცადეთ შეცვალოთ თარიღის ფილტრი ან გაყიდვის წერტილი.</div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
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
      </div>
    </div>
  );
};
