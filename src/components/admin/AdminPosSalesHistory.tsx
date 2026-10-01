'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

export const AdminPosSalesHistory: React.FC = () => {
  const { sales, points, searchQuery } = useAdmin();

  const [selectedPointFilter, setSelectedPointFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredSales = sales.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = s.receiptNumber.toLowerCase().includes(q);
      const matchItems = s.items.some(it => it.productName.toLowerCase().includes(q));
      if (!matchNum && !matchItems) return false;
    }

    if (selectedPointFilter !== 'all' && s.pointId !== selectedPointFilter) return false;
    if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;

    return true;
  });

  const totalSalesAmount = filteredSales
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const totalReceiptsCount = filteredSales.length;
  const avgCheck = totalReceiptsCount > 0 ? (totalSalesAmount / totalReceiptsCount).toFixed(1) : '0';

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">გაყიდვები წერტილებში (POS სალაროს ჩეკები)</h1>
          <p className="admin-page-subtitle">
            ყველა ფიტნეს-დარბაზისა და კაფის (Mega Gym, XXL, Fitness Academy) ცოცხალი გაყიდვების რეესტრი
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card card-revenue">
          <div className="kpi-header">
            <span className="kpi-title">წერტილების ჯამური შემოსავალი</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value text-success">{totalSalesAmount.toLocaleString()} ₾</div>
          <div className="kpi-footer-note">არჩეული ფილტრის მიხედვით</div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">სულ გაცემული ჩეკები</span>
            <span className="kpi-icon">🧾</span>
          </div>
          <div className="kpi-value">{totalReceiptsCount} ჩეკი</div>
          <div className="kpi-footer-note">ფიქსირებული ტრანზაქცია</div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">საშუალო ჩეკი</span>
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-value text-cyan">{avgCheck} ₾</div>
          <div className="kpi-footer-note">1 შეკვეთის საშუალო ღირებულება</div>
        </div>
      </div>

      {/* Filters Bar */}
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
                <th>თანხა (GEL)</th>
                <th>გადახდის ტიპი</th>
                <th>მოლარე / როლი</th>
                <th>თარიღი & დრო</th>
                <th>სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🧾</div>
                    <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '2px' }}>გაყიდვები ჯერ არ ფიქსირდება</div>
                    <div style={{ fontSize: '12px' }}>დარბაზის სალაროდან (POS ტერმინალი) გატარებული ჩეკები გამოჩნდება აქ.</div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const point = points.find(p => p.id === sale.pointId);
                  const isRefund = sale.status === 'refunded';

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
                        {sale.items.map((it, idx) => (
                          <div key={idx} style={{ fontSize: '12.5px' }}>
                            • <b>{it.quantity}x</b> {it.productName} — <span style={{ color: '#94A3B8' }}>{it.totalPrice} ₾</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>
                      <b className="text-success" style={{ fontSize: '14px' }}>{sale.totalAmount} ₾</b>
                      {sale.discountAmount > 0 && (
                        <div style={{ fontSize: '11px', color: '#F59E0B' }}>
                          ფასდაკლება: -{sale.discountAmount} ₾ ({sale.discountType})
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`table-badge ${
                        sale.paymentMethod === 'card' ? 'badge-blue' :
                        sale.paymentMethod === 'cash' ? 'badge-green' : 'badge-purple'
                      }`}>
                        {sale.paymentMethod === 'card' ? '💳 ბარათი' :
                         sale.paymentMethod === 'cash' ? '💵 ნაღდი' :
                         sale.paymentMethod === 'split' ? '⚡ გაყოფილი' : 'უფასო'}
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
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
