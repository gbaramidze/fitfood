'use client';

import React, { useMemo, useState } from 'react';
import { AdminDish } from '@/types/admin';
import { PartnerSale, PartnerPoint } from '@/types/partner';
import { computeDishDailySales, summarizeDishSales, computeDishSalesByPoint, DishDailySales } from '@/lib/dishSalesHelper';

interface AdminDishSalesModalProps {
  dish: AdminDish;
  sales: PartnerSale[];
  points: PartnerPoint[];
  onClose: () => void;
}

function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDateInput(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function formatShortLabel(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type RangePreset = 7 | 14 | 30 | 90 | 'custom';

const CHART_W = 640;
const CHART_H = 220;
const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 26;

export const AdminDishSalesModal: React.FC<AdminDishSalesModalProps> = ({ dish, sales, points, onClose }) => {
  const [preset, setPreset] = useState<RangePreset>(30);
  const [startStr, setStartStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return formatDateInput(d);
  });
  const [endStr, setEndStr] = useState<string>(() => formatDateInput(new Date()));
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const applyPreset = (days: Exclude<RangePreset, 'custom'>) => {
    setPreset(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setStartStr(formatDateInput(start));
    setEndStr(formatDateInput(end));
  };

  const startDate = useMemo(() => parseDateInput(startStr), [startStr]);
  const endDate = useMemo(() => parseDateInput(endStr), [endStr]);

  const series = useMemo(
    () => computeDishDailySales(sales, dish, startDate, endDate),
    [sales, dish, startDate, endDate]
  );

  const summary = useMemo(() => summarizeDishSales(series), [series]);

  const byPoint = useMemo(
    () => computeDishSalesByPoint(sales, points, dish, startDate, endDate),
    [sales, points, dish, startDate, endDate]
  );

  const dishName = dish.name?.ka || dish.name?.ru || dish.name?.en || 'კერძი';

  const maxQty = Math.max(1, ...series.map(d => d.quantity));
  const chartInnerW = CHART_W - PAD_L - PAD_R;
  const chartInnerH = CHART_H - PAD_T - PAD_B;
  const slotW = series.length > 0 ? chartInnerW / series.length : chartInnerW;
  const barW = Math.max(1, Math.min(28, slotW * 0.6));

  // Show at most ~8 x-axis labels regardless of range length, to avoid overlap.
  const labelEvery = Math.max(1, Math.ceil(series.length / 8));

  const hovered: DishDailySales | null = hoverIndex !== null ? series[hoverIndex] : null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-container modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div>
            <h2>📈 {dishName}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
              გაყიდვების დინამიკა არჩეულ პერიოდში — ყველა წერტილის ჯამში
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>

        {/* Range controls */}
        <div className="chart-range-bar">
          <div className="admin-toggle-buttons">
            <button className={`filter-toggle-btn ${preset === 7 ? 'active' : ''}`} onClick={() => applyPreset(7)}>7 დღე</button>
            <button className={`filter-toggle-btn ${preset === 14 ? 'active' : ''}`} onClick={() => applyPreset(14)}>14 დღე</button>
            <button className={`filter-toggle-btn ${preset === 30 ? 'active' : ''}`} onClick={() => applyPreset(30)}>30 დღე</button>
            <button className={`filter-toggle-btn ${preset === 90 ? 'active' : ''}`} onClick={() => applyPreset(90)}>90 დღე</button>
          </div>
          <div className="admin-date-range-container">
            <span className="admin-date-range-label">დან:</span>
            <input
              type="date"
              value={startStr}
              onChange={(e) => { setPreset('custom'); setStartStr(e.target.value); }}
              className="admin-date-input"
            />
            <span className="admin-date-range-label">მდე:</span>
            <input
              type="date"
              value={endStr}
              onChange={(e) => { setPreset('custom'); setEndStr(e.target.value); }}
              className="admin-date-input"
            />
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="chart-kpi-row">
          <div className="chart-kpi">
            <span className="chart-kpi-label">გაყიდული ულუფები</span>
            <span className="chart-kpi-value text-success">{summary.totalQuantity} ცალი</span>
          </div>
          <div className="chart-kpi">
            <span className="chart-kpi-label">შემოსავალი</span>
            <span className="chart-kpi-value">{summary.totalRevenue.toFixed(2)} ₾</span>
          </div>
          <div className="chart-kpi">
            <span className="chart-kpi-label">საშ. / დღეში</span>
            <span className="chart-kpi-value">{summary.avgPerDay.toFixed(1)} ცალი</span>
          </div>
          <div className="chart-kpi">
            <span className="chart-kpi-label">გაყიდვის დღეები</span>
            <span className="chart-kpi-value">{summary.daysWithSales} / {summary.daysInRange}</span>
          </div>
        </div>

        {/* Chart */}
        {series.length === 0 || summary.totalQuantity === 0 ? (
          <div className="chart-empty-state">
            ამ პერიოდში «{dishName}» საერთოდ არ გაყიდულა.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              width="100%"
              height={CHART_H}
              role="img"
              aria-label={`${dishName} — გაყიდვები დღეების მიხედვით`}
              style={{ overflow: 'visible' }}
            >
              {/* gridlines */}
              {[0, 0.5, 1].map(frac => {
                const y = PAD_T + chartInnerH * (1 - frac);
                return (
                  <g key={frac}>
                    <line x1={PAD_L} x2={CHART_W - PAD_R} y1={y} y2={y} stroke="#1F2937" strokeWidth={1} />
                    <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={9.5} fill="#6B7280">
                      {Math.round(maxQty * frac)}
                    </text>
                  </g>
                );
              })}

              {/* bars */}
              {series.map((d, i) => {
                const barH = (d.quantity / maxQty) * chartInnerH;
                const x = PAD_L + i * slotW + (slotW - barW) / 2;
                const y = PAD_T + (chartInnerH - barH);
                const isHovered = hoverIndex === i;
                const showLabel = i % labelEvery === 0 || i === series.length - 1;

                return (
                  <g
                    key={d.dateKey}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* wider invisible hit area for easier hover */}
                    <rect x={PAD_L + i * slotW} y={PAD_T} width={slotW} height={chartInnerH} fill="transparent" />
                    <rect
                      x={x}
                      y={d.quantity > 0 ? y : PAD_T + chartInnerH - 1}
                      width={barW}
                      height={d.quantity > 0 ? Math.max(2, barH) : 1}
                      rx={Math.min(3, barW / 2)}
                      fill={isHovered ? '#34D399' : '#10B981'}
                      opacity={d.quantity > 0 ? 1 : 0.25}
                    >
                      <title>{formatShortLabel(d.date)}: {d.quantity} ცალი, {d.revenue.toFixed(2)} ₾</title>
                    </rect>
                    {showLabel && (
                      <text
                        x={PAD_L + i * slotW + slotW / 2}
                        y={CHART_H - 6}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#6B7280"
                      >
                        {formatShortLabel(d.date)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* baseline */}
              <line x1={PAD_L} x2={CHART_W - PAD_R} y1={PAD_T + chartInnerH} y2={PAD_T + chartInnerH} stroke="#374151" strokeWidth={1} />
            </svg>

            <div className="chart-hover-info">
              {hovered ? (
                <>
                  <b>{hovered.date.toLocaleDateString('ka-GE')}</b>
                  <span>{hovered.quantity} ცალი</span>
                  <span>{hovered.revenue.toFixed(2)} ₾</span>
                </>
              ) : (
                <span style={{ color: '#6B7280' }}>გადაატარეთ მაუსი სვეტზე კონკრეტული დღის სანახავად</span>
              )}
            </div>
          </>
        )}

        {/* Breakdown by point (gym / location) */}
        {byPoint.length > 0 && (
          <div className="admin-table-responsive" style={{ marginTop: '18px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
              განაწილება წერტილების მიხედვით
            </div>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>წერტილი</th>
                  <th>რაოდენობა</th>
                  <th>შემოსავალი</th>
                  <th>წილი</th>
                </tr>
              </thead>
              <tbody>
                {byPoint.map(p => (
                  <tr key={p.pointId}>
                    <td><b>{p.pointName}</b></td>
                    <td><b className="text-success">{p.quantity} ცალი</b></td>
                    <td>{p.revenue.toFixed(2)} ₾</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-bg" style={{ width: '80px' }}>
                          <div className="progress-bar-fill" style={{ width: `${p.sharePercent}%` }}></div>
                        </div>
                        <span style={{ fontSize: '12px' }}>{p.sharePercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Data table */}
        {series.length > 0 && (
          <div className="admin-table-responsive" style={{ marginTop: '14px' }}>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>თარიღი</th>
                  <th>რაოდენობა</th>
                  <th>შემოსავალი</th>
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map(d => (
                  <tr key={d.dateKey}>
                    <td>{d.date.toLocaleDateString('ka-GE')}</td>
                    <td>{d.quantity > 0 ? <b>{d.quantity} ცალი</b> : <span style={{ color: '#6B7280' }}>0</span>}</td>
                    <td>{d.revenue > 0 ? `${d.revenue.toFixed(2)} ₾` : <span style={{ color: '#6B7280' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
