'use client';

import React, { useMemo, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { computeSalesForecast, getTomorrow, PointForecast, ForecastItem } from '@/lib/salesForecastHelper';

function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
];

function formatLongDateKa(d: Date, weekdayLabel: string): string {
  return `${weekdayLabel}, ${d.getDate()} ${MONTHS_KA[d.getMonth()]}`;
}

export const AdminSalesForecast: React.FC = () => {
  const { sales, points, dishes, preorders } = useAdmin();
  const [targetDateStr, setTargetDateStr] = useState<string>(() => formatDateInput(getTomorrow()));
  const [copiedPointId, setCopiedPointId] = useState<string | null>(null);

  const targetDate = useMemo(() => {
    const [y, m, d] = targetDateStr.split('-').map(Number);
    const dt = new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }, [targetDateStr]);

  const forecast = useMemo(
    () => computeSalesForecast(sales, points, dishes, targetDate, preorders),
    [sales, points, dishes, targetDate, preorders]
  );

  const pointsWithData = forecast.points.filter(p => p.items.length > 0);
  const grandTotalUnits = pointsWithData.reduce((sum, p) => sum + p.totalUnitsToPrepare, 0);
  const grandTotalPreorderUnits = pointsWithData.reduce((sum, p) => sum + p.totalPreorderUnits, 0);
  const lowConfidencePointsCount = pointsWithData.filter(p => p.usingFallback).length;

  const handleSetTomorrow = () => setTargetDateStr(formatDateInput(getTomorrow()));

  const handleCopyPointList = (point: PointForecast) => {
    const lines = [
      `მომზადების გეგმა — ${point.pointName} (${targetDate.toLocaleDateString('ka-GE')})`,
      ...point.items.map(it => {
        const total = it.recommendedQuantity + it.preorderQuantity;
        return it.preorderQuantity > 0
          ? `${it.productName} — ${total} ცალი (მათ შორის ${it.preorderQuantity} წინასწარი შეკვეთით)`
          : `${it.productName} — ${total} ცალი`;
      }),
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedPointId(point.pointId);
    setTimeout(() => setCopiedPointId(null), 2500);
  };

  const trendBadge = (item: ForecastItem) => {
    if (item.trend === 'growth') {
      return <span className="forecast-trend-badge trend-up">⬆ +{item.trendPercent}%</span>;
    }
    if (item.trend === 'decline') {
      return <span className="forecast-trend-badge trend-down">⬇ {item.trendPercent}%</span>;
    }
    return <span className="forecast-trend-badge trend-flat">→ სტაბილური</span>;
  };

  const confidenceLabel = (c: ForecastItem['confidence']) => {
    if (c === 'high') return <span className="forecast-confidence conf-high">სანდო</span>;
    if (c === 'medium') return <span className="forecast-confidence conf-medium">საშუალო</span>;
    return <span className="forecast-confidence conf-low">დაბალი</span>;
  };

  return (
    <div className="admin-view-container">
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">🔮 გაყიდვების პროგნოზი & მომზადების გეგმა</h1>
          <p className="admin-page-subtitle">
            წინა კვირების იმავე დღის გაყიდვებზე დაყრდნობით (ზრდის/კლების ტენდენციის გათვალისწინებით) —
            რამდენი ულუფა მოამზადოთ შერჩეული დღისთვის, ობიექტების მიხედვით
          </p>
        </div>
        <div className="admin-hero-actions">
          <button onClick={handleSetTomorrow} className="admin-btn-secondary">📅 ხვალისთვის</button>
          <input
            type="date"
            value={targetDateStr}
            onChange={(e) => setTargetDateStr(e.target.value)}
            className="admin-date-input"
          />
        </div>
      </div>

      <div className="admin-info-banner">
        <span style={{ fontSize: '20px' }}>📆</span>
        <div>
          საპროგნოზო დღე: <b>{formatLongDateKa(targetDate, forecast.weekdayLabel)}</b>.
          {' '}გამოთვლილია ამ კვირის დღის ბოლო ჩეკებზე დაყრდნობით (ბოლო რამდენიმე კვირა); როცა ამ დღისთვის ისტორია საკმარისი არ არის,
          გამოყენებულია ბოლო დღეების საერთო საშუალო — ასეთი შემთხვევები მონიშნულია როგორც <b>&quot;დაბალი&quot;</b> სანდოობის პროგნოზი.
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card card-revenue">
          <div className="kpi-header">
            <span className="kpi-title">სულ მოსამზადებელი ულუფები</span>
            <span className="kpi-icon">🍱</span>
          </div>
          <div className="kpi-value text-success">{grandTotalUnits} ცალი</div>
          <div className="kpi-footer-note">
            პროგნოზი + წინასწარი შეკვეთები, ყველა აქტიურ ობიექტზე ჯამში
          </div>
        </div>

        {grandTotalPreorderUnits > 0 && (
          <div className="admin-kpi-card" style={{ borderColor: 'rgba(236, 72, 153, 0.35)' }}>
            <div className="kpi-header">
              <span className="kpi-title" style={{ color: '#EC4899' }}>📝 წინასწარი შეკვეთებით</span>
              <span className="kpi-icon">🏷️</span>
            </div>
            <div className="kpi-value" style={{ color: '#EC4899' }}>{grandTotalPreorderUnits} ცალი</div>
            <div className="kpi-footer-note">გადახდილია ავანსად, გარანტირებულია</div>
          </div>
        )}

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">ანალიზირებული ობიექტები</span>
            <span className="kpi-icon">🏢</span>
          </div>
          <div className="kpi-value" style={{ color: '#67E8F9' }}>{pointsWithData.length} / {forecast.points.length}</div>
          <div className="kpi-footer-note">ობიექტები, სადაც მონაცემი მოიძებნა</div>
        </div>

        {lowConfidencePointsCount > 0 && (
          <div className="admin-kpi-card card-discount">
            <div className="kpi-header">
              <span className="kpi-title">დაბალი სანდოობის ობიექტები</span>
              <span className="kpi-icon">⚠️</span>
            </div>
            <div className="kpi-value" style={{ color: '#F59E0B' }}>{lowConfidencePointsCount}</div>
            <div className="kpi-footer-note">ჯერ არ არის საკმარისი ისტორია ამ დღისთვის</div>
          </div>
        )}
      </div>

      {pointsWithData.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔮</div>
          <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '4px' }}>
            პროგნოზისთვის საკმარისი გაყიდვების ისტორია არ არის
          </div>
          <div style={{ fontSize: '13px' }}>
            დაელოდეთ რამდენიმე დღე-კვირას გაყიდვების დაგროვებას, რათა სისტემამ შეძლოს ტენდენციის გამოთვლა.
          </div>
        </div>
      ) : (
        pointsWithData.map(point => (
          <div key={point.pointId} className="admin-card" style={{ marginBottom: '20px' }}>
            <div className="admin-card-header">
              <div>
                <h3>🏢 {point.pointName}</h3>
                <p>
                  {point.pointAddress}
                  {point.usingFallback && ' • დაბალი სანდოობის პროგნოზი (არასაკმარისი ისტორია ამ დღისთვის)'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="admin-header-stats-pill">სულ: <b>{point.totalUnitsToPrepare} ცალი</b></span>
                {point.totalPreorderUnits > 0 && (
                  <span className="admin-header-stats-pill" style={{ color: '#EC4899' }}>
                    📝 წინასწარი: <b>{point.totalPreorderUnits} ცალი</b>
                  </span>
                )}
                <button onClick={() => handleCopyPointList(point)} className="admin-btn-secondary">
                  {copiedPointId === point.pointId ? '✓ დაკოპირდა!' : '📋 სიის კოპირება'}
                </button>
              </div>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>კერძი / პროდუქტი</th>
                    <th>საშ. გაყიდვა (დღეში)</th>
                    <th>ტენდენცია</th>
                    <th>სანდოობა</th>
                    <th>წინასწარი შეკვეთა</th>
                    <th>მოამზადეთ</th>
                  </tr>
                </thead>
                <tbody>
                  {point.items.map(item => (
                    <tr key={item.key}>
                      <td><span style={{ marginRight: '6px' }}>{item.categoryIcon}</span><b>{item.productName}</b></td>
                      <td>{item.avgQuantity} ცალი</td>
                      <td>{trendBadge(item)}</td>
                      <td>
                        {confidenceLabel(item.confidence)}{' '}
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>({item.dataPoints} დღე)</span>
                      </td>
                      <td>
                        {item.preorderQuantity > 0 ? (
                          <span style={{ color: '#EC4899', fontWeight: 700 }}>📝 {item.preorderQuantity} ცალი</span>
                        ) : (
                          <span style={{ color: '#6B7280' }}>—</span>
                        )}
                      </td>
                      <td><b className="text-success" style={{ fontSize: '15px' }}>{item.recommendedQuantity + item.preorderQuantity} ცალი</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
