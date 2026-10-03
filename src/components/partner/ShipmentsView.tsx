'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';
import { LazyProductImage } from '@/components/partner/LazyProductImage';

export const ShipmentsView: React.FC = () => {
  const { currentPoint, shipments, getPointStock, products, createShipment, quickRestockPoint } = usePartner();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryNote, setDeliveryNote] = useState<string>('მიღება სამზარეულოდან');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentPoint) {
    return <div className="partner-min-empty"><p>წერტილი არ არის არჩეული</p></div>;
  }

  const pointShipments = shipments.filter(s => s.pointId === currentPoint.id);
  const totalStock = products.reduce((sum, p) => sum + getPointStock(currentPoint.id, p.id), 0);

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSetExactQty = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleQuickRestock = () => {
    const newShip = quickRestockPoint(currentPoint.id, 20);
    setSuccessMsg(`ვიტრინა შევსებულია! დაემატა +${newShip.totalUnits} ც. რაციონი (ზედნადები #${newShip.shipmentNumber})`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCustomReceive = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToSend = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (itemsToSend.length === 0) {
      alert('გთხოვთ მიუთითოთ რაოდენობა მინიმუმ ერთი რაციონისთვის');
      return;
    }

    const newShip = createShipment(currentPoint.id, itemsToSend, deliveryNote);
    setSuccessMsg(`მიღებულია +${newShip.totalUnits} ც. რაციონი (#${newShip.shipmentNumber})`);
    setQuantities({});
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const totalSelectedUnits = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="partner-min-container">
      {/* Header */}
      <div className="partner-min-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>📦 რაციონების მიღება და ნაშთები</h2>
          <p>{currentPoint.name?.ka || currentPoint.name?.ru} • ყველა მიღებული რაციონი ავტომატურად ირიცხება სალაროს ვიტრინაზე.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="partner-min-tag-stock" style={{ background: '#181B22', border: '1px solid #282E3A', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
            ნაშთი ვიტრინაზე: <strong style={{ color: '#10B981', fontSize: '15px' }}>{totalStock} ც.</strong>
          </div>

          <button
            onClick={handleQuickRestock}
            style={{
              background: '#13161C',
              border: '1px solid #10B981',
              color: '#10B981',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="სწრაფი შევსება: +20 ცალი თითოეულ რაციონზე"
          >
            ⚡ სწრაფი შევსება (+20 ც.)
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#10B981',
              border: 'none',
              color: '#000000',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + ახალი მიღება
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          color: '#10B981',
          padding: '12px 18px',
          borderRadius: '8px',
          margin: '16px 0',
          fontWeight: 600,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* Current Shelf Stock Breakdown */}
      <div className="partner-min-section" style={{ marginTop: '20px' }}>
        <h3 className="section-title" style={{ fontSize: '15px', color: '#E2E8F0', marginBottom: '12px' }}>
          📊 მიმდინარე ნაშთი ვიტრინაზე ({products.length} პოზიცია)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {products.map(prod => {
            const stock = getPointStock(currentPoint.id, prod.id);
            const isZero = stock <= 0;
            return (
              <div
                key={prod.id}
                style={{
                  background: '#13161C',
                  border: isZero ? '1px solid #DC2626' : '1px solid #282E3A',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <LazyProductImage
                    productId={prod.id}
                    alt={prod.name?.ka || 'კერძი'}
                    sizes="50px"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prod.name?.ka || prod.name?.ru || prod.name?.en}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    {prod.price} ₾ • {prod.calories} კკალ
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: isZero ? 'rgba(220, 38, 38, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    color: isZero ? '#EF4444' : '#10B981',
                  }}>
                    {isZero ? '0 ც.' : `${stock} ც.`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipments Journal Table */}
      <div className="partner-min-section">
        <h3 className="section-title">მიღებების ისტორია ({pointShipments.length})</h3>

        {pointShipments.length === 0 ? (
          <div className="partner-min-empty-card" style={{ padding: '40px 20px', textAlign: 'center', background: '#111318', borderRadius: '12px', border: '1px dashed #282E3A', color: '#64748B' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>მიღებები ჯერ არ არის დაფიქსირებული</p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#181B22',
                border: '1px solid #10B981',
                color: '#10B981',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + მიღების გაფორმება
            </button>
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

      {/* Modal: New Shipment Receiving Form */}
      {isModalOpen && (
        <div className="pos-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="pos-min-modal-card"
            style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #282E3A' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#FFFFFF' }}>📦 რაციონების მიღება სამზარეულოდან</h3>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{currentPoint.name?.ka}</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCustomReceive} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>მიუთითეთ მისაღები რაოდენობა:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const filled: Record<string, number> = {};
                      products.forEach(p => { filled[p.id] = 10; });
                      setQuantities(filled);
                    }}
                    style={{ background: '#1E232E', border: '1px solid #282E3A', color: '#10B981', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    ყველაზე +10 ც.
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {products.map(prod => {
                    const currentStock = getPointStock(currentPoint.id, prod.id);
                    const qty = quantities[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#13161C',
                          borderRadius: '8px',
                          border: qty > 0 ? '1px solid #10B981' : '1px solid #282E3A',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name?.ka || prod.name?.ru}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            ნაშთი ახლა: {currentStock} ც.
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, -5)}
                            style={{ width: '28px', height: '28px', background: '#1E232E', border: '1px solid #282E3A', color: '#FFFFFF', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, -1)}
                            style={{ width: '28px', height: '28px', background: '#1E232E', border: '1px solid #282E3A', color: '#FFFFFF', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty || ''}
                            placeholder="0"
                            onChange={e => handleSetExactQty(prod.id, parseInt(e.target.value) || 0)}
                            style={{ width: '48px', height: '28px', textAlign: 'center', background: '#0D0F12', border: '1px solid #282E3A', color: '#FFFFFF', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, 1)}
                            style={{ width: '28px', height: '28px', background: '#1E232E', border: '1px solid #282E3A', color: '#FFFFFF', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, 5)}
                            style={{ width: '28px', height: '28px', background: '#1E232E', border: '1px solid #282E3A', color: '#FFFFFF', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    კომენტარი / ზედნადების ნომერი:
                  </label>
                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={e => setDeliveryNote(e.target.value)}
                    placeholder="მაგ. დილის მიღება #12"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#13161C',
                      border: '1px solid #282E3A',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid #282E3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111318' }}>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                  სულ მისაღები: <strong style={{ color: '#10B981', fontSize: '15px' }}>{totalSelectedUnits} ც.</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: '#1E232E', border: '1px solid #282E3A', color: '#94A3B8', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={totalSelectedUnits === 0}
                    style={{
                      background: totalSelectedUnits === 0 ? '#282E3A' : '#10B981',
                      border: 'none',
                      color: totalSelectedUnits === 0 ? '#64748B' : '#000000',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: totalSelectedUnits === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    მიღების გაფორმება ({totalSelectedUnits} ც.)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

