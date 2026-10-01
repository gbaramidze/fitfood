'use client';

import React from 'react';
import { usePartner } from '@/context/PartnerContext';

export const ShipmentsView: React.FC = () => {
  const { currentPoint, shipments, getPointStock, products } = usePartner();

  if (!currentPoint) {
    return <div className="partner-min-empty"><p>წერტილი არ არის არჩეული</p></div>;
  }

  const pointShipments = shipments.filter(s => s.pointId === currentPoint.id);
  const totalStock = products.reduce((sum, p) => sum + getPointStock(currentPoint.id, p.id), 0);

  return (
    <div className="partner-min-container">
      {/* Header */}
      <div className="partner-min-head">
        <div>
          <h2>📦 რაციონების მიღება სამზარეულოდან</h2>
          <p>{currentPoint.name.ka} • ყველა გაგზავნილი რაციონი ირიცხება ავტომატურად.</p>
        </div>

        <div className="partner-min-tag-stock" style={{ background: '#181B22', border: '1px solid #282E3A', padding: '6px 14px', borderRadius: '8px', fontSize: '13px' }}>
          ნაშთი ვიტრინაზე: <strong style={{ color: '#10B981' }}>{totalStock} ც.</strong>
        </div>
      </div>

      {/* Shipments Journal */}
      <div className="partner-min-section">
        <h3 className="section-title">მიღებების ჟურნალი ({pointShipments.length})</h3>

        {pointShipments.length === 0 ? (
          <div className="partner-min-empty-card">
            <p>მიღებები ჯერ არ არის</p>
          </div>
        ) : (
          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>ზედნადები</th>
                  <th>თარიღი და დრო</th>
                  <th>რაოდენობა</th>
                  <th>შემადგენლობა</th>
                  <th>სტატუსი</th>
                </tr>
              </thead>
              <tbody>
                {pointShipments.map(ship => (
                  <tr key={ship.id}>
                    <td><strong>#{ship.shipmentNumber}</strong></td>
                    <td>{new Date(ship.createdAt).toLocaleString('ka-GE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td><strong style={{ color: '#10B981' }}>+{ship.totalUnits} ც.</strong></td>
                    <td>
                      <div className="ship-chips">
                        {ship.items.map((it, i) => (
                          <span key={i} className="chip">{it.productName}: <strong>{it.quantity} ც.</strong></span>
                        ))}
                      </div>
                      {ship.note && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>💬 {ship.note}</div>}
                    </td>
                    <td>
                      <span className="badge-ok">✓ მიღებულია</span>
                    </td>
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
