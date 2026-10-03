'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { LazyProductImage } from '@/components/partner/LazyProductImage';

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

  const [selectedPointId, setSelectedPointId] = useState<string>(points[0]?.id || 'point-mega-gym');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [transferNote, setTransferNote] = useState<string>('დილის ახალი პარტია დარბაზის ვიტრინისთვის');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [newRetailPrice, setNewRetailPrice] = useState<number>(15);

  // Allow all dishes or dishes targeting POS
  const posDishes = dishes.filter(d => !d.targetChannels || d.targetChannels.includes('pos') || d.targetChannels.length === 0);

  const handleQtyChange = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const setQuickAll = (amount: number) => {
    const next: Record<string, number> = {};
    posDishes.forEach(d => {
      next[d.id] = amount;
    });
    setQuantities(next);
  };

  const handleSendTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToSend = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (itemsToSend.length === 0) {
      alert('გთხოვთ მიუთითოთ რაოდენობა გადასატანად');
      return;
    }

    setIsSending(true);
    try {
      const newTr = await createTransfer(selectedPointId, itemsToSend, transferNote);
      const targetPoint = points.find(p => p.id === selectedPointId);
      const pointName = typeof targetPoint?.name === 'object' ? (targetPoint.name.ka || targetPoint.name.ru || targetPoint.name.en) : targetPoint?.name || 'წერტილი';

      setSuccessMsg(
        `✓ პარტია #${newTr.transferNumber} (${newTr.totalUnits} ცალი, ${newTr.totalRetail} ₾) წარმატებით გაიგზავნა და შეინახა ბაზაში: «${pointName}»!`
      );

      setQuantities({});
      setTimeout(() => setSuccessMsg(null), 7000);
    } catch (err: any) {
      alert(`შეცდომა გადაზიდვისას: ${err.message || 'დაფიქსირდა შეცდომა'}`);
    } finally {
      setIsSending(false);
    }
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
  const selectedPointName = typeof selectedPoint?.name === 'object' 
    ? (selectedPoint.name.ka || selectedPoint.name.ru || selectedPoint.name.en) 
    : selectedPoint?.name || 'წერტილი';
  const pointStocks = stocks[selectedPointId] || {};

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">ლოჯისტიკა & გადაზიდვა წერტილებზე</h1>
          <p className="admin-page-subtitle">
            ცენტრალური სამზარეულოდან კერძების გადატანა დარბაზების ვიტრინებში (Mega Gym, XXL, Fitness Academy) და ნაშთების პირდაპირი სინქრონიზაცია ბაზასთან
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 78, 59, 0.28))',
          border: '1px solid #10B981',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34D399',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚚</span>
            <span>{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Grid: Dispatcher & Shelf Stocks */}
      <div className="admin-grid-2col">
        {/* Left: Dispatch Batch */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>🚚 გადაზიდვის ზედნადების შექმნა</h3>
              <p>პარტიის გაგზავნა ფიტნეს-კლუბის მაცივარში</p>
            </div>
            {/* Quick Fill Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setQuickAll(5)}
                className="stock-mini-btn"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                title="ყველა კერძზე 5-5 ცალი"
              >
                +5 ყველას
              </button>
              <button
                type="button"
                onClick={() => setQuickAll(10)}
                className="stock-mini-btn"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                title="ყველა კერძზე 10-10 ცალი"
              >
                +10 ყველას
              </button>
              <button
                type="button"
                onClick={() => setQuantities({})}
                className="stock-mini-btn"
                style={{ fontSize: '11px', padding: '3px 8px', color: '#9CA3AF' }}
              >
                გასუფთავება
              </button>
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
                  {points.map(pt => {
                    const ptName = typeof pt.name === 'object' ? (pt.name.ka || pt.name.ru || pt.name.en) : pt.name;
                    const ptAddr = typeof pt.address === 'object' ? (pt.address.ka || pt.address.ru || pt.address.en) : pt.address;
                    return (
                      <option key={pt.id} value={pt.id}>
                        {ptName} — {ptAddr}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="admin-transfer-picker-list">
              <label className="form-section-title">აირჩიეთ კერძები და რაოდენობა (ცალი):</label>
              {posDishes.map((dish) => {
                const currentQty = quantities[dish.id] || 0;
                const currentShelf = pointStocks[dish.id] || 0;
                const dishName = typeof dish.name === 'object' ? (dish.name.ka || dish.name.ru || dish.name.en) : dish.name;

                return (
                  <div key={dish.id} className="transfer-picker-item">
                    <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <LazyProductImage
                        productId={dish.id}
                        src={dish.image}
                        alt={dishName}
                        sizes="48px"
                      />
                    </div>

                    <div className="picker-dish-info">
                      <b>{dishName}</b>
                      <span className="picker-sub">
                        {dish.macros.weightGrams}გ • {dish.macros.calories} კკალ • ნაშთი თაროზე: <b style={{ color: currentShelf > 0 ? '#10B981' : '#F87171' }}>{currentShelf} ც</b>
                      </span>
                    </div>

                    <div className="picker-pricing">
                      <span className="picker-retail">{dish.retailPrice.toFixed(1)} ₾</span>
                      <span className="picker-cost">ხარჯი {dish.costPrice.toFixed(1)} ₾</span>
                    </div>

                    <div className="picker-stepper">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(dish.id, currentQty - 5)}
                        className="stepper-btn"
                        title="-5 ცალი"
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
                        title="+5 ცალი"
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
                  placeholder="მაგ: დილის ახალი პარტია დარბაზის ვიტრინისთვის"
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
              disabled={totalUnitsSelected === 0 || isSending}
              className="admin-btn-primary"
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                opacity: totalUnitsSelected === 0 || isSending ? 0.6 : 1,
              }}
            >
              {isSending ? '⏳ პარტია იგზავნება და ინახება ბაზაში...' : `🚀 პარტიის გადაზიდვა (${totalUnitsSelected} ცალი)`}
            </button>
          </form>
        </div>

        {/* Right: Shelf stock inspector */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>🏪 ნაშთები და ფასები: {selectedPointName}</h3>
              <p>ვიტრინაში არსებული მზა ულუფები (პირდაპირი შენახვა SQL-ში)</p>
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
                  const dishName = typeof dish.name === 'object' ? (dish.name.ka || dish.name.ru || dish.name.en) : dish.name;

                  return (
                    <tr key={dish.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                            <LazyProductImage
                              productId={dish.id}
                              src={dish.image}
                              alt={dishName}
                              sizes="36px"
                            />
                          </div>
                          <div>
                            <b>{dishName}</b>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{dish.macros.calories} კკალ • {dish.macros.weightGrams}გ</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="shelf-stock-control">
                          <button
                            onClick={async () => await updatePointStock(selectedPointId, dish.id, stock - 1)}
                            className="stock-mini-btn"
                          >
                            -
                          </button>
                          <span className={`stock-count-badge ${stock === 0 ? 'stock-zero' : stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                            {stock} ცალი
                          </span>
                          <button
                            onClick={async () => await updatePointStock(selectedPointId, dish.id, stock + 1)}
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
                              title="ფასის შეცვლა"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={async () => {
                            const add = prompt(`რამდენი ცალი «${dishName}» დაემატოს თაროზე?`, '10');
                            if (add && !isNaN(Number(add))) {
                              await updatePointStock(selectedPointId, dish.id, stock + Number(add));
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
            <h3>📋 გადაზიდვების ისტორია (Supabase რეესტრი)</h3>
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
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                    გადაზიდვების ისტორია ცარიელია
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
