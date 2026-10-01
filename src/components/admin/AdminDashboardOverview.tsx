'use client';

import React from 'react';
import { useAdmin } from '@/context/AdminContext';

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
    programs,
    points,
    setActiveTab 
  } = useAdmin();

  const newOrders = incomingOrders.filter(o => o.status === 'new');
  const activeSubs = customers.filter(c => c.status === 'active');
  const recentSales = sales.slice(0, 5);

  return (
    <div className="admin-view-container">
      {/* Page Hero */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">მთავარი პანელი & ფინანსური მიმოხილვა</h1>
          <p className="admin-page-subtitle">
            საიტის აბონემენტების, წერტილების გაყიდვების, მომხმარებელთა მიწოდებისა და ხარჯების კონტროლი
          </p>
        </div>
        <div className="admin-hero-actions">
          <button onClick={() => setActiveTab('orders')} className="admin-btn-primary">
            📥 შემოსული შეკვეთები ({newOrders.length})
          </button>
          <button onClick={() => setActiveTab('customers')} className="admin-btn-secondary">
            👤 კლიენტები ({activeSubs.length})
          </button>
          <button onClick={() => setActiveTab('dishes')} className="admin-btn-secondary">
            + კერძის დამატება
          </button>
        </div>
      </div>

      {/* KPI Cards (Minimalist Luxury Palette) */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card card-revenue">
          <div className="kpi-header">
            <span className="kpi-title">ჯამური შემოსავალი</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value text-success">{totalRevenue.toLocaleString()} ₾</div>
          <div className="kpi-sub-breakdown">
            <span>🌐 საიტის აბონემენტები: <b>{siteRevenue.toLocaleString()} ₾</b></span>
            <span>🏢 დარბაზის წერტილები: <b>{posRevenue.toLocaleString()} ₾</b></span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">აქტიური აბონემენტები</span>
            <span className="kpi-icon">👤</span>
          </div>
          <div className="kpi-value">{activeSubs.length} კლიენტი</div>
          <div className="kpi-footer-note">ყოველდღიური მიწოდების რეჟიმში</div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">ხარჯები & ხელფასები</span>
            <span className="kpi-icon">💼</span>
          </div>
          <div className="kpi-value text-warning">{(totalExpenses + totalPayroll).toLocaleString()} ₾</div>
          <div className="kpi-footer-note">OpEx: {totalExpenses.toLocaleString()} ₾ • ფოტი: {totalPayroll.toLocaleString()} ₾</div>
        </div>

        <div className="admin-kpi-card card-profit">
          <div className="kpi-header">
            <span className="kpi-title">სუფთა მოგება (EBITDA)</span>
            <span className="kpi-icon">📈</span>
          </div>
          <div className={`kpi-value ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} ₾
          </div>
          <div className="kpi-footer-note">სუფთა მარჟა ყველა ხარჯის შემდეგ</div>
        </div>
      </div>

      {/* Grid: Live Incoming Leads (Left) & Recent POS Sales (Right) */}
      <div className="admin-grid-2col">
        {/* Left: New incoming website orders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>📥 ახალი შემოსული შეკვეთები (საიტი)</h3>
              <p>საიტიდან შემოსული ბოლო განაცხადები</p>
            </div>
            <button onClick={() => setActiveTab('orders')} className="admin-link-btn">
              ყველა შეკვეთა →
            </button>
          </div>

          <div className="admin-quick-leads-list">
            {incomingOrders.slice(0, 4).map((ord) => (
              <div key={ord.id} className="lead-row-item">
                <div>
                  <b>{ord.customerName}</b> • <span style={{ color: '#10B981' }}>{ord.phone}</span>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{ord.programTitle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b className="text-success">{ord.totalPriceGEL} ₾</b>
                  <div>
                    <span className={`status-pill ${ord.status === 'new' ? 'status-new' : 'status-confirmed'}`}>
                      {ord.status === 'new' ? 'ახალი' : 'დადასტურებული'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Point of Sale Live Receipts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>🧾 ბოლო გაყიდვები წერტილებში</h3>
              <p>Mega Gym, XXL, Fitness Academy-ის სალარო</p>
            </div>
            <button onClick={() => setActiveTab('sales')} className="admin-link-btn">
              ყველა ჩეკი →
            </button>
          </div>

          <div className="admin-quick-leads-list">
            {recentSales.map((sale) => {
              const pt = points.find(p => p.id === sale.pointId);

              return (
                <div key={sale.id} className="lead-row-item">
                  <div>
                    <b>#{sale.receiptNumber}</b> — {pt ? pt.name.ka : sale.pointId}
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {sale.items.map(it => `${it.quantity}x ${it.productName}`).join(', ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b className="text-success">{sale.totalAmount} ₾</b>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {sale.paymentMethod === 'card' ? '💳 ბარათი' : '💵 ნაღდი'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Demand & Diets Performance */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <div className="admin-card-header">
          <div>
            <h3>🥗 რაციონების პოპულარობა და მოთხოვნა</h3>
            <p>კლიენტების განაწილება კვების პროგრამების მიხედვით</p>
          </div>
          <button onClick={() => setActiveTab('programs')} className="admin-link-btn">
            რაციონების მართვა →
          </button>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>რაციონი</th>
                <th>კალორიულობა</th>
                <th>აქტიური კლიენტი</th>
                <th>მოთხოვნის წილი</th>
                <th>თვითღირებულება/დღე</th>
                <th>30 დღიანი ტარიფი</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog) => {
                const subsCount = customers.filter(c => 
                  c.status === 'active' && (
                    c.programId === prog.id ||
                    c.programTitle.toLowerCase().includes(prog.title.ka.toLowerCase()) ||
                    c.programTitle.toLowerCase().includes(prog.slug.toLowerCase())
                  )
                ).length;
                const totalActive = customers.filter(c => c.status === 'active').length;
                const sharePercent = totalActive > 0 ? Math.round((subsCount / totalActive) * 100) : 0;

                return (
                  <tr key={prog.id}>
                    <td><b>{prog.title.ka}</b></td>
                    <td>{prog.calorieRange}</td>
                    <td><b>{subsCount} ადამიანი</b></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-bg" style={{ width: '80px' }}>
                          <div className="progress-bar-fill" style={{ width: `${sharePercent}%` }}></div>
                        </div>
                        <span>{sharePercent}%</span>
                      </div>
                    </td>
                    <td className="text-warning">{prog.costPerDay || 0} ₾</td>
                    <td className="text-success"><b>{prog.prices.thirtyDays} ₾</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
