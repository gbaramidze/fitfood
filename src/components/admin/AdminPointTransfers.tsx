'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

export const AdminPointTransfers: React.FC = () => {
  const { 
    points, 
    dishes, 
    transfers, 
    stocks, 
    createTransfer, 
    updatePointStock,
    updateProductPrices 
  } = useAdmin();

  const [selectedPointId, setSelectedPointId] = useState<string>(points[0]?.id || '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [transferNote, setTransferNote] = useState<string>('დილის ახალი პარტია დარბაზის ვიტრინისთვის');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [newRetailPrice, setNewRetailPrice] = useState<number>(15);

  const posDishes = dishes.filter(d => d.targetChannels.includes('pos'));

  const handleQtyChange = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSendTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToSend = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (itemsToSend.length === 0) {
      alert('გთხოვთ მიუთითოთ რაოდენობა გადასატანად');
      return;
    }

    const newTr = createTransfer(selectedPointId, itemsToSend, transferNote);
    const targetPoint = points.find(p => p.id === selectedPointId);

    setSuccessMsg(
      `პარტია #${newTr.transferNumber} (${newTr.totalUnits} ცალი, ${newTr.totalRetail} ₾) წარმატებით გაიგზავნა წერტილზე «${targetPoint?.name.ka}»!`
    );

    setQuantities({});
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const totalUnitsSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalCostSelected = Object.entries(quantities).reduce((acc, [pId, q]) => {
    const dish = dishes.find(d => d.id === pId);
    return acc + (dish ? dish.costPrice * q : 0);
  }, 0);
  const totalRetailSelected = Object.entries(quantities).reduce((acc, [pId, q]) => {
    const dish = dishes.find(d => d.id === pId);
    return acc + (dish ? dish.retailPrice * q : 0);
  }, 0);

  const selectedPoint = points.find(p => p.id === selectedPointId);
  const pointStocks = stocks[selectedPointId] || {};

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">ლოჯისტიკა & გადაზიდვა წერტილებზე</h1>
          <p className="admin-page-subtitle">
            ცენტრალური სამზარეულოდან კერძების გადატანა დარბაზების ვიტრინებში (Mega Gym, XXL, Fitness Academy) და ნაშთების კონტროლი
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="admin-alert-banner alert-success">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {/* Grid: Dispatcher & Shelf Stocks */}
      <div className="admin-grid-2col">
        {/* Left: Dispatch Batch */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>🚚 გადაზიდვის ზედნადების შექმნა</h3>
              <p>პარტიის გაგზავნა ფიტნეს-კლუბში</p>
            </div>
          </div>

          <form onSubmit={handleSendTransfer}>
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">დანიშნულების წერტილი</label>
                <select
                  value={selectedPointId}
                  onChange={(e) => setSelectedPointId(e.target.value)}
                  className="admin-select-input"
                >
                  {points.map(pt => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name.ka} — {pt.address.ka}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-transfer-picker-list">
              <label className="form-section-title">აირჩიეთ კერძები და რაოდენობა (ცალი):</label>
              {posDishes.map((dish) => {
                const currentQty = quantities[dish.id] || 0;
                const currentShelf = pointStocks[dish.id] || 0;

                return (
                  <div key={dish.id} className="transfer-picker-item">
                    <div className="picker-dish-info">
                      <b>{dish.name.ka}</b>
                      <span className="picker-sub">
                        {dish.macros.weightGrams}გ • {dish.macros.calories} კკალ • ნაშთი: <b>{currentShelf} ც</b>
                      </span>
                    </div>

                    <div className="picker-pricing">
                      <span className="picker-retail">{dish.retailPrice} ₾</span>
                      <span className="picker-cost">თვითღ. {dish.costPrice} ₾</span>
                    </div>

                    <div className="picker-stepper">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(dish.id, currentQty - 5)}
                        className="stepper-btn"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(dish.id, currentQty - 1)}
                        className="stepper-btn"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={currentQty || ''}
                        placeholder="0"
                        onChange={(e) => handleQtyChange(dish.id, parseInt(e.target.value) || 0)}
                        className="stepper-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(dish.id, currentQty + 1)}
                        className="stepper-btn"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(dish.id, currentQty + 5)}
                        className="stepper-btn"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-row" style={{ marginTop: '14px' }}>
              <div className="form-col full-width">
                <label className="form-label">ზედნადების შენიშვნა / მძღოლი</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="admin-input"
                />
              </div>
            </div>

            <div className="transfer-summary-box">
              <div className="summary-item">
                <span className="sum-lbl">სულ გადასატანი:</span>
                <span className="sum-val"><b>{totalUnitsSelected} ცალი</b></span>
              </div>
              <div className="summary-item">
                <span className="sum-lbl">თვითღირებულება:</span>
                <span className="sum-val text-warning"><b>{totalCostSelected.toFixed(1)} ₾</b></span>
              </div>
              <div className="summary-item">
                <span className="sum-lbl">სავარაუდო შემოსავალი:</span>
                <span className="sum-val text-success"><b>{totalRetailSelected.toFixed(1)} ₾</b></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={totalUnitsSelected === 0}
              className="admin-btn-primary"
              style={{ width: '100%', marginTop: '14px', padding: '12px' }}
            >
              🚀 პარტიის გადაზიდვა ({totalUnitsSelected} ცალი)
            </button>
          </form>
        </div>

        {/* Right: Shelf stock inspector */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>🏪 ნაშთები და ფასები: {selectedPoint?.name.ka}</h3>
              <p>მაცივარში არსებული მზა ულუფები</p>
            </div>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>კერძი</th>
                  <th>ნაშთი</th>
                  <th>ფასი</th>
                  <th>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {posDishes.map((dish) => {
                  const stock = pointStocks[dish.id] || 0;
                  const isEditing = editingPriceProductId === dish.id;

                  return (
                    <tr key={dish.id}>
                      <td>
                        <b>{dish.name.ka}</b>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{dish.macros.calories} კკალ • {dish.macros.weightGrams}გ</div>
                      </td>
                      <td>
                        <div className="shelf-stock-control">
                          <button
                            onClick={() => updatePointStock(selectedPointId, dish.id, stock - 1)}
                            className="stock-mini-btn"
                          >
                            -
                          </button>
                          <span className={`stock-count-badge ${stock === 0 ? 'stock-zero' : stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                            {stock} ცალი
                          </span>
                          <button
                            onClick={() => updatePointStock(selectedPointId, dish.id, stock + 1)}
                            className="stock-mini-btn"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              step="0.5"
                              value={newRetailPrice}
                              onChange={(e) => setNewRetailPrice(Number(e.target.value))}
                              style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #10B981', background: '#111827', color: '#fff' }}
                            />
                            <button
                              onClick={() => {
                                updateProductPrices(dish.id, newRetailPrice);
                                setEditingPriceProductId(null);
                              }}
                              className="stock-mini-btn"
                              style={{ background: '#10B981', color: '#fff' }}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <b className="text-success">{dish.retailPrice.toFixed(1)} ₾</b>
                            <button
                              onClick={() => {
                                setEditingPriceProductId(dish.id);
                                setNewRetailPrice(dish.retailPrice);
                              }}
                              className="btn-text-small"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            const add = prompt(`რამდენი ცალი «${dish.name.ka}» დაემატოს თაროზე?`, '10');
                            if (add && !isNaN(Number(add))) {
                              updatePointStock(selectedPointId, dish.id, stock + Number(add));
                            }
                          }}
                          className="admin-mini-btn"
                        >
                          + შევსება
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transfers History */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <div className="admin-card-header">
          <div>
            <h3>📋 გადაზიდვების ისტორია</h3>
            <p>გაგზავნილი ზედნადებების რეესტრი</p>
          </div>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ზედნადების #</th>
                <th>წერტილი</th>
                <th>ერთეული</th>
                <th>თვითღირებულება</th>
                <th>ღირებულება როზნიცაში</th>
                <th>სტატუსი</th>
                <th>მძღოლი / თარიღი</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => (
                <tr key={tr.id}>
                  <td><b>#{tr.transferNumber}</b></td>
                  <td>{tr.pointName}</td>
                  <td><b>{tr.totalUnits} ცალი</b></td>
                  <td className="text-warning">{tr.totalCost.toFixed(1)} ₾</td>
                  <td className="text-success"><b>{tr.totalRetail.toFixed(1)} ₾</b></td>
                  <td>
                    <span className="table-badge badge-green">
                      {tr.status === 'received' ? '✓ ჩაბარებულია' : '🚚 გზაშია'}
                    </span>
                  </td>
                  <td>
                    <div>{tr.driverName || 'კურიერი'}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(tr.dispatchedAt).toLocaleString('ka-GE')}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
