'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { PartnerProduct, PartnerPreorder } from '@/types/partner';
import { IconClose, IconTrash } from '@/components/Icons';
import { ClipboardList, Calendar, CreditCard, Banknote, Check, Pencil, X, Trash2, Save } from 'lucide-react';

export const PreorderView: React.FC = () => {
  const { currentPoint, products, editPreorder, fulfillPreorder, cancelPreorder, deletePreorder, getPointPreorders, getTomorrowDateStr } = usePartner();

  const tomorrowDateStr = getTomorrowDateStr();

  const [preorderToCancel, setPreorderToCancel] = useState<PartnerPreorder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Edit modal state
  const [editingPreorder, setEditingPreorder] = useState<PartnerPreorder | null>(null);
  const [editItems, setEditItems] = useState<{ product: PartnerProduct; quantity: number }[]>([]);
  const [editComment, setEditComment] = useState<string>('');
  const [editPickupDate, setEditPickupDate] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'card' | 'cash'>('card');
  const [editProductToAdd, setEditProductToAdd] = useState<string>('');

  if (!currentPoint) {
    return (
      <div className="pos-min-empty">
        <p>გთხოვთ აირჩიოთ გაყიდვის წერტილი</p>
      </div>
    );
  }

  // Drinks are excluded entirely from preorders
  const nonDrinkProducts = products.filter(p => {
    const cat = (p.category || '').toLowerCase();
    return !(cat.includes('drink') || cat.includes('detox') || cat.includes('სასმელ') || cat.includes('напит'));
  });

  const pointPreorders = getPointPreorders(currentPoint.id);
  const pendingPreorders = pointPreorders.filter(p => p.status === 'pending');
  const historyPreorders = pointPreorders.filter(p => p.status !== 'pending').slice(0, 20);

  const formatPickupLabel = (dateStr: string): string => {
    if (!dateStr) return '—';
    const tomorrow = new Date(tomorrowDateStr + 'T00:00:00');
    const today = new Date(tomorrow);
    today.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().slice(0, 10);
    if (dateStr === todayStr) return 'დღეს';
    if (dateStr === tomorrowDateStr) return 'ხვალ';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleConfirmCancel = () => {
    if (!preorderToCancel) return;
    cancelPreorder(preorderToCancel.id, cancelReason.trim() || undefined);
    setPreorderToCancel(null);
    setCancelReason('');
  };

  const handleOpenEditPreorder = (p: PartnerPreorder) => {
    const items = p.items
      .map(it => {
        const product = products.find(prod => prod.id === it.productId);
        return product ? { product, quantity: it.quantity } : null;
      })
      .filter(Boolean) as { product: PartnerProduct; quantity: number }[];
    setEditItems(items);
    setEditComment(p.comment);
    setEditPickupDate(p.pickupDate);
    setEditPaymentMethod(p.paymentMethod);
    setEditProductToAdd('');
    setEditingPreorder(p);
  };

  const updateEditQuantity = (productId: string, delta: number) => {
    setEditItems(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: PartnerProduct; quantity: number }[]
    );
  };

  const removeEditItem = (productId: string) => {
    setEditItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleAddEditProduct = () => {
    if (!editProductToAdd) return;
    const product = products.find(p => p.id === editProductToAdd);
    if (!product) return;
    setEditItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { product, quantity: 1 }];
    });
    setEditProductToAdd('');
  };

  const editSubtotal = editItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const editDiscount = Math.round((editSubtotal * 0.5) * 100) / 100;
  const editFinalTotal = Math.max(0, editSubtotal - editDiscount);

  const handleSaveEditPreorder = () => {
    if (!editingPreorder) return;
    if (editItems.length === 0) {
      alert('შეკვეთა არ შეიძლება იყოს ცარიელი.');
      return;
    }
    if (!editComment.trim()) {
      alert('გთხოვთ მიუთითოთ კომენტარი — ვისთვისაა შეკვეთა');
      return;
    }

    editPreorder({
      preorderId: editingPreorder.id,
      items: editItems,
      comment: editComment.trim(),
      pickupDate: editPickupDate,
      paymentMethod: editPaymentMethod,
    });

    setEditingPreorder(null);
  };

  const handleDeletePreorder = (p: PartnerPreorder) => {
    if (confirm(`გსურთ წინასწარი შეკვეთის #${p.preorderNumber} სრულად წაშლა? ავანსად გადახდილი თანხაც წაიშლება ანგარიშიდან.`)) {
      deletePreorder(p.id);
    }
  };

  return (
    <>
    <div className="partner-min-container">
      <div className="partner-min-head">
        <div>
          <h2><ClipboardList size={18} /> შეკვეთები</h2>
          <p>{currentPoint.name.ka || currentPoint.name.ru} • წინასწარი შეკვეთების მართვა (გაცემა, რედაქტირება, გაუქმება)</p>
        </div>
      </div>

      {/* Pending & recent preorders list */}
      <div className="partner-min-section">
        <h3 className="section-title">მომლოდინე წინასწარი შეკვეთები ({pendingPreorders.length})</h3>

        {pendingPreorders.length === 0 ? (
          <div className="partner-min-empty-card">
            <p>მომლოდინე წინასწარი შეკვეთები არ არის</p>
          </div>
        ) : (
          <div className="partner-min-table-wrap">
            <table className="partner-min-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>დრო</th>
                  <th style={{ width: '110px' }}>№</th>
                  <th style={{ width: '90px' }}>გატანა</th>
                  <th>პოზიციები</th>
                  <th>კომენტარი</th>
                  <th style={{ width: '110px' }}>გადახდილი</th>
                  <th style={{ width: '250px', textAlign: 'right' }}>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {pendingPreorders.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: '#94A3B8', fontSize: '12px' }}>
                      {new Date(p.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td><strong>#{p.preorderNumber}</strong></td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 7px',
                        borderRadius: '6px',
                        background: formatPickupLabel(p.pickupDate) === 'დღეს' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                        color: formatPickupLabel(p.pickupDate) === 'დღეს' ? '#F87171' : '#34D399',
                        border: '1px solid',
                        borderColor: formatPickupLabel(p.pickupDate) === 'დღეს' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                      }}>
                        <Calendar size={11} /> {formatPickupLabel(p.pickupDate)}
                      </span>
                    </td>
                    <td>
                      <div className="ship-chips">
                        {p.items.map((it, idx) => (
                          <span key={idx} className="chip">
                            {it.productName} <strong>({it.quantity})</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#E2E8F0' }}>{p.comment}</td>
                    <td>
                      <strong style={{ color: '#EC4899' }}>{p.totalAmount.toFixed(2)} ₾</strong>
                      <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {p.paymentMethod === 'card' ? <><CreditCard size={10} /> ბარათი</> : <><Banknote size={10} /> ნაღდი</>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => fulfillPreorder(p.id)}
                          className="partner-min-btn-outline"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          title="კლიენტმა გაიტანა შეკვეთა"
                        >
                          <Check size={12} /> გაცემულია
                        </button>
                        <button
                          onClick={() => handleOpenEditPreorder(p)}
                          className="partner-min-btn-outline"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          title="შეკვეთის რედაქტირება"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setPreorderToCancel(p)}
                          className="partner-min-danger-btn"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          title="შეკვეთის გაუქმება (ავანსი ბრუნდება)"
                        >
                          <X size={12} /> გაუქმება
                        </button>
                        <button
                          onClick={() => handleDeletePreorder(p)}
                          className="partner-min-danger-btn"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          title="შეკვეთის სრული წაშლა"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {historyPreorders.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: '18px' }}>ისტორია</h3>
            <div className="partner-min-table-wrap">
              <table className="partner-min-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>დრო</th>
                    <th style={{ width: '110px' }}>№</th>
                    <th style={{ width: '90px' }}>გატანა</th>
                    <th>პოზიციები</th>
                    <th>კომენტარი</th>
                    <th style={{ width: '110px' }}>თანხა</th>
                    <th style={{ width: '120px' }}>სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPreorders.map(p => (
                    <tr key={p.id} style={{ opacity: 0.65 }}>
                      <td style={{ color: '#94A3B8', fontSize: '12px' }}>
                        {new Date(p.createdAt).toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td><strong>#{p.preorderNumber}</strong></td>
                      <td style={{ fontSize: '11.5px', color: '#94A3B8' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {formatPickupLabel(p.pickupDate)}</span></td>
                      <td>
                        <div className="ship-chips">
                          {p.items.map((it, idx) => (
                            <span key={idx} className="chip">{it.productName} <strong>({it.quantity})</strong></span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#E2E8F0' }}>{p.comment}</td>
                      <td>{p.totalAmount.toFixed(2)} ₾</td>
                      <td>
                        {p.status === 'fulfilled' ? (
                          <span style={{ color: '#10B981', fontWeight: 700, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={11} /> გაცემულია</span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={11} /> გაუქმებული</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>

      {/* Cancel Confirmation Modal */}
      {preorderToCancel && (
        <div className="pos-modal-overlay" onClick={() => setPreorderToCancel(null)}>
          <div className="pos-min-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>შეკვეთის გაუქმება #{preorderToCancel.preorderNumber}</h3>
              <button onClick={() => setPreorderToCancel(null)} className="close-btn">
                <IconClose size={16} />
              </button>
            </div>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', marginBottom: '10px' }}>
              წინასწარი შეკვეთა გაუქმდება. ნაშთი წინასწარ ჩამოჭრილი არ იყო, ავანსად გადახდილი თანხა კი ავტომატურად დაბრუნდება (ჩეკებში გამოჩნდება როგორც დაბრუნებული).
            </p>
            <input
              type="text"
              placeholder="გაუქმების მიზეზი (არასაჭირო)..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                background: '#181B22',
                border: '1px solid #282E3A',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                marginBottom: '12px'
              }}
            />
            <button
              onClick={handleConfirmCancel}
              className="partner-min-danger-btn"
              style={{ width: '100%', padding: '9px', fontWeight: 700 }}
            >
              <X size={14} /> შეკვეთის გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* Edit Preorder Modal */}
      {editingPreorder && (
        <div className="pos-modal-overlay" onClick={() => setEditingPreorder(null)}>
          <div className="pos-min-modal" style={{ maxWidth: '520px', maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>შეკვეთის რედაქტირება #{editingPreorder.preorderNumber}</h3>
              <button onClick={() => setEditingPreorder(null)} className="close-btn">
                <IconClose size={16} />
              </button>
            </div>

            {/* Items */}
            <div style={{ background: '#181B22', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <strong style={{ fontSize: '13px', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>
                შემადგენლობა:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {editItems.map(item => (
                  <div
                    key={item.product.id}
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
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.product.name.ka || item.product.name.ru}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {item.product.price} ₾ × {item.quantity} = <strong>{item.product.price * item.quantity} ₾</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button type="button" onClick={() => updateEditQuantity(item.product.id, -1)} className="btn-step" style={{ width: '26px', height: '26px', background: '#282E3A', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button type="button" onClick={() => updateEditQuantity(item.product.id, 1)} className="btn-step" style={{ width: '26px', height: '26px', background: '#282E3A', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                      <button type="button" onClick={() => removeEditItem(item.product.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={editProductToAdd}
                  onChange={e => setEditProductToAdd(e.target.value)}
                  className="partner-min-input"
                  style={{ flex: 1, fontSize: '12.5px', background: '#111318' }}
                >
                  <option value="">+ რაციონის დამატება...</option>
                  {nonDrinkProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name.ka || p.name.ru} — {p.price} ₾
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddEditProduct}
                  disabled={!editProductToAdd}
                  className="partner-min-btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  დამატება
                </button>
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                კომენტარი (ვისთვისაა შეკვეთა):
              </label>
              <input
                type="text"
                value={editComment}
                onChange={e => setEditComment(e.target.value)}
                className="partner-min-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Pickup date + payment method */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  გატანის თარიღი:
                </label>
                <input
                  type="date"
                  min={tomorrowDateStr}
                  value={editPickupDate}
                  onChange={e => setEditPickupDate(e.target.value)}
                  className="partner-min-input"
                  style={{ width: '100%', colorScheme: 'dark' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  გადახდა:
                </label>
                <div className="pos-min-pay-tabs">
                  <button type="button" onClick={() => setEditPaymentMethod('card')} className={`pay-tab ${editPaymentMethod === 'card' ? 'active' : ''}`}><CreditCard size={14} /></button>
                  <button type="button" onClick={() => setEditPaymentMethod('cash')} className={`pay-tab ${editPaymentMethod === 'cash' ? 'active' : ''}`}><Banknote size={14} /></button>
                </div>
              </div>
            </div>

            {/* Totals preview */}
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
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>ავანსად გადასახდელი (-50%):</span>
                <div style={{ fontSize: '11px', color: '#64748B' }}>სრული ფასი: {editSubtotal.toFixed(2)} ₾</div>
              </div>
              <strong style={{ fontSize: '20px', color: '#EC4899' }}>{editFinalTotal.toFixed(2)} ₾</strong>
            </div>

            <button
              type="button"
              onClick={handleSaveEditPreorder}
              className="partner-min-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              <Save size={14} /> ცვლილებების შენახვა
            </button>
          </div>
        </div>
      )}
    </>
  );
};
