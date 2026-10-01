'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';

export const AdminHqView: React.FC<{ activeSubtab?: string }> = ({ activeSubtab = 'admin-hq' }) => {
  const {
    points,
    products,
    shipments,
    sales,
    getPointStock,
    createShipment,
    addNewPoint,
  } = usePartner();

  const [selectedPointId, setSelectedPointId] = useState<string>(points[0]?.id || '');
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'prod-chicken-quinoa': 30,
    'prod-tuna-steak': 20,
  });
  const [deliveryNote, setDeliveryNote] = useState<string>('Свежая утренняя партия');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New point modal state
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [newPointName, setNewPointName] = useState('');
  const [newPointAddress, setNewPointAddress] = useState('');
  const [newPointCommission, setNewPointCommission] = useState(20);
  const [newPointCashierPin, setNewPointCashierPin] = useState('4444');
  const [newPointManagerPin, setNewPointManagerPin] = useState('8888');

  const handleQtyChange = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSendShipment = (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToSend = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (itemsToSend.length === 0) {
      alert('Укажите количество хотя бы для одного рациона');
      return;
    }

    const newShip = createShipment(selectedPointId, itemsToSend, deliveryNote);
    const targetPoint = points.find(p => p.id === selectedPointId);

    setSuccessMsg(
      `Партия #${newShip.shipmentNumber} (${newShip.totalUnits} шт.) отправлена на точку «${targetPoint?.name.ru}».`
    );

    setQuantities({});
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleCreatePoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPointName.trim()) return;

    addNewPoint({
      name: { ru: newPointName, ka: newPointName, en: newPointName },
      city: 'Batumi',
      address: { ru: newPointAddress, ka: newPointAddress, en: newPointAddress },
      cashierPin: newPointCashierPin,
      managerPin: newPointManagerPin,
      commissionPercent: newPointCommission,
      phone: '+995 555 00 00 00',
      status: 'active',
    });

    setIsAddPointModalOpen(false);
    setNewPointName('');
    setNewPointAddress('');
  };

  const totalAllUnitsSelected = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="partner-min-container">
      <div className="partner-min-head">
        <div>
          <h2>Склад FitFood & Управление сетью</h2>
          <p>Формирование поставок и сверка расчетов по всем точкам продаж</p>
        </div>

        <button onClick={() => setIsAddPointModalOpen(true)} className="partner-min-btn-primary">
          + Добавить точку
        </button>
      </div>

      {successMsg && (
        <div className="partner-min-alert">
          <span>✓ {successMsg}</span>
        </div>
      )}

      <div className="partner-min-grid-2col">
        {/* Send Shipment Form */}
        <div className="partner-min-card">
          <h3 className="card-title">Отправить партию на точку</h3>

          <form onSubmit={handleSendShipment} className="partner-min-form">
            <div className="form-group">
              <label>Точка назначения:</label>
              <select
                value={selectedPointId}
                onChange={e => setSelectedPointId(e.target.value)}
                className="partner-min-input"
              >
                {points.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name.ru} ({p.address.ru})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Количество к отправке:</label>
              <div className="min-hq-items-list">
                {products.map(prod => {
                  const qty = quantities[prod.id] || 0;
                  return (
                    <div key={prod.id} className="min-hq-item-row">
                      <div className="min-hq-item-name">
                        <strong>{prod.name.ru}</strong>
                        <span>{prod.price} ₾</span>
                      </div>

                      <div className="min-hq-qty-stepper">
                        <button type="button" onClick={() => handleQtyChange(prod.id, qty - 5)}>-5</button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={e => handleQtyChange(prod.id, parseInt(e.target.value) || 0)}
                        />
                        <button type="button" onClick={() => handleQtyChange(prod.id, qty + 5)}>+5</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Инструкция для курьера:</label>
              <input
                type="text"
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
                className="partner-min-input"
              />
            </div>

            <button
              type="submit"
              disabled={totalAllUnitsSelected === 0}
              className="partner-min-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              Отправить на точку ({totalAllUnitsSelected} шт.)
            </button>
          </form>
        </div>

        {/* Network Settlements Summary */}
        <div className="partner-min-card">
          <h3 className="card-title">Сводка по точкам</h3>

          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>Точка</th>
                  <th>Витрина</th>
                  <th>Продано</th>
                  <th>Выручка</th>
                  <th style={{ textAlign: 'right' }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {points.map(pt => {
                  const ptSales = sales.filter(s => s.pointId === pt.id && s.status !== 'refunded');
                  const rev = ptSales.reduce((sum, s) => sum + s.totalAmount, 0);
                  const soldUnits = ptSales.reduce(
                    (sum, s) => sum + s.items.reduce((iS, it) => iS + it.quantity, 0),
                    0
                  );
                  const stockTotal = products.reduce(
                    (sum, p) => sum + getPointStock(pt.id, p.id),
                    0
                  );

                  return (
                    <tr key={pt.id}>
                      <td>
                        <strong>{pt.name.ru}</strong>
                        <div className="sub-text">{pt.address.ru}</div>
                      </td>
                      <td><strong>{stockTotal} шт.</strong></td>
                      <td>{soldUnits} шт.</td>
                      <td><strong style={{ color: '#FFFFFF' }}>{rev.toFixed(2)} ₾</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge-ok">Активна</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Последние отправленные партии ({shipments.length})
            </h4>
            <div className="min-hq-timeline">
              {shipments.map(s => {
                const pt = points.find(p => p.id === s.pointId);
                return (
                  <div key={s.id} className="timeline-row">
                    <div>
                      <strong>#{s.shipmentNumber}</strong> ➔ {pt?.name.ru} ({s.totalUnits} шт.)
                    </div>
                    <span className={s.status === 'pending' ? 'badge-wait' : 'badge-ok'}>
                      {s.status === 'pending' ? 'В пути' : 'Принято'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Point Modal */}
      {isAddPointModalOpen && (
        <div className="pos-modal-overlay" onClick={() => setIsAddPointModalOpen(false)}>
          <div className="pos-min-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Добавить точку продаж</h3>
              <button onClick={() => setIsAddPointModalOpen(false)} className="close-btn">✕</button>
            </div>

            <form onSubmit={handleCreatePoint} className="partner-min-form">
              <div className="form-group">
                <label>Название точки:</label>
                <input
                  type="text"
                  required
                  placeholder="Batumi Arena Gym"
                  value={newPointName}
                  onChange={e => setNewPointName(e.target.value)}
                  className="partner-min-input"
                />
              </div>

              <div className="form-group">
                <label>Адрес:</label>
                <input
                  type="text"
                  required
                  placeholder="ул. Чавчавадзе 10"
                  value={newPointAddress}
                  onChange={e => setNewPointAddress(e.target.value)}
                  className="partner-min-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Комиссия (%):</label>
                  <input
                    type="number"
                    value={newPointCommission}
                    onChange={e => setNewPointCommission(parseInt(e.target.value) || 0)}
                    className="partner-min-input"
                  />
                </div>
                <div className="form-group">
                  <label>PIN кассира:</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPointCashierPin}
                    onChange={e => setNewPointCashierPin(e.target.value)}
                    className="partner-min-input"
                  />
                </div>
              </div>

              <button type="submit" className="partner-min-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Создать точку
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
