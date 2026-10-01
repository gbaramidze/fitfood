'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';

export const WriteOffView: React.FC = () => {
  const { currentPoint, products, getPointStock, createWriteOff, writeOffs } = usePartner();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<'expired' | 'damaged' | 'sample' | 'other'>('expired');
  const [note, setNote] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentPoint) {
    return <div className="partner-min-empty"><p>Точка не выбрана</p></div>;
  }

  const pointWriteOffs = writeOffs.filter(w => w.pointId === currentPoint.id);
  const currentStock = getPointStock(currentPoint.id, selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) return;
    if (quantity > currentStock) {
      alert(`В наличии всего ${currentStock} шт.`);
      return;
    }

    const ok = createWriteOff(currentPoint.id, selectedProductId, quantity, reason, note);
    if (ok) {
      const prod = products.find(p => p.id === selectedProductId);
      setSuccessMsg(`Списание ${quantity} шт. «${prod?.name.ru}» выполнено.`);
      setQuantity(1);
      setNote('');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="partner-min-container">
      <div className="partner-min-head">
        <div>
          <h2>Списание рационов</h2>
          <p>{currentPoint.name.ru} • Контроль срока реализации 72ч</p>
        </div>
      </div>

      {successMsg && (
        <div className="partner-min-alert">
          <span>✓ {successMsg}</span>
        </div>
      )}

      <div className="partner-min-grid-2col">
        {/* Form */}
        <div className="partner-min-card">
          <h3 className="card-title">Оформить списание</h3>

          <form onSubmit={handleSubmit} className="partner-min-form">
            <div className="form-group">
              <label>Рацион:</label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="partner-min-input"
              >
                {products.map(p => {
                  const stock = getPointStock(currentPoint.id, p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name.ru} (Остаток: {stock} шт.)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Количество (шт.):</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, currentStock)}
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="partner-min-input"
                />
              </div>

              <div className="form-group">
                <label>Причина:</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value as any)}
                  className="partner-min-input"
                >
                  <option value="expired">Срок годности (72ч)</option>
                  <option value="damaged">Брак упаковки</option>
                  <option value="sample">Дегустация</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Примечание (опционально):</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Причина списания..."
                className="partner-min-input"
              />
            </div>

            <button
              type="submit"
              disabled={currentStock <= 0}
              className="partner-min-danger-btn"
            >
              {currentStock <= 0 ? 'Нет на остатке' : `Списать ${quantity} шт.`}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="partner-min-card">
          <h3 className="card-title">Журнал списаний ({pointWriteOffs.length})</h3>

          {pointWriteOffs.length === 0 ? (
            <div className="partner-min-empty-card">
              <p>Списаний нет</p>
            </div>
          ) : (
            <div className="partner-min-table-wrap">
              <table className="partner-min-table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Рацион</th>
                    <th>Кол-во</th>
                    <th>Причина</th>
                  </tr>
                </thead>
                <tbody>
                  {pointWriteOffs.map(w => (
                    <tr key={w.id}>
                      <td>{new Date(w.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                      <td><strong>{w.productName}</strong></td>
                      <td><span className="qty-minus">-{w.quantity}</span></td>
                      <td>{w.reasonText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
