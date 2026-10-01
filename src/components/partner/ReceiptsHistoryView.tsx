'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { PartnerSale } from '@/types/partner';
import { IconClose } from '@/components/Icons';

export const ReceiptsHistoryView: React.FC = () => {
  const { currentPoint, sales, refundSale, editSale } = usePartner();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'card' | 'cash' | 'split' | 'free' | 'discount'>('all');
  const [selectedSaleToManage, setSelectedSaleToManage] = useState<PartnerSale | null>(null);
  const [refundReason, setRefundReason] = useState<string>('შეცდომით გატარებული ჩეკი (დაბრუნება ვიტრინაში)');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'card' | 'cash' | 'split' | 'free'>('card');
  const [editSplitCash, setEditSplitCash] = useState<string>('10');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  if (!currentPoint) {
    return <div className="partner-min-empty"><p>წერტილი არ არის არჩეული</p></div>;
  }

  const pointSales = sales.filter(s => s.pointId === currentPoint.id);
  const pointTodaySales = pointSales.filter(
    s => new Date(s.createdAt).toDateString() === new Date().toDateString()
  );

  // Filtered by Search & Payment / Discount Type
  const filteredSales = pointTodaySales.filter(sale => {
    const isFree = sale.paymentMethod === 'free' || sale.discountType === 'free' || sale.totalAmount === 0;
    if (filterType === 'free') return isFree;
    if (filterType === 'discount') return sale.discountType === 'fixed4';
    if (isFree) return false;
    if (filterType === 'card' && sale.paymentMethod !== 'card') return false;
    if (filterType === 'cash' && sale.paymentMethod !== 'cash') return false;
    if (filterType === 'split' && sale.paymentMethod !== 'split') return false;

    // Search Query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const receiptNum = sale.receiptNumber.toLowerCase();
    const itemsMatch = sale.items.some(it => it.productName.toLowerCase().includes(q));
    const commentMatch = (sale.discountComment || '').toLowerCase().includes(q);
    const amountMatch = `${sale.totalAmount}`.includes(q);
    return receiptNum.includes(q) || itemsMatch || commentMatch || amountMatch;
  });

  const activeSales = pointTodaySales.filter(s => s.status !== 'refunded');

  const totalRevenue = activeSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const cardRevenue = activeSales.reduce((sum, s) => {
    if (s.paymentMethod === 'card') return sum + s.totalAmount;
    if (s.paymentMethod === 'split' && s.splitDetails) return sum + s.splitDetails.cardAmount;
    return sum;
  }, 0);

  const cashRevenue = activeSales.reduce((sum, s) => {
    if (s.paymentMethod === 'cash') return sum + s.totalAmount;
    if (s.paymentMethod === 'split' && s.splitDetails) return sum + s.splitDetails.cashAmount;
    return sum;
  }, 0);

  const freeItemsCount = activeSales
    .filter(s => s.paymentMethod === 'free' || s.discountType === 'free')
    .reduce((sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0), 0);

  const totalDiscountsGiven = activeSales
    .filter(s => s.discountType === 'fixed4')
    .reduce((sum, s) => sum + s.discountAmount, 0);

  const handlePerformRefund = (sale: PartnerSale) => {
    const ok = refundSale(sale.id, refundReason);
    if (ok) {
      setSelectedSaleToManage(null);
      setAlertMsg(`ჩეკი #${sale.receiptNumber} დაბრუნებულია. რაციონები დაბრუნდა ვიტრინაზე.`);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  const handleSavePaymentEdit = (sale: PartnerSale) => {
    const isFree = editPaymentMethod === 'free';
    let splitDet = undefined;
    if (editPaymentMethod === 'split') {
      const c = parseFloat(editSplitCash) || 0;
      splitDet = { cashAmount: c, cardAmount: Math.max(0, sale.totalAmount - c) };
    }

    const ok = editSale({
      saleId: sale.id,
      paymentMethod: editPaymentMethod,
      discountType: isFree ? 'free' : (sale.discountType === 'free' ? 'none' : sale.discountType),
      splitDetails: editPaymentMethod === 'split' ? splitDet : undefined,
    });

    if (ok) {
      setSelectedSaleToManage(null);
      setAlertMsg(`ჩეკის #${sale.receiptNumber} გადახდის მეთოდი განახლდა.`);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  return (
    <div className="partner-min-container">
      {/* Header */}
      <div className="partner-min-head">
        <div>
          <h2>📋 დღევანდელი ჩეკების ისტორია & დაბრუნება</h2>
          <p>{currentPoint.name.ka} • გატარებული ოპერაციები, გადახდის ტიპები და ფასდაკლებები</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: '13px' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="ძებნა (ჩეკი, რაციონი, კომენტარი)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 30px 8px 32px',
              background: '#181B22',
              border: '1px solid #282E3A',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '12.5px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {alertMsg && (
        <div className="partner-min-alert" style={{ marginTop: '12px' }}>
          <span>✓ {alertMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="partner-min-kpi-grid" style={{ marginTop: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="partner-min-kpi">
          <span className="label">დღევანდელი ჩეკები</span>
          <strong className="value">{pointTodaySales.length}</strong>
          <span className="sub">
            {pointTodaySales.filter(s => s.status === 'refunded').length > 0 ? (
              <span style={{ color: '#EF4444' }}>
                ({pointTodaySales.filter(s => s.status === 'refunded').length} დაბრუნებული)
              </span>
            ) : 'ყველა ოპერაცია'}
          </span>
        </div>

        <div className="partner-min-kpi highlight">
          <span className="label">სულ ნავაჭრი</span>
          <strong className="value" style={{ color: '#10B981' }}>{totalRevenue} ₾</strong>
          <span className="sub">შემოსული თანხა</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💳 ბარათით</span>
          <strong className="value" style={{ color: '#38BDF8' }}>{cardRevenue} ₾</strong>
          <span className="sub">POS ტერმინალი</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">💵 ნაღდით</span>
          <strong className="value" style={{ color: '#FBBF24' }}>{cashRevenue} ₾</strong>
          <span className="sub">ნაღდი ფული</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">🎁 უფასო რაციონი</span>
          <strong className="value" style={{ color: '#A855F7' }}>{freeItemsCount} ც.</strong>
          <span className="sub">პრომო / მწვრთნელები</span>
        </div>

        <div className="partner-min-kpi">
          <span className="label">🏷️ ფასდაკლება</span>
          <strong className="value" style={{ color: '#EC4899' }}>-{totalDiscountsGiven} ₾</strong>
          <span className="sub">სულ დაკლებული</span>
        </div>
      </div>

      {/* Type Filters Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '18px' }}>
        <button
          onClick={() => setFilterType('all')}
          style={{
            background: filterType === 'all' ? '#FFFFFF' : '#181B22',
            color: filterType === 'all' ? '#090A0F' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ყველა ({pointTodaySales.length})
        </button>

        <button
          onClick={() => setFilterType('card')}
          style={{
            background: filterType === 'card' ? '#38BDF8' : '#181B22',
            color: filterType === 'card' ? '#090A0F' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          💳 ბარათით ({pointTodaySales.filter(s => s.paymentMethod === 'card' && s.discountType !== 'free' && s.totalAmount > 0).length})
        </button>

        <button
          onClick={() => setFilterType('cash')}
          style={{
            background: filterType === 'cash' ? '#FBBF24' : '#181B22',
            color: filterType === 'cash' ? '#090A0F' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          💵 ნაღდით ({pointTodaySales.filter(s => s.paymentMethod === 'cash' && s.discountType !== 'free' && s.totalAmount > 0).length})
        </button>

        <button
          onClick={() => setFilterType('split')}
          style={{
            background: filterType === 'split' ? '#E2E8F0' : '#181B22',
            color: filterType === 'split' ? '#090A0F' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🔀 შერეული ({pointTodaySales.filter(s => s.paymentMethod === 'split' && s.discountType !== 'free' && s.totalAmount > 0).length})
        </button>

        <button
          onClick={() => setFilterType('free')}
          style={{
            background: filterType === 'free' ? '#A855F7' : '#181B22',
            color: filterType === 'free' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🎁 უფასო ({pointTodaySales.filter(s => s.paymentMethod === 'free' || s.discountType === 'free' || s.totalAmount === 0).length})
        </button>

        <button
          onClick={() => setFilterType('discount')}
          style={{
            background: filterType === 'discount' ? '#EC4899' : '#181B22',
            color: filterType === 'discount' ? '#FFFFFF' : '#94A3B8',
            border: '1px solid #282E3A',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🏷️ ფასდაკლებით ({pointTodaySales.filter(s => s.discountType === 'fixed4').length})
        </button>
      </div>

      {/* Receipts Table */}
      <div className="partner-min-section" style={{ marginTop: '14px' }}>
        <h3 className="section-title">ოპერაციების ჟურნალი ({filteredSales.length})</h3>

        {filteredSales.length === 0 ? (
          <div className="partner-min-empty-card">
            <p>{searchQuery || filterType !== 'all' ? 'მოცემული ფილტრით ჩეკები არ მოიძებნა' : 'დღეს ჩეკები ჯერ არ გატარებულა'}</p>
          </div>
        ) : (
          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>დრო</th>
                  <th style={{ width: '120px' }}>ჩეკი</th>
                  <th>პოზიციები</th>
                  <th style={{ width: '140px' }}>გადახდის ტიპი</th>
                  <th style={{ width: '110px' }}>თანხა</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => {
                  const isRefunded = sale.status === 'refunded';

                  return (
                    <tr key={sale.id} style={{ opacity: isRefunded ? 0.5 : 1 }}>
                      <td style={{ color: '#94A3B8', fontSize: '12px' }}>
                        {new Date(sale.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <strong style={{ color: isRefunded ? '#EF4444' : '#FFFFFF' }}>
                          #{sale.receiptNumber}
                        </strong>
                        {isRefunded && (
                          <div style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>
                            დაბრუნებული
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="ship-chips">
                          {sale.items.map((it, idx) => (
                            <span key={idx} className="chip">
                              {it.productName} <strong>({it.quantity})</strong>
                            </span>
                          ))}
                        </div>
                        {sale.discountType !== 'none' && (
                          <div style={{ fontSize: '11.5px', marginTop: '4px', fontWeight: 600, color: sale.discountType === 'free' ? '#A855F7' : '#EC4899' }}>
                            {sale.discountType === 'free' ? '🎁 უფასო რაციონი' : `🏷️ ფასდაკლება (-${sale.discountAmount} ₾)`}
                            {sale.discountComment ? ` • ${sale.discountComment}` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        {sale.discountType === 'free' ? (
                          <span style={{
                            display: 'inline-block',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#C084FC',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                          }}>
                            🎁 უფასო
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#181B22',
                            color: sale.paymentMethod === 'card' ? '#38BDF8' : sale.paymentMethod === 'cash' ? '#FBBF24' : '#E2E8F0',
                            border: '1px solid #282E3A',
                          }}>
                            {sale.paymentMethod === 'card'
                              ? '💳 ბარათი'
                              : sale.paymentMethod === 'cash'
                              ? '💵 ნაღდი'
                              : `🔀 შერეული (${sale.splitDetails?.cashAmount}+${sale.splitDetails?.cardAmount})`}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong style={{
                          fontSize: '14px',
                          color: isRefunded ? '#EF4444' : sale.discountType === 'free' ? '#A855F7' : '#FFFFFF',
                          textDecoration: isRefunded ? 'line-through' : 'none'
                        }}>
                          {sale.totalAmount} ₾
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isRefunded ? (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedSaleToManage(sale);
                                setEditPaymentMethod(sale.paymentMethod);
                                setEditSplitCash(sale.splitDetails?.cashAmount?.toString() || '10');
                              }}
                              className="partner-min-btn-outline"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              ✏️ გადახდა
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSaleToManage(sale);
                                setRefundReason('შეცდომით გატარებული ჩეკი (დაბრუნება ვიტრინაში)');
                              }}
                              className="partner-min-danger-btn"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              ↩ დაბრუნება
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {sale.notes || 'გაუქმებულია'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Payment / Refund Dialog Modal */}
      {selectedSaleToManage && (
        <div className="pos-modal-overlay" onClick={() => setSelectedSaleToManage(null)}>
          <div className="pos-min-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>ჩეკის მართვა #{selectedSaleToManage.receiptNumber}</h3>
              <button onClick={() => setSelectedSaleToManage(null)} className="close-btn">
                <IconClose size={16} />
              </button>
            </div>

            <div style={{ background: '#181B22', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>თანხა:</span>
                <strong style={{ color: '#FFFFFF', fontSize: '14px' }}>{selectedSaleToManage.totalAmount} ₾</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>შემადგენლობა:</span>
                <span style={{ color: '#E2E8F0', fontSize: '12px' }}>
                  {selectedSaleToManage.items.map(it => `${it.productName} (${it.quantity})`).join(', ')}
                </span>
              </div>
            </div>

            {/* Option 1: Edit Payment */}
            <div style={{ borderBottom: '1px solid #1F242E', paddingBottom: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#FFFFFF', marginBottom: '8px' }}>
                გადახდის მეთოდის შეცვლა
              </h4>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('card')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: editPaymentMethod === 'card' ? '#FFFFFF' : '#181B22',
                    color: editPaymentMethod === 'card' ? '#090A0F' : '#94A3B8',
                    border: '1px solid #282E3A',
                    cursor: 'pointer'
                  }}
                >
                  💳 ბარათი
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('cash')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: editPaymentMethod === 'cash' ? '#FFFFFF' : '#181B22',
                    color: editPaymentMethod === 'cash' ? '#090A0F' : '#94A3B8',
                    border: '1px solid #282E3A',
                    cursor: 'pointer'
                  }}
                >
                  💵 ნაღდი
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('split')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: editPaymentMethod === 'split' ? '#FFFFFF' : '#181B22',
                    color: editPaymentMethod === 'split' ? '#090A0F' : '#94A3B8',
                    border: '1px solid #282E3A',
                    cursor: 'pointer'
                  }}
                >
                  🔀 შერეული
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('free')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: editPaymentMethod === 'free' ? '#A855F7' : '#181B22',
                    color: editPaymentMethod === 'free' ? '#FFFFFF' : '#94A3B8',
                    border: '1px solid #282E3A',
                    cursor: 'pointer'
                  }}
                >
                  🎁 უფასო
                </button>
              </div>

              {editPaymentMethod === 'split' && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94A3B8' }}>ნაღდი თანხა (₾):</label>
                  <input
                    type="number"
                    value={editSplitCash}
                    onChange={e => setEditSplitCash(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: '#181B22',
                      border: '1px solid #282E3A',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      marginTop: '4px'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#38BDF8', marginTop: '4px' }}>
                    ბარათით დარჩება: {Math.max(0, selectedSaleToManage.totalAmount - (parseFloat(editSplitCash) || 0))} ₾
                  </div>
                </div>
              )}

              <button
                onClick={() => handleSavePaymentEdit(selectedSaleToManage)}
                className="partner-min-btn-outline"
                style={{ width: '100%', padding: '8px', fontWeight: 700 }}
              >
                მეთოდის შენახვა
              </button>
            </div>

            {/* Option 2: Full Refund */}
            <div>
              <h4 style={{ fontSize: '13px', color: '#EF4444', marginBottom: '8px' }}>
                ჩეკის დაბრუნება (Refund)
              </h4>
              <p style={{ fontSize: '11.5px', color: '#94A3B8', marginBottom: '10px' }}>
                ჩეკი გაუქმდება და მასში არსებული რაციონები ავტომატურად დაბრუნდება ვიტრინის ნაშთში.
              </p>

              <input
                type="text"
                placeholder="დაბრუნების მიზეზი..."
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: '#181B22',
                  border: '1px solid #282E3A',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}
              />

              <button
                onClick={() => handlePerformRefund(selectedSaleToManage)}
                className="partner-min-danger-btn"
                style={{ width: '100%', padding: '9px', fontWeight: 700 }}
              >
                ↩ ჩეკის გაუქმება და რაციონების დაბრუნება
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
