'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';

export const ManagerAnalyticsView: React.FC = () => {
  const { points, products, getPointStock, sales } = usePartner();
  const [selectedPointFilter, setSelectedPointFilter] = useState<string>('all'); // 'all' or pointId
  const [periodDays, setPeriodDays] = useState<number>(7);

  // Filter sales by period and point
  const now = new Date().getTime();
  const filteredSales = sales.filter(s => {
    if (s.status === 'refunded') return false;

    // Filter by point
    if (selectedPointFilter !== 'all' && s.pointId !== selectedPointFilter) {
      return false;
    }

    // Filter by period
    if (periodDays > 0) {
      const saleTime = new Date(s.createdAt).getTime();
      const diffDays = (now - saleTime) / (1000 * 60 * 60 * 24);
      if (diffDays > periodDays) return false;
    }

    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalUnitsSold = filteredSales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );

  let totalCardRevenue = 0;
  let totalCashRevenue = 0;

  filteredSales.forEach(s => {
    if (s.paymentMethod === 'card') {
      totalCardRevenue += s.totalAmount;
    } else if (s.paymentMethod === 'cash') {
      totalCashRevenue += s.totalAmount;
    } else if (s.paymentMethod === 'split' && s.splitDetails) {
      totalCashRevenue += s.splitDetails.cashAmount || 0;
      totalCardRevenue += s.splitDetails.cardAmount || 0;
    }
  });

  // Calculate statistics per point
  const pointStats = points.map(pt => {
    const ptSales = sales.filter(s => {
      if (s.status === 'refunded' || s.pointId !== pt.id) return false;
      if (periodDays > 0) {
        const saleTime = new Date(s.createdAt).getTime();
        const diffDays = (now - saleTime) / (1000 * 60 * 60 * 24);
        if (diffDays > periodDays) return false;
      }
      return true;
    });

    const ptRev = ptSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const ptUnits = ptSales.reduce((sum, s) => sum + s.items.reduce((is, it) => is + it.quantity, 0), 0);
    let ptCard = 0;
    let ptCash = 0;
    ptSales.forEach(s => {
      if (s.paymentMethod === 'card') ptCard += s.totalAmount;
      else if (s.paymentMethod === 'cash') ptCash += s.totalAmount;
      else if (s.paymentMethod === 'split' && s.splitDetails) {
        ptCash += s.splitDetails.cashAmount || 0;
        ptCard += s.splitDetails.cardAmount || 0;
      }
    });

    const ptStock = products.reduce((sum, p) => sum + getPointStock(pt.id, p.id), 0);

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

  const totalNetworkStock = points.reduce(
    (sum, pt) => sum + products.reduce((pSum, p) => pSum + getPointStock(pt.id, p.id), 0),
    0
  );

  // Top Selling Products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.totalPrice;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  return (
    <div className="partner-min-container">
      {/* Head & Point Filter */}
      <div className="partner-min-head" style={{ alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h2>Аналитика продаж & Сверка</h2>
          <p style={{ marginTop: '4px', color: '#94A3B8' }}>
            {selectedPointFilter === 'all'
              ? `Сводный отчет по всей сети (${points.length} точек)`
              : `${points.find(p => p.id === selectedPointFilter)?.name.ru} • ${points.find(p => p.id === selectedPointFilter)?.address.ru}`}
          </p>
        </div>

        {/* Point Filter Pills + Period */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {/* Point switcher */}
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
                {pt.name.ru}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="partner-min-periods">
            <button onClick={() => setPeriodDays(1)} className={`period-btn ${periodDays === 1 ? 'active' : ''}`}>Сегодня</button>
            <button onClick={() => setPeriodDays(7)} className={`period-btn ${periodDays === 7 ? 'active' : ''}`}>7 дней</button>
            <button onClick={() => setPeriodDays(30)} className={`period-btn ${periodDays === 30 ? 'active' : ''}`}>30 дней</button>
            <button onClick={() => setPeriodDays(0)} className={`period-btn ${periodDays === 0 ? 'active' : ''}`}>Все время</button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="partner-min-kpi-grid">
        <div className="partner-min-kpi highlight">
          <span className="label">
            {selectedPointFilter === 'all' ? 'Выручка всей сети' : 'Выручка точки'}
          </span>
          <strong className="value">{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾</strong>
          <span className="sub">{filteredSales.length} продаж за период</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">Продано рационов</span>
          <strong className="value">{totalUnitsSold} шт.</strong>
          <span className="sub">Без учета возвратов</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💳 Оплата картой</span>
          <strong className="value" style={{ color: '#60A5FA' }}>{totalCardRevenue.toFixed(2)} ₾</strong>
          <span className="sub">Терминал POS</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💵 Оплата наличными</span>
          <strong className="value" style={{ color: '#34D399' }}>{totalCashRevenue.toFixed(2)} ₾</strong>
          <span className="sub">Наличные средства</span>
        </div>
      </div>

      {/* Points Comparison Table */}
      <div className="partner-min-card" style={{ marginTop: '24px' }}>
        <div className="card-title-row">
          <h3 className="card-title">Сводка по точкам продаж</h3>
          <span className="stock-count-tag">
            {selectedPointFilter === 'all' ? `Всего на полках сети: ${totalNetworkStock} шт.` : `Остаток точки: ${pointStats.find(p => p.point.id === selectedPointFilter)?.currentStock} шт.`}
          </span>
        </div>

        <div className="partner-min-table-wrap">
          <table className="partner-min-table">
            <thead>
              <tr>
                <th>Точка продаж</th>
                <th>Продано (шт)</th>
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
                  <td>{totalUnitsSold} шт.</td>
                  <td>{totalRevenue.toFixed(2)} ₾</td>
                  <td style={{ color: '#60A5FA' }}>{totalCardRevenue.toFixed(2)} ₾</td>
                  <td style={{ color: '#34D399' }}>{totalCashRevenue.toFixed(2)} ₾</td>
                  <td style={{ textAlign: 'right' }}>{totalNetworkStock} шт.</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 2 Cols: Top items & Live stock matrix */}
      <div className="partner-min-grid-2col" style={{ marginTop: '24px' }}>
        {/* Top items */}
        <div className="partner-min-card">
          <h3 className="card-title">
            {selectedPointFilter === 'all' ? 'Топ продаж по всей сети' : 'Топ продаж выбранной точки'}
          </h3>

          {topProducts.length === 0 ? (
            <div className="partner-min-empty-card"><p>Продаж нет</p></div>
          ) : (
            <div className="partner-min-ranking">
              {topProducts.map((item, idx) => (
                <div key={idx} className="ranking-row">
                  <span className="rank">{idx + 1}</span>
                  <div className="name-wrap">
                    <span className="title">{item.name}</span>
                    <span className="units">{item.qty} шт.</span>
                  </div>
                  <strong className="sum">{item.revenue.toFixed(2)} ₾</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Stock Breakdown */}
        <div className="partner-min-card">
          <div className="card-title-row">
            <h3 className="card-title">
              {selectedPointFilter === 'all' ? 'Остатки рационов по сети' : 'Остатки на выбранной точке'}
            </h3>
          </div>

          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>Рацион</th>
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
                {products.map(prod => {
                  if (selectedPointFilter === 'all') {
                    const totalProdStock = points.reduce((sum, pt) => sum + getPointStock(pt.id, prod.id), 0);
                    return (
                      <tr key={prod.id}>
                        <td><strong>{prod.name.ru}</strong></td>
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
                        <td><strong>{prod.name.ru}</strong></td>
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
      </div>
    </div>
  );
};
