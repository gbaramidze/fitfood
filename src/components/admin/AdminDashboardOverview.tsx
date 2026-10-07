'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { PartnerPoint } from '@/types/partner';

type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const AdminDashboardOverview: React.FC = () => {
  const { 
    totalRevenue, 
    siteRevenue, 
    posRevenue, 
    totalExpenses, 
    totalPayroll, 
    netProfit, 
    incomingOrders,
    customers,
    sales,
    dishes,
    programs,
    points,
    stocks,
    writeOffs,
    recordDayDelivery,
    convertOrderToSubscription,
    setActiveTab 
  } = useAdmin();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const GEORGIAN_MONTHS = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ];

  // Reference date (now)
  const now = useMemo(() => new Date(), []);
  const todayFormatted = useMemo(() => {
    return `${now.getDate()} ${GEORGIAN_MONTHS[now.getMonth()]} ${now.getFullYear()} წ.`;
  }, [now]);

  // Date filter helper
  const filterByDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

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
    return true; // 'all'
  };

  // Filtered Sales for selected period
  const periodSales = useMemo(() => {
    return sales.filter(s => filterByDate(s.createdAt));
  }, [sales, selectedPeriod]);

  // Filtered Incoming Orders for selected period
  const periodOrders = useMemo(() => {
    return incomingOrders.filter(o => filterByDate(o.createdAt));
  }, [incomingOrders, selectedPeriod]);

  // Completed POS Sales for period
  const completedPeriodSales = useMemo(() => {
    return periodSales.filter(s => s.status === 'completed');
  }, [periodSales]);

  // 1. POS Gyms Sales Today / Period
  const periodPosRevenue = useMemo(() => {
    return completedPeriodSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [completedPeriodSales]);

  // Portions sold in gyms today / period
  const periodPosUnitsSold = useMemo(() => {
    return completedPeriodSales.reduce((sum, s) => {
      const itemsQty = Array.isArray(s.items) 
        ? s.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)
        : 0;
      return sum + itemsQty;
    }, 0);
  }, [completedPeriodSales]);

  const periodReceiptsCount = completedPeriodSales.length;
  const periodAvgCheck = periodReceiptsCount > 0 ? (periodPosRevenue / periodReceiptsCount).toFixed(2) : '0.00';

  // 2. Website Orders Today / Period
  const newOrdersCount = periodOrders.filter(o => o.status === 'new').length;
  const periodSiteRevenue = useMemo(() => {
    return periodOrders
      .filter(o => o.status === 'confirmed' || o.status === 'completed')
      .reduce((sum, o) => sum + (Number(o.totalPriceGEL) || 0), 0);
  }, [periodOrders]);

  // Combined Total Revenue for Selected Period
  const periodTotalRevenue = periodPosRevenue + periodSiteRevenue;

  // 3. Active Subscribers & Portions Delivered
  const activeSubs = useMemo(() => {
    return customers.filter(c => c.status === 'active');
  }, [customers]);

  // Daily portions delivered to active clients today (avg 4 meals/day per active subscriber)
  const clientDeliveryPortionsToday = useMemo(() => {
    return activeSubs.reduce((sum, c) => {
      // 3-5 meals per day based on calories
      const mealsPerDay = c.calories >= 2200 ? 5 : c.calories >= 1500 ? 4 : 3;
      return sum + mealsPerDay;
    }, 0);
  }, [activeSubs]);

  // Total portions delivered + sold today
  const totalPortionsServedToday = periodPosUnitsSold + clientDeliveryPortionsToday;

  // 4. Food Cost & Gross Margin for Period
  const periodFoodCost = useMemo(() => {
    return completedPeriodSales.reduce((sum, s) => {
      if (!Array.isArray(s.items)) return sum;
      const saleCost = s.items.reduce((costSum, it) => {
        const dish = dishes.find(d => d.id === it.productId || (typeof d.name === 'object' && d.name.ka === it.productName));
        const itemCost = dish ? dish.costPrice : ((it.pricePerUnit || 16) * 0.45);
        return costSum + (itemCost * (it.quantity || 1));
      }, 0);
      return sum + saleCost;
    }, 0);
  }, [completedPeriodSales, dishes]);

  const periodGrossMargin = periodPosRevenue - periodFoodCost;
  const periodMarginPercent = periodPosRevenue > 0 ? Math.round((periodGrossMargin / periodPosRevenue) * 100) : 0;

  // 5. Sales Breakdown by Gym Points (Mega Gym, XXL, Fitness Academy, etc.)
  const venueStats = useMemo(() => {
    return points.map(pt => {
      const ptSales = completedPeriodSales.filter(s => s.pointId === pt.id);
      const ptRevenue = ptSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      const ptUnits = ptSales.reduce((sum, s) => {
        return sum + (Array.isArray(s.items) ? s.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0) : 0);
      }, 0);
      const ptReceipts = ptSales.length;
      const ptAvgCheck = ptReceipts > 0 ? (ptRevenue / ptReceipts).toFixed(1) : '0.0';

      const cardSales = ptSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      const cashSales = ptSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      const splitSales = ptSales.filter(s => s.paymentMethod === 'split').reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

      // Current live stock in this gym
      const ptStockMap = stocks[pt.id] || {};
      const totalStockOnShelf = Object.values(ptStockMap).reduce((a, b) => a + (Number(b) || 0), 0);

      const sharePercent = periodPosRevenue > 0 ? Math.round((ptRevenue / periodPosRevenue) * 100) : 0;

      return {
        point: pt,
        revenue: ptRevenue,
        unitsSold: ptUnits,
        receiptsCount: ptReceipts,
        avgCheck: ptAvgCheck,
        cardSales,
        cashSales,
        splitSales,
        shelfStock: totalStockOnShelf,
        sharePercent,
      };
    });
  }, [points, completedPeriodSales, stocks, periodPosRevenue]);

  // 6. Top Selling Dishes in Gyms Today
  const topSoldDishes = useMemo(() => {
    const dishMap: Record<string, { name: string; category: string; quantity: number; revenue: number; image?: string }> = {};

    completedPeriodSales.forEach(sale => {
      if (!Array.isArray(sale.items)) return;
      sale.items.forEach(it => {
        const dish = dishes.find(d => d.id === it.productId || (typeof d.name === 'object' && d.name.ka === it.productName));
        const key = it.productId || it.productName;
        const nameStr = dish ? (typeof dish.name === 'object' ? (dish.name.ka || dish.name.ru || dish.name.en) : dish.name) : it.productName;
        const catStr = dish ? dish.category : 'poultry';
        const imgStr = dish ? dish.image : undefined;

        if (!dishMap[key]) {
          dishMap[key] = {
            name: nameStr,
            category: catStr,
            quantity: 0,
            revenue: 0,
            image: imgStr,
          };
        }
        dishMap[key].quantity += (Number(it.quantity) || 1);
        dishMap[key].revenue += (Number(it.totalPrice) || (Number(it.pricePerUnit) * Number(it.quantity)) || 0);
      });
    });

    return Object.values(dishMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [completedPeriodSales, dishes]);

  // 7. Recent Receipts Feed (Live)
  const recentReceipts = useMemo(() => {
    return periodSales.slice(0, 6);
  }, [periodSales]);

  // Quick order activation handler
  const handleQuickConfirmOrder = (orderId: string, clientName: string) => {
    convertOrderToSubscription(orderId);
    setSuccessNotice(`შეკვეთა დადასტურებულია! «${clientName}» გადატანილია აქტიურ აბონემენტებში.`);
    setTimeout(() => setSuccessNotice(null), 4500);
  };

  return (
    <div className="admin-view-container">
      {/* Page Hero & Live Status */}
      <div className="admin-page-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>დღევანდელი გაყიდვები & სრული ანალიტიკა</h1>
            <span className="admin-alert-chip" style={{ fontSize: '11px', padding: '3px 10px' }}>
              <span className="alert-dot"></span> Live რეჟიმი
            </span>
          </div>
          <p className="admin-page-subtitle">
            დარბაზების ცოცხალი გაყიდვები (Mega Gym, XXL, Fitness Academy), საიტის ონლაინ განაცხადები და საკურიერო მიწოდება
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="admin-hero-actions">
          <button onClick={() => setActiveTab('orders')} className="admin-btn-primary">
            📥 ახალი შეკვეთები ({incomingOrders.filter(o => o.status === 'new').length})
          </button>
          <button onClick={() => setActiveTab('customers')} className="admin-btn-secondary">
            👤 კლიენტები ({activeSubs.length})
          </button>
          <button onClick={() => setActiveTab('sales')} className="admin-btn-secondary">
            🧾 სალაროს ჩეკები
          </button>
          <button onClick={() => setActiveTab('writeoffs')} className="admin-btn-secondary" style={{ color: '#F87171' }}>
            🗑️ ჩამოწერა ({writeOffs.length})
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="admin-alert-banner alert-success" style={{ marginBottom: '16px' }}>
          <span>✓ {successNotice}</span>
        </div>
      )}

      {/* Period Filter Tabs */}
      <div className="admin-filters-bar" style={{ marginBottom: '16px', background: '#111827' }}>
        <div className="admin-filter-group">
          <span className="filter-group-label">პერიოდი:</span>
          <div className="admin-toggle-buttons">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`filter-toggle-btn ${selectedPeriod === 'today' ? 'active' : ''}`}
            >
              დღეს (Live)
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
              ბოლო 7 დღე
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`filter-toggle-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            >
              მიმდინარე თვე
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`filter-toggle-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
            >
              ყველა დრო
            </button>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
          📅 {selectedPeriod === 'today' ? `დღეს: ${todayFormatted}` : `ფილტრი: ${selectedPeriod}`}
        </div>
      </div>

      {/* KPI Stats Grid for Selected Period */}
      <div className="admin-kpi-grid">
        {/* 1. Total Revenue Today */}
        <div className="admin-kpi-card card-revenue">
          <div className="kpi-header">
            <span className="kpi-title">{selectedPeriod === 'today' ? 'დღევანდელი ჯამური გაყიდვები' : 'ჯამური შემოსავალი'}</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value text-success">
            {periodTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-sub-breakdown">
            <span>🏢 დარბაზები: <b>{periodPosRevenue.toFixed(2)} ₾</b></span>
            <span>🌐 საიტი: <b>{periodSiteRevenue.toFixed(2)} ₾</b></span>
          </div>
        </div>

        {/* 2. Gym / POS Sales Today */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">დარბაზების გაყიდვები ({selectedPeriod === 'today' ? 'დღეს' : 'პერიოდი'})</span>
            <span className="kpi-icon">🏢</span>
          </div>
          <div className="kpi-value text-cyan" style={{ color: '#38BDF8' }}>
            {periodPosRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-sub-breakdown">
            <span>🍱 <b>{periodPosUnitsSold} ულუფა</b> გაყიდულია</span>
            <span>🧾 <b>{periodReceiptsCount} ჩეკი</b> (საშ. {periodAvgCheck} ₾)</span>
          </div>
        </div>

        {/* 3. New Website Orders */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">ახალი განაცხადები (საიტი)</span>
            <span className="kpi-icon">📥</span>
          </div>
          <div className="kpi-value" style={{ color: newOrdersCount > 0 ? '#10B981' : '#F9FAFB' }}>
            {newOrdersCount} განაცხადი
          </div>
          <div className="kpi-footer-note">
            საიტიდან შემოსული ონლაინ შეკვეთები
          </div>
        </div>

        {/* 4. Active Clients */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">აქტიური კლიენტები</span>
            <span className="kpi-icon">👤</span>
          </div>
          <div className="kpi-value">{activeSubs.length} კლიენტი</div>
          <div className="kpi-footer-note">
            ყოველდღიური კვების რეჟიმში
          </div>
        </div>

        {/* 5. Sold / Delivered to Clients Today */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">{selectedPeriod === 'today' ? 'დღეს გაცემული ულუფები' : 'სულ გაცემული ულუფები'}</span>
            <span className="kpi-icon">🍱</span>
          </div>
          <div className="kpi-value" style={{ color: '#F59E0B' }}>
            {totalPortionsServedToday} ულუფა
          </div>
          <div className="kpi-sub-breakdown">
            <span>🛵 კლიენტების მიწოდება: <b>{clientDeliveryPortionsToday} ულუფა</b></span>
            <span>🏢 დარბაზების ვიტრინა: <b>{periodPosUnitsSold} ულუფა</b></span>
          </div>
        </div>

        {/* 6. Food Cost Margin */}
        <div className="admin-kpi-card card-profit">
          <div className="kpi-header">
            <span className="kpi-title">სუფთა მარჟა (Food Cost-ის შემდეგ)</span>
            <span className="kpi-icon">📈</span>
          </div>
          <div className="kpi-value text-success">
            +{periodGrossMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾
          </div>
          <div className="kpi-footer-note">
            სავაჭრო მარჟა: <b>{periodMarginPercent}%</b> (თვითღირებ.: {periodFoodCost.toFixed(2)} ₾)
          </div>
        </div>
      </div>

      {/* Sales by Gym / Point Breakdown (Mega Gym, XXL, Fitness Academy) */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="admin-card-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏢</span> გაყიდვები დარბაზების მიხედვით ({selectedPeriod === 'today' ? 'დღეს' : 'არჩეული პერიოდი'})
            </h3>
            <p>Mega Gym, XXL, Fitness Academy — სალაროს რეალური შემოსავალი, გაყიდული ულუფები და დარჩენილი ნაშთი</p>
          </div>
          <button onClick={() => setActiveTab('sales')} className="admin-link-btn">
            ყველა სალაროს ჩეკი →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {venueStats.map((item) => {
            const pointName = typeof item.point.name === 'object' ? item.point.name.ka : item.point.name;
            const pointAddr = typeof item.point.address === 'object' ? item.point.address.ka : item.point.address;

            return (
              <div 
                key={item.point.id} 
                style={{
                  background: '#162032',
                  border: '1px solid #1F2937',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderTop: item.revenue > 0 ? '3px solid #10B981' : '3px solid #374151',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <b style={{ fontSize: '15px', color: '#F9FAFB' }}>{pointName}</b>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>📍 {pointAddr}</div>
                  </div>
                  <span className={`table-badge ${item.revenue > 0 ? 'badge-green' : 'badge-blue'}`}>
                    {item.revenue > 0 ? '● გაყიდვები აქტიურია' : 'მოლოდინში'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid #1F2937' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block' }}>შემოსავალი ({selectedPeriod === 'today' ? 'დღეს' : 'პერიოდი'}):</span>
                    <b style={{ fontSize: '20px', color: '#10B981' }}>
                      {item.revenue.toFixed(2)} ₾
                    </b>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block' }}>გაყიდული ულუფა:</span>
                    <b style={{ fontSize: '16px', color: '#F9FAFB' }}>{item.unitsSold} ცალი</b>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ background: '#111827', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '10.5px' }}>ჩეკების რაოდენობა:</div>
                    <b>{item.receiptsCount} ჩეკი</b> (საშ. {item.avgCheck} ₾)
                  </div>
                  <div style={{ background: '#111827', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '10.5px' }}>ნაშთი ვიტრინაზე:</div>
                    <b style={{ color: item.shelfStock > 0 ? '#38BDF8' : '#EF4444' }}>{item.shelfStock} ულუფა</b>
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1F2937', paddingTop: '8px' }}>
                  <span>💳 ბარათით: <b style={{ color: '#F9FAFB' }}>{item.cardSales.toFixed(1)} ₾</b></span>
                  <span>💵 ნაღდით: <b style={{ color: '#F9FAFB' }}>{item.cashSales.toFixed(1)} ₾</b></span>
                </div>

                {/* Progress bar of sales share */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>
                    <span>წილი გაყიდვებში:</span>
                    <b>{item.sharePercent}%</b>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${item.sharePercent}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid 2 Columns: Live Website Leads & Live POS Receipts Feed */}
      <div className="admin-grid-2col" style={{ marginBottom: '20px' }}>
        {/* Left: Incoming Website Orders Today */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>📥 ახალი შემოსული შეკვეთები (საიტი)</h3>
              <p>fitnessfood.ge-დან შემოსული ონლაინ განაცხადები</p>
            </div>
            <button onClick={() => setActiveTab('orders')} className="admin-link-btn">
              ყველა შეკვეთა ({incomingOrders.length}) →
            </button>
          </div>

          <div className="admin-quick-leads-list">
            {incomingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#9CA3AF' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📥</div>
                <div style={{ color: '#F9FAFB', fontWeight: 600 }}>ახალი შეკვეთები არ არის</div>
                <div style={{ fontSize: '11.5px' }}>საიტიდან განხორციელებული ონლაინ შეკვეთები გამოჩნდება აქ.</div>
              </div>
            ) : (
              incomingOrders.slice(0, 4).map((ord) => {
                const isNew = ord.status === 'new';

                return (
                  <div key={ord.id} className="lead-row-item" style={{ borderLeft: isNew ? '3px solid #10B981' : '3px solid #374151' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b style={{ color: '#F9FAFB' }}>{ord.customerName}</b>
                        <a href={`tel:${ord.phone}`} style={{ color: '#10B981', fontSize: '12px', textDecoration: 'none' }}>
                          {ord.phone}
                        </a>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                        🥗 {ord.programTitle} • 📍 {ord.address || ord.zone}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {ord.deliverySlot} • {new Date(ord.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <b className="text-success" style={{ fontSize: '15px' }}>{ord.totalPriceGEL} ₾</b>
                      {isNew ? (
                        <button
                          onClick={() => handleQuickConfirmOrder(ord.id, ord.customerName)}
                          className="admin-btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                        >
                          + აბონემენტის გახსნა
                        </button>
                      ) : (
                        <span className="status-pill status-confirmed">✓ დადასტურებული</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Receipts in Gym Points */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>🧾 ბოლო გაყიდვები დარბაზებში ({selectedPeriod === 'today' ? 'დღეს' : 'პერიოდი'})</h3>
              <p>Mega Gym, XXL, Fitness Academy-ის ცოცხალი სალარო</p>
            </div>
            <button onClick={() => setActiveTab('sales')} className="admin-link-btn">
              ყველა ჩეკი ({sales.length}) →
            </button>
          </div>

          <div className="admin-quick-leads-list">
            {recentReceipts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#9CA3AF' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🧾</div>
                <div style={{ color: '#F9FAFB', fontWeight: 600 }}>გაყიდვები ჯერ არ ფიქსირდება</div>
                <div style={{ fontSize: '11.5px' }}>დარბაზის ტერმინალიდან გატარებული ჩეკები გამოჩნდება აქ.</div>
              </div>
            ) : (
              recentReceipts.map((sale) => {
                const pt = points.find(p => p.id === sale.pointId);
                const ptName = pt ? (typeof pt.name === 'object' ? pt.name.ka : pt.name) : sale.pointId;
                const itemsText = Array.isArray(sale.items)
                  ? sale.items.map(it => `${it.quantity}x ${it.productName}`).join(', ')
                  : '—';
                const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : '—';

                return (
                  <div key={sale.id} className="lead-row-item">
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ fontFamily: 'monospace', color: '#38BDF8' }}>#{sale.receiptNumber || sale.id.slice(-4)}</b>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>• {timeStr}</span>
                        <span className="table-badge badge-blue" style={{ fontSize: '10.5px' }}>{ptName}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '3px', lineHeight: '1.3' }}>
                        {itemsText}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b className="text-success" style={{ fontSize: '15px' }}>
                        {(Number(sale.totalAmount) || 0).toFixed(2)} ₾
                      </b>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        {sale.paymentMethod === 'card' ? '💳 ბარათი' : sale.paymentMethod === 'cash' ? '💵 ნაღდი' : '⚡ გაყოფილი'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Dishes & Categories Today */}
      {topSoldDishes.length > 0 && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header">
            <div>
              <h3>🥗 დღის ყველაზე გაყიდვადი კერძები დარბაზებში</h3>
              <p>მოთხოვნადი პოზიციები, გაყიდული ულუფების რაოდენობა და შემოსავალი</p>
            </div>
            <button onClick={() => setActiveTab('dishes')} className="admin-link-btn">
              კერძების მართვა →
            </button>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>კერძის დასახელება</th>
                  <th>კატეგორია</th>
                  <th>გაყიდულია ({selectedPeriod === 'today' ? 'დღეს' : 'პერიოდი'})</th>
                  <th>ჯამური შემოსავალი</th>
                  <th>მოთხოვნის წილი</th>
                </tr>
              </thead>
              <tbody>
                {topSoldDishes.map((dish, idx) => {
                  const share = periodPosUnitsSold > 0 ? Math.round((dish.quantity / periodPosUnitsSold) * 100) : 0;

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 800, color: idx === 0 ? '#F59E0B' : '#9CA3AF' }}>#{idx + 1}</td>
                      <td>
                        <b>{dish.name}</b>
                      </td>
                      <td>
                        <span className="table-badge badge-blue">{dish.category}</span>
                      </td>
                      <td>
                        <b style={{ fontSize: '14px', color: '#F9FAFB' }}>{dish.quantity} ცალი</b>
                      </td>
                      <td>
                        <b className="text-success">{dish.revenue.toFixed(2)} ₾</b>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-bar-bg" style={{ width: '80px' }}>
                            <div className="progress-bar-fill" style={{ width: `${share}%` }}></div>
                          </div>
                          <span style={{ fontSize: '12px' }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Subscription Delivery Dispatch for Today */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>🛵 დღევანდელი საკურიერო მიწოდება კლიენტებზე (ბათუმი)</h3>
            <p>აქტიური აბონემენტები, მიტანის დროის სლოტები, მისამართები და ყოველდღიური აღრიცხვა</p>
          </div>
          <button onClick={() => setActiveTab('customers')} className="admin-link-btn">
            კლიენტების CRM ბაზა ({customers.length}) →
          </button>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>კლიენტი & ტელეფონი</th>
                <th>მისამართი & ზონა</th>
                <th>რაციონი</th>
                <th>მიწოდების სლოტი</th>
                <th>დღეების ბალანსი</th>
                <th>სტატუსი</th>
                <th>დღევანდელი მიტანა</th>
              </tr>
            </thead>
            <tbody>
              {activeSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px 16px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>👤</div>
                    <div style={{ color: '#F9FAFB', fontWeight: 600 }}>აქტიური კლიენტები არ არიან</div>
                    <div style={{ fontSize: '12px' }}>დააჭირეთ «შემოსული შეკვეთები»-ს ან დაამატეთ ახალი აბონემენტი.</div>
                  </td>
                </tr>
              ) : (
                activeSubs.slice(0, 5).map((cust) => {
                  const percentDone = Math.round((cust.deliveredDays / (cust.totalDays || 1)) * 100);

                  return (
                    <tr key={cust.id}>
                      <td>
                        <b>{cust.clientName}</b>
                        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '2px' }}>
                          <a href={`tel:${cust.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {cust.phone}
                          </a>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px' }}>📍 {cust.address}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cust.zone}</div>
                      </td>

                      <td>
                        <b>{cust.programTitle}</b>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cust.calories} კკალ</div>
                      </td>

                      <td>
                        <span className="table-badge badge-blue">
                          {cust.deliverySlot === 'morning' ? '🌅 დილა 06:00-08:00' : '🌙 საღამო'}
                        </span>
                      </td>

                      <td>
                        <div style={{ minWidth: '130px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                            <span>მიტანილია: <b>{cust.deliveredDays}</b></span>
                            <span>დარჩა: <b className="text-success">{cust.remainingDays} დღე</b></span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${percentDone}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="table-badge badge-green">● აქტიური</span>
                      </td>

                      <td>
                        {cust.remainingDays > 0 ? (
                          <button
                            onClick={() => {
                              if (confirm(`დაფიქსირდეს დღევანდელი მიწოდება კლიენტისთვის «${cust.clientName}»?`)) {
                                recordDayDelivery(cust.id);
                              }
                            }}
                            className="admin-btn-primary"
                            style={{ padding: '5px 10px', fontSize: '11.5px' }}
                          >
                            +1 დღის ჩათვლა
                          </button>
                        ) : (
                          <span className="table-badge badge-green">✓ დასრულდა</span>
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
