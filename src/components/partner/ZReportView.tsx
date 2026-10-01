'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';
import { PartnerProduct, PartnerSale, PartnerSaleItem } from '@/types/partner';
import { IconTrash } from '@/components/Icons';

export const ZReportView: React.FC = () => {
  const { currentPoint, points, products, getPointStock, sales, editSale, refundSale, deleteSale } = usePartner();
  
  // Date filter (defaults to today in YYYY-MM-DD format)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Point filter for multi-point
  const [selectedPointId, setSelectedPointId] = useState<string>(currentPoint?.id || 'all');

  // Edit / Manage Modal State
  const [editingSale, setEditingSale] = useState<PartnerSale | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'card' | 'cash' | 'split' | 'free'>('card');
  const [editSplitCash, setEditSplitCash] = useState<string>('10');
  const [editItems, setEditItems] = useState<PartnerSaleItem[]>([]);
  const [editDiscountType, setEditDiscountType] = useState<'none' | 'fixed4' | 'free'>('none');
  const [editDiscountComment, setEditDiscountComment] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>('შეცდომით გატარებული ჩეკი / საქონლის დაბრუნება');

  const [filterPaymentType, setFilterPaymentType] = useState<'all' | 'card' | 'cash' | 'split' | 'free' | 'discount'>('all');

  const activePoint = points.find(p => p.id === (selectedPointId === 'all' ? currentPoint?.id : selectedPointId)) || currentPoint;

  // Filter sales for the selected date and point
  const daySales = sales.filter(s => {
    const saleDateStr = new Date(s.createdAt).toISOString().split('T')[0];
    if (saleDateStr !== selectedDateStr) return false;
    if (selectedPointId !== 'all' && s.pointId !== selectedPointId) return false;
    return true;
  });

  const activeSales = daySales.filter(s => s.status !== 'refunded');
  const refundedSales = daySales.filter(s => s.status === 'refunded');

  // KPI Calculations
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPortions = activeSales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );

  let cardRevenue = 0;
  let cashRevenue = 0;

  activeSales.forEach(s => {
    if (s.paymentMethod === 'card') {
      cardRevenue += s.totalAmount;
    } else if (s.paymentMethod === 'cash') {
      cashRevenue += s.totalAmount;
    } else if (s.paymentMethod === 'split' && s.splitDetails) {
      cashRevenue += s.splitDetails.cashAmount || 0;
      cardRevenue += s.splitDetails.cardAmount || 0;
    }
  });

  const freeItemsCount = activeSales
    .filter(s => s.paymentMethod === 'free' || s.discountType === 'free')
    .reduce((sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0), 0);

  const totalDiscountsGiven = activeSales
    .filter(s => s.discountType === 'fixed4')
    .reduce((sum, s) => sum + s.discountAmount, 0);

  const filteredDaySales = daySales.filter(sale => {
    const isFree = sale.paymentMethod === 'free' || sale.discountType === 'free' || sale.totalAmount === 0;
    if (filterPaymentType === 'free') return isFree;
    if (filterPaymentType === 'discount') return sale.discountType === 'fixed4';
    if (isFree) return false;
    if (filterPaymentType === 'card' && sale.paymentMethod !== 'card') return false;
    if (filterPaymentType === 'cash' && sale.paymentMethod !== 'cash') return false;
    if (filterPaymentType === 'split' && sale.paymentMethod !== 'split') return false;
    return true;
  });

  // Calculate "რა რაოდენობა გაიყიდა" (Product breakdown)
  const productSummaryMap: Record<
    string,
    { product?: PartnerProduct; name: string; quantity: number; totalSum: number }
  > = {};

  activeSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSummaryMap[item.productId]) {
        const pObj = products.find(p => p.id === item.productId);
        productSummaryMap[item.productId] = {
          product: pObj,
          name: pObj?.name.ka || item.productName,
          quantity: 0,
          totalSum: 0,
        };
      }
      productSummaryMap[item.productId].quantity += item.quantity;
      productSummaryMap[item.productId].totalSum += item.totalPrice;
    });
  });

  const productBreakdownList = Object.values(productSummaryMap).sort(
    (a, b) => b.quantity - a.quantity
  );

  // Open Edit Modal
  const handleOpenEdit = (sale: PartnerSale) => {
    setEditingSale(sale);
    const isFree = sale.paymentMethod === 'free' || sale.discountType === 'free' || sale.totalAmount === 0;
    setEditPaymentMethod(isFree ? 'free' : sale.paymentMethod);
    setEditSplitCash(sale.splitDetails?.cashAmount?.toString() || '10');
    setEditItems(sale.items.map(it => ({ ...it })));
    setEditDiscountType(isFree ? 'free' : (sale.discountType || 'none'));
    setEditDiscountComment(sale.discountComment || '');
    setEditNotes(sale.notes || '');
    setSelectedProductToAdd('');
  };

  // Item quantity adjustment in Edit Modal
  const handleUpdateEditItemQty = (productId: string, delta: number) => {
    setEditItems(prev =>
      prev
        .map(it => {
          if (it.productId === productId) {
            const newQty = it.quantity + delta;
            return newQty > 0
              ? { ...it, quantity: newQty, totalPrice: it.pricePerUnit * newQty }
              : null;
          }
          return it;
        })
        .filter(Boolean) as PartnerSaleItem[]
    );
  };

  const handleRemoveEditItem = (productId: string) => {
    setEditItems(prev => prev.filter(it => it.productId !== productId));
  };

  const handleAddProductToEditSale = () => {
    if (!selectedProductToAdd) return;
    const prod = products.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    setEditItems(prev => {
      const existing = prev.find(it => it.productId === prod.id);
      if (existing) {
        return prev.map(it =>
          it.productId === prod.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                totalPrice: (it.quantity + 1) * it.pricePerUnit,
              }
            : it
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name.ka || prod.name.ru,
          quantity: 1,
          pricePerUnit: prod.price,
          totalPrice: prod.price,
        },
      ];
    });

    setSelectedProductToAdd('');
  };

  // Calculate live edited totals
  const editSubtotal = editItems.reduce((sum, it) => sum + it.pricePerUnit * it.quantity, 0);
  const editTotalQty = editItems.reduce((sum, it) => sum + it.quantity, 0);
  let editDiscountAmt = 0;
  if (editDiscountType === 'fixed4') {
    editDiscountAmt = Math.min(editSubtotal, 4 * editTotalQty);
  } else if (editDiscountType === 'free' || editPaymentMethod === 'free') {
    editDiscountAmt = editSubtotal;
  }
  const editFinalTotal = Math.max(0, editSubtotal - editDiscountAmt);

  // Save edits
  const handleSaveEdit = () => {
    if (!editingSale) return;
    if (editItems.length === 0) {
      alert('ჩეკი არ შეიძლება იყოს ცარიელი. დაამატეთ მინიმუმ ერთი პოზიცია ან გააფორმეთ დაბრუნება.');
      return;
    }

    const isFree = editPaymentMethod === 'free' || editDiscountType === 'free';
    const effectivePaymentMethod = isFree ? 'free' : editPaymentMethod;
    const effectiveDiscountType = isFree ? 'free' : editDiscountType;

    let splitDet = undefined;
    if (effectivePaymentMethod === 'split') {
      const cash = parseFloat(editSplitCash) || 0;
      splitDet = {
        cashAmount: cash,
        cardAmount: Math.max(0, editFinalTotal - cash),
      };
    }

    const success = editSale({
      saleId: editingSale.id,
      items: editItems,
      discountType: effectiveDiscountType,
      discountComment: editDiscountComment.trim() || undefined,
      paymentMethod: effectivePaymentMethod,
      splitDetails: effectivePaymentMethod === 'split' ? splitDet : undefined,
      notes: editNotes.trim() || undefined,
    });

    if (success) {
      setAlertMessage(`ჩეკი #${editingSale.receiptNumber} წარმატებით განახლდა!`);
      setEditingSale(null);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  // Perform Refund
  const handleRefund = (sale: PartnerSale) => {
    if (confirm(`გსურთ ჩეკის #${sale.receiptNumber} დაბრუნების გაფორმება (${sale.totalAmount} ₾)? საქონელი დაბრუნდება ვიტრინის ნაშთში.`)) {
      refundSale(sale.id, refundReason);
      setEditingSale(null);
      setAlertMessage(`ჩეკი #${sale.receiptNumber} დაბრუნებულია.`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  // Perform Delete
  const handleDelete = (sale: PartnerSale) => {
    if (confirm(`გსურთ ოპერაციის #${sale.receiptNumber} წაშლა? საქონელი დაბრუნდება ვიტრინაზე.`)) {
      deleteSale(sale.id, true);
      setEditingSale(null);
      setAlertMessage(`ოპერაცია #${sale.receiptNumber} წაიშალა.`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  return (
    <div className="partner-min-container">
      {/* Alert notification */}
      {alertMessage && (
        <div className="partner-min-alert">
          <span>✓ {alertMessage}</span>
        </div>
      )}

      {/* Top Header & Filters */}
      <div className="partner-min-head" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2>დღიური ანგარიში</h2>
          <p>
            {selectedPointId === 'all'
              ? 'სრული შეჯამება ყველა წერტილზე'
              : `${activePoint?.name.ka || activePoint?.name.ru} • ${activePoint?.address.ka || activePoint?.address.ru}`}
          </p>
        </div>

        {/* Date & Point Filters + Print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {points.length > 1 && (
            <select
              value={selectedPointId}
              onChange={e => setSelectedPointId(e.target.value)}
              className="partner-min-input"
              style={{ padding: '6px 10px', fontSize: '12.5px', background: '#111318' }}
            >
              <option value="all">🌐 ყველა წერტილი</option>
              {points.map(p => (
                <option key={p.id} value={p.id}>
                  📍 {p.name.ka || p.name.ru}
                </option>
              ))}
            </select>
          )}

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setSelectedDateStr(new Date().toISOString().split('T')[0])}
              className={`period-btn ${selectedDateStr === new Date().toISOString().split('T')[0] ? 'active' : ''}`}
              style={{ border: '1px solid #282E3A' }}
            >
              დღეს
            </button>
            <input
              type="date"
              value={selectedDateStr}
              onChange={e => setSelectedDateStr(e.target.value)}
              className="partner-min-input"
              style={{ padding: '5px 8px', fontSize: '12.5px', color: '#E2E8F0', background: '#111318' }}
            />
          </div>

          <button onClick={() => window.print()} className="partner-min-btn-outline">
            🖨️ ანგარიშის ბეჭდვა
          </button>
        </div>
      </div>

      {/* KPI Grid: სულ / ბარათით / ნაღდით / უფასო / ფასდაკლება / გაყიდულია */}
      <div className="partner-min-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="partner-min-kpi highlight">
          <span className="label">სულ (შემოსავალი)</span>
          <strong className="value">{totalRevenue.toFixed(2)} ₾</strong>
          <span className="sub">
            {activeSales.length} აქტიური ჩეკი {refundedSales.length > 0 && `(${refundedSales.length} დაბრუნება)`}
          </span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💳 ბარათით</span>
          <strong className="value" style={{ color: '#60A5FA' }}>
            {cardRevenue.toFixed(2)} ₾
          </strong>
          <span className="sub">საბანკო ტერმინალი</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💵 ნაღდით</span>
          <strong className="value" style={{ color: '#34D399' }}>
            {cashRevenue.toFixed(2)} ₾
          </strong>
          <span className="sub">ნაღდი ფული სალაროში</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">🎁 უფასო რაციონი</span>
          <strong className="value" style={{ color: '#A855F7' }}>
            {freeItemsCount} ც.
          </strong>
          <span className="sub">პრომო / მწვრთნელები</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">🏷️ ფასდაკლება</span>
          <strong className="value" style={{ color: '#EC4899' }}>
            -{totalDiscountsGiven.toFixed(2)} ₾
          </strong>
          <span className="sub">სულ დაკლებული</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">სულ გაყიდული</span>
          <strong className="value" style={{ color: '#FCD34D' }}>
            {totalPortions} ც.
          </strong>
          <span className="sub">
            {activeSales.length > 0
              ? `საშუალო ჩეკი: ${(totalRevenue / activeSales.length).toFixed(2)} ₾`
              : 'გაყიდვები არ არის'}
          </span>
        </div>
      </div>

      {/* SECTION 1: რა რაოდენობა გაიყიდა */}
      <div className="partner-min-card" style={{ marginTop: '10px' }}>
        <div className="card-title-row">
          <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📦 რა რაოდენობა გაიყიდა</span>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 400 }}>
              (პოზიციების შეჯამება: {selectedDateStr})
            </span>
          </h3>
          <span className="stock-count-tag" style={{ fontSize: '12.5px', color: '#CBD5E1' }}>
            სულ პოზიციები: <strong>{totalPortions} ც.</strong> თანხით: <strong>{totalRevenue.toFixed(2)} ₾</strong>
          </span>
        </div>

        {productBreakdownList.length === 0 ? (
          <div className="partner-min-empty-card" style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ color: '#64748B', fontSize: '13px' }}>არჩეულ თარიღში გაყიდვები ჯერ არ დაფიქსირებულა.</p>
          </div>
        ) : (
          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>რაციონი / კერძი</th>
                  <th>ფასი / ცალი</th>
                  <th style={{ textAlign: 'center' }}>გაყიდულია</th>
                  <th>თანხა</th>
                  <th>გაყიდვების წილი</th>
                  {activePoint && <th style={{ textAlign: 'right' }}>ნაშთი ვიტრინაზე</th>}
                </tr>
              </thead>
              <tbody>
                {productBreakdownList.map((item, idx) => {
                  const sharePercent = totalPortions > 0 ? (item.quantity / totalPortions) * 100 : 0;
                  const currentStock = activePoint && item.product ? getPointStock(activePoint.id, item.product.id) : 0;

                  return (
                    <tr key={idx}>
                      <td style={{ color: '#64748B', width: '30px' }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.product?.image && (
                            <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                              <Image
                                src={item.product.image}
                                alt={item.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="40px"
                              />
                            </div>
                          )}
                          <div>
                            <strong>{item.name}</strong>
                            {item.product?.categoryName && (
                              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                {item.product.categoryName.ka || item.product.categoryName.ru} • {item.product.calories} კკალ
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.product?.price || (item.totalSum / item.quantity).toFixed(2)} ₾</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '6px' }}>
                          {item.quantity} ც.
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#E2E8F0', fontSize: '13.5px' }}>
                          {item.totalSum.toFixed(2)} ₾
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px' }}>
                          <div style={{ flex: 1, height: '6px', background: '#1E2430', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${sharePercent}%`,
                                height: '100%',
                                background: '#10B981',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#94A3B8', width: '36px' }}>
                            {sharePercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      {activePoint && (
                        <td style={{ textAlign: 'right' }}>
                          <span className={`stock-simple-tag ${currentStock <= 3 ? 'low' : ''}`}>
                            {currentStock} ც.
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: '2px solid #334155', background: '#0F172A' }}>
                  <td></td>
                  <td>სულ პოზიციები</td>
                  <td>—</td>
                  <td style={{ textAlign: 'center' }}>{totalPortions} ც.</td>
                  <td>{totalRevenue.toFixed(2)} ₾</td>
                  <td>100%</td>
                  {activePoint && <td>—</td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: თითოეული ოპერაცია ცალ-ცალკე */}
      <div className="partner-min-card" style={{ marginTop: '10px' }}>
        <div className="card-title-row" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋 თითოეული ოპერაცია ცალ-ცალკე</span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 400 }}>
                (სულ: {daySales.length})
              </span>
            </h3>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterPaymentType('all')}
              className={`disc-pill ${filterPaymentType === 'all' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              ყველა ({daySales.length})
            </button>
            <button
              onClick={() => setFilterPaymentType('card')}
              className={`disc-pill ${filterPaymentType === 'card' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              💳 ბარათი ({daySales.filter(s => s.paymentMethod === 'card' && s.discountType !== 'free' && s.totalAmount > 0).length})
            </button>
            <button
              onClick={() => setFilterPaymentType('cash')}
              className={`disc-pill ${filterPaymentType === 'cash' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              💵 ნაღდი ({daySales.filter(s => s.paymentMethod === 'cash' && s.discountType !== 'free' && s.totalAmount > 0).length})
            </button>
            <button
              onClick={() => setFilterPaymentType('split')}
              className={`disc-pill ${filterPaymentType === 'split' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              🔀 შერეული ({daySales.filter(s => s.paymentMethod === 'split' && s.discountType !== 'free' && s.totalAmount > 0).length})
            </button>
            <button
              onClick={() => setFilterPaymentType('free')}
              className={`disc-pill ${filterPaymentType === 'free' ? 'active' : ''}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                background: filterPaymentType === 'free' ? '#A855F7' : undefined,
                color: filterPaymentType === 'free' ? '#FFFFFF' : undefined,
              }}
            >
              🎁 უფასო ({daySales.filter(s => s.paymentMethod === 'free' || s.discountType === 'free' || s.totalAmount === 0).length})
            </button>
            <button
              onClick={() => setFilterPaymentType('discount')}
              className={`disc-pill ${filterPaymentType === 'discount' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              🏷️ ფასდაკლებით ({daySales.filter(s => s.discountType === 'fixed4').length})
            </button>
          </div>
        </div>

        {daySales.length === 0 ? (
          <div className="partner-min-empty-card" style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ color: '#64748B', fontSize: '13px' }}>ამ დღეს ოპერაციები არ მოიძებნა.</p>
          </div>
        ) : filteredDaySales.length === 0 ? (
          <div className="partner-min-empty-card" style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ color: '#64748B', fontSize: '13px' }}>არჩეული ფილტრით ოპერაციები არ მოიძებნა.</p>
          </div>
        ) : (
          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th>დრო</th>
                  <th>ჩეკი</th>
                  <th>შეკვეთის შემადგენლობა</th>
                  <th>გადახდა</th>
                  <th>თანხა</th>
                  <th>სტატუსი</th>
                  <th style={{ textAlign: 'right' }}>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {filteredDaySales.map(sale => {
                  const isRef = sale.status === 'refunded';
                  const salePoint = points.find(p => p.id === sale.pointId);
                  const isSaleFree = sale.paymentMethod === 'free' || sale.discountType === 'free' || sale.totalAmount === 0;

                  return (
                    <tr key={sale.id} style={{ opacity: isRef ? 0.45 : 1 }}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(sale.createdAt).toLocaleTimeString('ka-GE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {selectedPointId === 'all' && (
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                            {salePoint?.name.ka || salePoint?.name.ru}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>#{sale.receiptNumber}</strong>
                      </td>
                      <td>
                        <div className="ship-chips">
                          {sale.items.map((it, i) => (
                            <span key={i} className="chip">
                              {it.productName} <strong>×{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                        {sale.discountComment && (
                          <div style={{ fontSize: '11px', color: isSaleFree ? '#C084FC' : '#10B981', marginTop: '3px' }}>
                            {isSaleFree
                              ? '🎁 უფასო'
                              : `🏷️ ფასდაკლება -4 ₾/ცალზე (-${sale.discountAmount} ₾)`}: {sale.discountComment}
                          </div>
                        )}
                        {sale.notes && (
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontStyle: 'italic' }}>
                            შენიშვნა: {sale.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className="payment-mini-tag"
                          style={{
                            fontWeight: 700,
                            background: isSaleFree ? 'rgba(168, 85, 247, 0.15)' : undefined,
                            color: isSaleFree ? '#C084FC' : undefined,
                            border: isSaleFree ? '1px solid rgba(168, 85, 247, 0.3)' : undefined,
                          }}
                        >
                          {isSaleFree
                            ? '🎁 უფასო'
                            : sale.paymentMethod === 'card'
                            ? '💳 ბარათი'
                            : sale.paymentMethod === 'cash'
                            ? '💵 ნაღდი'
                            : `🔀 შერეული (${sale.splitDetails?.cashAmount || 0} ნაღდი + ${sale.splitDetails?.cardAmount || 0} ბარათი)`}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            fontSize: '14px',
                            color: isRef ? '#94A3B8' : isSaleFree ? '#A855F7' : '#FFFFFF',
                            textDecoration: isRef ? 'line-through' : 'none',
                          }}
                        >
                          {sale.totalAmount.toFixed(2)} ₾
                        </strong>
                      </td>
                      <td>
                        {isRef ? (
                          <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600 }}>
                            დაბრუნებული
                          </span>
                        ) : (
                          <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 600 }}>
                            ✓ დასრულებული
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEdit(sale)}
                            className="partner-min-btn-outline"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            title="ოპერაციის რედაქტირება"
                          >
                            ✏️ რედაქტირება
                          </button>
                          {!isRef && (
                            <button
                              onClick={() => {
                                setEditingSale(sale);
                                handleRefund(sale);
                              }}
                              className="partner-min-danger-btn"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="დაბრუნების გაფორმება"
                            >
                              ↩ დაბრუნება
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL / ოპერაციის რედაქტირება */}
      {editingSale && (
        <div className="pos-modal-overlay" onClick={() => setEditingSale(null)}>
          <div
            className="pos-min-modal"
            style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3 style={{ margin: 0, fontSize: '17px' }}>
                  ოპერაციის რედაქტირება #{editingSale.receiptNumber}
                </h3>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {new Date(editingSale.createdAt).toLocaleString('ka-GE')}
                </span>
              </div>
              <button onClick={() => setEditingSale(null)} className="close-btn">
                ✕
              </button>
            </div>

            {/* Part 1: Edit Items & Quantities */}
            <div style={{ background: '#181B22', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13.5px', color: '#E2E8F0' }}>1. ჩეკის შემადგენლობა / რაციონები:</strong>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>სულ: {editTotalQty} ც.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {editItems.map(item => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#111318',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #282E3A',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.productName}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {item.pricePerUnit} ₾ / ცალი × {item.quantity} = <strong>{item.pricePerUnit * item.quantity} ₾</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="item-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateEditItemQty(item.productId, -1)}
                          className="btn-step"
                          style={{ width: '26px', height: '26px', background: '#282E3A', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateEditItemQty(item.productId, 1)}
                          className="btn-step"
                          style={{ width: '26px', height: '26px', background: '#282E3A', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(item.productId)}
                        style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="ჩეკიდან ამოშლა"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item to receipt */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedProductToAdd}
                  onChange={e => setSelectedProductToAdd(e.target.value)}
                  className="partner-min-input"
                  style={{ flex: 1, fontSize: '12.5px', background: '#111318' }}
                >
                  <option value="">+ კერძის დამატება ჩეკში...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name.ka || p.name.ru} — {p.price} ₾
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProductToEditSale}
                  disabled={!selectedProductToAdd}
                  className="partner-min-btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  დამატება
                </button>
              </div>
            </div>

            {/* Part 2: Discounts */}
            <div style={{ background: '#181B22', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13.5px', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>
                2. ფასდაკლება / უფასო რაციონი:
              </strong>
              <div className="discount-pills" style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditDiscountType('none');
                    if (editPaymentMethod === 'free') setEditPaymentMethod('card');
                  }}
                  className={`disc-pill ${editDiscountType === 'none' && editPaymentMethod !== 'free' ? 'active' : ''}`}
                >
                  ფასდაკლების გარეშე
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditDiscountType('fixed4');
                    if (editPaymentMethod === 'free') setEditPaymentMethod('card');
                  }}
                  className={`disc-pill ${editDiscountType === 'fixed4' ? 'active' : ''}`}
                >
                  -4 ₾ / პოზიცია (-{4 * editTotalQty} ₾)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditDiscountType('free');
                    setEditPaymentMethod('free');
                  }}
                  className={`disc-pill ${editDiscountType === 'free' || editPaymentMethod === 'free' ? 'active' : ''}`}
                  style={{
                    background: (editDiscountType === 'free' || editPaymentMethod === 'free') ? '#A855F7' : undefined,
                    color: (editDiscountType === 'free' || editPaymentMethod === 'free') ? '#FFFFFF' : undefined,
                  }}
                >
                  🎁 უფასო
                </button>
              </div>

              {(editDiscountType !== 'none' || editPaymentMethod === 'free') && (
                <input
                  type="text"
                  placeholder="საფუძველი / მიმღები (მწვრთნელი, ადმინისტრაცია, აქცია)..."
                  value={editDiscountComment}
                  onChange={e => setEditDiscountComment(e.target.value)}
                  className="partner-min-input"
                  style={{ width: '100%', fontSize: '12.5px' }}
                />
              )}
            </div>

            {/* Part 3: Payment Method */}
            <div style={{ background: '#181B22', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13.5px', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>
                3. გადახდის მეთოდი:
              </strong>
              <div className="pos-min-pay-tabs" style={{ marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditPaymentMethod('card');
                    if (editDiscountType === 'free') setEditDiscountType('none');
                  }}
                  className={`pay-tab ${editPaymentMethod === 'card' && editDiscountType !== 'free' ? 'active' : ''}`}
                >
                  💳 ბარათი
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPaymentMethod('cash');
                    if (editDiscountType === 'free') setEditDiscountType('none');
                  }}
                  className={`pay-tab ${editPaymentMethod === 'cash' && editDiscountType !== 'free' ? 'active' : ''}`}
                >
                  💵 ნაღდი
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPaymentMethod('split');
                    if (editDiscountType === 'free') setEditDiscountType('none');
                  }}
                  className={`pay-tab ${editPaymentMethod === 'split' && editDiscountType !== 'free' ? 'active' : ''}`}
                >
                  🔀 შერეული
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPaymentMethod('free');
                    setEditDiscountType('free');
                  }}
                  className={`pay-tab ${editPaymentMethod === 'free' || editDiscountType === 'free' ? 'active' : ''}`}
                  style={{
                    background: (editPaymentMethod === 'free' || editDiscountType === 'free') ? '#A855F7' : undefined,
                    color: (editPaymentMethod === 'free' || editDiscountType === 'free') ? '#FFFFFF' : undefined,
                  }}
                >
                  🎁 უფასო
                </button>
              </div>

              {editPaymentMethod === 'split' && (
                <div className="pos-split-inputs-wrap" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      ნაღდით (₾):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={editFinalTotal}
                      value={editSplitCash}
                      onChange={e => setEditSplitCash(e.target.value)}
                      className="partner-min-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      ბარათით (₾):
                    </label>
                    <strong style={{ fontSize: '16px', color: '#60A5FA' }}>
                      {(Math.max(0, editFinalTotal - (parseFloat(editSplitCash) || 0))).toFixed(2)} ₾
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Part 4: Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                შენიშვნა ოპერაციაზე:
              </label>
              <input
                type="text"
                placeholder="დამატებითი შენიშვნა..."
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="partner-min-input"
                style={{ width: '100%', fontSize: '12.5px' }}
              />
            </div>

            {/* Sum Preview */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#111318',
                borderRadius: '10px',
                border: '1px solid #334155',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>ჩეკის ახალი თანხა:</span>
                {editDiscountAmt > 0 && (
                  <span style={{ fontSize: '11.5px', color: '#10B981', marginLeft: '6px' }}>
                    (ფასდაკლება: -{editDiscountAmt.toFixed(2)} ₾)
                  </span>
                )}
              </div>
              <strong style={{ fontSize: '20px', color: '#FFFFFF' }}>
                {editFinalTotal.toFixed(2)} ₾
              </strong>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="partner-min-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                💾 ცვლილებების შენახვა ჩეკში
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {editingSale.status !== 'refunded' && (
                  <button
                    type="button"
                    onClick={() => handleRefund(editingSale)}
                    className="partner-min-danger-btn"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    ↩ დაბრუნების გაფორმება
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(editingSale)}
                  className="partner-min-btn-outline"
                  style={{ color: '#EF4444', borderColor: '#EF4444' }}
                >
                  🗑️ ოპერაციის წაშლა
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
