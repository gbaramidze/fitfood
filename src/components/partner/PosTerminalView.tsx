'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';
import { PartnerProduct, PartnerSale } from '@/types/partner';
import { IconClose, IconCheck, IconTrash } from '@/components/Icons';
import { LazyProductImage } from '@/components/partner/LazyProductImage';

export const PosTerminalView: React.FC = () => {
  const { currentPoint, products, getPointStock, completeSale, quickRestockPoint } = usePartner();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ product: PartnerProduct; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'split' | 'free'>('card');
  const [splitCash, setSplitCash] = useState<string>('10');
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // Discounts
  const [discountType, setDiscountType] = useState<'none' | 'percent50'>('none');
  const [discountComment, setDiscountComment] = useState<string>('');

  // Toast Notification
  const [toastSale, setToastSale] = useState<PartnerSale | null>(null);
  const [restockMsg, setRestockMsg] = useState<string | null>(null);

  // Auto-dismiss toast notification
  React.useEffect(() => {
    if (toastSale) {
      const timer = setTimeout(() => {
        setToastSale(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastSale]);

  if (!currentPoint) {
    return (
      <div className="pos-min-empty">
        <p>გთხოვთ აირჩიოთ გაყიდვის წერტილი</p>
      </div>
    );
  }

  const categories = [
    { id: 'all', label: 'ყველა' },
    { id: 'poultry', label: 'ქათამი' },
    { id: 'fish', label: 'თევზი' },
    { id: 'meat', label: 'ხორცი' },
    { id: 'breakfast', label: 'საუზმე' },
    { id: 'drinks', label: 'სასმელები' },
    { id: 'dessert', label: 'დესერტები' },
  ];

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all') {
      const cat = (p.category || '').toLowerCase();
      if (selectedCategory === 'fish' && !(cat.includes('fish') || cat.includes('seafood') || cat.includes('თევზ') || cat.includes('рыб'))) {
        return false;
      }
      if (selectedCategory === 'poultry' && !(cat.includes('poultry') || cat.includes('chicken') || cat.includes('ქათამ') || cat.includes('птиц'))) {
        return false;
      }
      if (selectedCategory === 'meat' && !(cat.includes('meat') || cat.includes('beef') || cat.includes('pork') || cat.includes('ხორც') || cat.includes('мяс'))) {
        return false;
      }
      if (selectedCategory === 'breakfast' && !(cat.includes('breakfast') || cat.includes('morning') || cat.includes('საუზმ') || cat.includes('завтрак'))) {
        return false;
      }
      if (selectedCategory === 'drinks' && !(cat.includes('drink') || cat.includes('detox') || cat.includes('სასმელ') || cat.includes('напит'))) {
        return false;
      }
      if (selectedCategory === 'dessert' && !(cat.includes('dessert') || cat.includes('snack') || cat.includes('დესერტ') || cat.includes('десерт'))) {
        return false;
      }
    }
    if (!searchQuery.trim()) {
      return true;
    }
    const q = searchQuery.toLowerCase().trim();
    const nameKa = (p.name?.ka || '').toLowerCase();
    const nameRu = (p.name?.ru || '').toLowerCase();
    const nameEn = (p.name?.en || '').toLowerCase();
    const catKa = (p.categoryName?.ka || '').toLowerCase();
    const catRu = (p.categoryName?.ru || '').toLowerCase();
    const catEn = (p.categoryName?.en || '').toLowerCase();
    const caloriesStr = p.calories ? `${p.calories}` : '';
    const priceStr = p.price ? `${p.price}` : '';
    return nameKa.includes(q) || nameRu.includes(q) || nameEn.includes(q) || catKa.includes(q) || catRu.includes(q) || catEn.includes(q) || caloriesStr.includes(q) || priceStr.includes(q);
  });

  const addToCart = (product: PartnerProduct) => {
    const currentStock = getPointStock(currentPoint.id, product.id);
    const inCart = cart.find(item => item.product.id === product.id)?.quantity || 0;

    if (inCart >= currentStock) {
      alert(`ხელმისაწვდომი ნაშთი: ${currentStock} ც.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const currentStock = getPointStock(currentPoint.id, productId);

    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > currentStock) {
              alert(`ნაშთი წერტილზე: ${currentStock} ც.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: PartnerProduct; quantity: number }[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
    setDiscountType('none');
    setDiscountComment('');
  };

  const rawSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isFreePayment = paymentMethod === 'free';
  const effectiveDiscountType = isFreePayment ? 'free' : discountType;

  // Discount calculation (-50% on subtotal or 100% if free)
  let discountDeduction = 0;
  if (effectiveDiscountType === 'percent50') {
    discountDeduction = Math.round((rawSubtotal * 0.5) * 100) / 100;
  } else if (effectiveDiscountType === 'free') {
    discountDeduction = rawSubtotal;
  }

  const finalTotal = isFreePayment ? 0 : Math.max(0, rawSubtotal - discountDeduction);

  // Split calculations
  const splitCashVal = parseFloat(splitCash) || 0;
  const splitCardVal = Math.max(0, finalTotal - splitCashVal);

  const cashAmountNum = parseFloat(cashGiven) || 0;
  const change = Math.max(0, cashAmountNum - finalTotal);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const isFree = paymentMethod === 'free';
    const effDiscountType = isFree ? 'free' : discountType;

    if (isFree && !discountComment.trim()) {
      alert('გთხოვთ მიუთითოთ ვისთვის არის უფასო რაციონი (მწვრთნელი, ხელმძღვანელობა და ა.შ.)');
      return;
    }

    if (!isFree && discountType === 'percent50' && !discountComment.trim()) {
      alert('გთხოვთ მიუთითოთ ვისთვის არის -50% ფასდაკლება (მაგალითად: მწვრთნელი, თანამშრომელი, აქცია)');
      return;
    }

    if (paymentMethod === 'cash' && cashGiven && cashAmountNum < finalTotal) {
      alert(`თანხა (${cashAmountNum} ₾) არ არის საკმარისი გადასახდელად (${finalTotal} ₾)`);
      return;
    }

    const sale = completeSale({
      pointId: currentPoint.id,
      items: cart,
      paymentMethod,
      splitDetails: paymentMethod === 'split' ? { cashAmount: splitCashVal, cardAmount: splitCardVal } : undefined,
      discountType: effDiscountType,
      discountComment: discountComment.trim() || undefined,
    });

    setToastSale(sale);
    clearCart();
  };

  return (
    <div className="pos-min-layout">
      {/* Left: Product Catalog */}
      <div className="pos-min-catalog">
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: '#64748B', fontSize: '14px', pointerEvents: 'none' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="ძებნა (მაგ. ქათამი, წიწიბურა, 420 კკალ)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 36px 8px 36px',
                background: '#13161C',
                border: '1px solid #282E3A',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#10B981'}
              onBlur={e => e.currentTarget.style.borderColor = '#282E3A'}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="pos-min-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`pos-min-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="pos-min-grid">
          {filteredProducts.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#64748B',
              background: '#111318',
              borderRadius: '12px',
              border: '1px dashed #282E3A'
            }}>
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</span>
              <p style={{ fontSize: '15px', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                რაციონი ვერ მოიძებნა
              </p>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '14px' }}>
                {searchQuery ? `მოძებნილია: «${searchQuery}»` : 'ამ კატეგორიაში რაციონები არ არის'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                style={{
                  background: '#181B22',
                  border: '1px solid #282E3A',
                  color: '#10B981',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ფილტრის გასუფთავება
              </button>
            </div>
          ) : (
            filteredProducts.map(product => {
              const stock = getPointStock(currentPoint.id, product.id);
              const inCart = cart.find(item => item.product.id === product.id)?.quantity || 0;
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={product.id}
                  className={`pos-min-card ${isOutOfStock ? 'disabled' : ''}`}
                  onClick={() => !isOutOfStock && addToCart(product)}
                >
                  <div className="pos-min-card-img-box">
                    <LazyProductImage
                      productId={product.id}
                      alt={product.name?.ka || product.name?.ru || 'კერძი'}
                      className="pos-min-card-img"
                      sizes="200px"
                    />
                    {inCart > 0 && (
                      <div className="pos-min-cart-count">{inCart}</div>
                    )}
                  </div>

                  <div className="pos-min-card-body">
                    <h4 className="pos-min-card-name">{product.name?.ka || product.name?.ru || product.name?.en || 'კერძი'}</h4>
                    <div className="pos-min-card-meta">
                      <span>{product.calories} კკალ</span>
                      <span>•</span>
                      <span>{product.weightGrams} გრ</span>
                    </div>

                    <div className="pos-min-card-foot">
                      <div className="pos-min-card-price">{product.price} <small>₾</small></div>
                      <span className={`pos-min-stock-tag ${stock <= 3 ? 'low' : ''}`}>
                        {isOutOfStock ? 'არ არის' : `${stock} ც.`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Order Receipt */}
      <div className="pos-min-panel">
        <div className="pos-min-panel-head">
          <div>
            <h3>ჩეკი</h3>
            <span className="point-sub">{currentPoint.name.ka || currentPoint.name.ru}</span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="pos-min-clear-btn">
              გასუფთავება
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="pos-min-items-wrap">
          {cart.length === 0 ? (
            <div className="pos-min-empty-cart">
              <p>აირჩიეთ რაციონი მენიუდან</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="pos-min-item-row">
                <div className="item-info">
                  <span className="name">{item.product.name.ka || item.product.name.ru}</span>
                  <span className="calc">{item.product.price} ₾ × {item.quantity} = <strong>{item.product.price * item.quantity} ₾</strong></span>
                </div>

                <div className="item-controls">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="btn-step">-</button>
                  <span className="qty">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="btn-step">+</button>
                  <button onClick={() => removeFromCart(item.product.id)} className="btn-del">
                    <IconTrash size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Checkout Controls */}
        {cart.length > 0 && (
          <div className="pos-min-checkout-box">
            {/* Payment Mode Tabs: Card / Cash / Split / Free */}
            <div className="pos-min-pay-tabs">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`pay-tab ${paymentMethod === 'card' ? 'active' : ''}`}
              >
                💳 ბარათი
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`pay-tab ${paymentMethod === 'cash' ? 'active' : ''}`}
              >
                💵 ნაღდი
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`pay-tab ${paymentMethod === 'split' ? 'active' : ''}`}
              >
                🔀 შერეული
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('free')}
                className={`pay-tab ${paymentMethod === 'free' ? 'active' : ''}`}
                style={{
                  background: paymentMethod === 'free' ? '#A855F7' : undefined,
                  color: paymentMethod === 'free' ? '#FFFFFF' : undefined,
                }}
              >
                🎁 უფასო
              </button>
            </div>

            {/* If Free Payment: Required Comment */}
            {paymentMethod === 'free' && (
              <div className="discount-comment-wrap" style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  required
                  placeholder="ვისთვის არის უფასო რაციონი (მწვრთნელი, ადმინისტრაცია)..."
                  value={discountComment}
                  onChange={e => setDiscountComment(e.target.value)}
                  className="discount-comment-input"
                  style={{ borderColor: '#A855F7', background: 'rgba(168, 85, 247, 0.08)' }}
                />
              </div>
            )}

            {/* If Paid Payment: Optional -50% Discount */}
            {paymentMethod !== 'free' && (
              <div className="pos-discounts-box">
                <div className="discount-pills">
                  <button
                    type="button"
                    onClick={() => setDiscountType(prev => prev === 'percent50' ? 'none' : 'percent50')}
                    className={`disc-pill ${discountType === 'percent50' ? 'active' : ''}`}
                  >
                    🏷️ -50% ფასდაკლება (-{(rawSubtotal * 0.5).toFixed(2)} ₾)
                  </button>
                </div>

                {discountType === 'percent50' && (
                  <div className="discount-comment-wrap">
                    <input
                      type="text"
                      required
                      placeholder={`ვისთვის არის -50% ფასდაკლება (-${(rawSubtotal * 0.5).toFixed(2)} ₾)...`}
                      value={discountComment}
                      onChange={e => setDiscountComment(e.target.value)}
                      className="discount-comment-input"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Split inputs */}
            {paymentMethod === 'split' && (
              <div className="pos-split-inputs-wrap">
                <div className="split-row">
                  <label>ნაღდით (₾):</label>
                  <input
                    type="number"
                    min="0"
                    max={finalTotal}
                    value={splitCash}
                    onChange={e => setSplitCash(e.target.value)}
                    className="split-num-input"
                  />
                </div>
                <div className="split-row">
                  <label>ბარათით (₾):</label>
                  <strong className="split-card-val">{splitCardVal.toFixed(2)} ₾</strong>
                </div>
              </div>
            )}

            {/* Cash Calculator */}
            {paymentMethod === 'cash' && (
              <div className="pos-min-cash-calc">
                <input
                  type="number"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  placeholder="მიღებული თანხა (₾)"
                  className="pos-min-cash-input"
                />
                {cashAmountNum > finalTotal && (
                  <span className="change-info">ხურდა: <strong>{change.toFixed(2)} ₾</strong></span>
                )}
              </div>
            )}

            {/* Total Row */}
            <div className="pos-min-totals">
              <div>
                <span>{totalQuantity} პოზ.</span>
                {paymentMethod === 'free' ? (
                  <span className="disc-applied-tag" style={{ color: '#A855F7' }}>(🎁 უფასო)</span>
                ) : discountType === 'percent50' ? (
                  <span className="disc-applied-tag">(-50%: -{(rawSubtotal * 0.5).toFixed(2)} ₾)</span>
                ) : null}
              </div>
              <div className="total-val">
                {paymentMethod === 'free' ? (
                  <span style={{ color: '#A855F7' }}>0.00 <small>₾</small></span>
                ) : (
                  <>
                    {finalTotal.toFixed(2)} <small>₾</small>
                  </>
                )}
              </div>
            </div>

            <button onClick={handleCheckout} className="pos-min-charge-btn">
              {paymentMethod === 'free' ? 'გაყიდვის გაფორმება (🎁 უფასო)' : `გაყიდვის გაფორმება (${finalTotal.toFixed(2)} ₾)`}
            </button>
          </div>
        )}
      </div>

      {/* Success Toast Notification (Non-blocking, Auto-dismiss) */}
      {toastSale && (
        <div
          onClick={() => setToastSale(null)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: '#111318',
            border: '1px solid #10B981',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            maxWidth: '380px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0,
              fontSize: '16px',
              fontWeight: 800,
            }}
          >
            ✓
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '13.5px' }}>
                გაყიდვა გაფორმდა
              </strong>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                #{toastSale.receiptNumber}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{toastSale.totalAmount} ₾</span>
              <span>•</span>
              <span>
                {toastSale.paymentMethod === 'free' || toastSale.discountType === 'free' || toastSale.totalAmount === 0
                  ? '🎁 უფასო'
                  : toastSale.paymentMethod === 'card'
                  ? '💳 ბარათით'
                  : toastSale.paymentMethod === 'cash'
                  ? '💵 ნაღდით'
                  : '🔀 შერეული'}
              </span>
              <span>•</span>
              <span>{toastSale.items.reduce((s, it) => s + it.quantity, 0)} ც.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setToastSale(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
