'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { PartnerProduct, PartnerSale, PartnerPreorder } from '@/types/partner';
import { IconTrash } from '@/components/Icons';
import { LazyProductImage } from '@/components/partner/LazyProductImage';
import {
  ShoppingCart, NotebookPen, Trash2, Package, Search, CreditCard, Banknote,
  Shuffle, Gift, Tag, Calendar, Check, X, MessageSquare,
} from 'lucide-react';

type OperationMode = 'sale' | 'preorder' | 'writeoff' | 'receive';

type CartItem = { product: PartnerProduct; quantity: number };

const MODE_META: Record<OperationMode, { label: string; icon: React.FC<{ size?: number }> }> = {
  sale: { label: 'გაყიდვა', icon: ShoppingCart },
  preorder: { label: 'წინასწარი შეკვეთა', icon: NotebookPen },
  writeoff: { label: 'ჩამოწერა', icon: Trash2 },
  receive: { label: 'მარაგის შევსება', icon: Package },
};

// Modes where the cart quantity is capped by the point's current stock.
const STOCK_LIMITED_MODES: OperationMode[] = ['sale', 'writeoff'];
// Modes that exclude drinks from the catalog (kitchen-only flows).
const NO_DRINKS_MODES: OperationMode[] = ['receive', 'preorder', 'writeoff'];

export const OperationsView: React.FC = () => {
  const {
    currentPoint,
    products,
    getPointStock,
    completeSale,
    createShipment,
    createWriteOff,
    notifyWriteOffBatch,
    createPreorder,
    getTomorrowDateStr,
    shipments,
    writeOffs,
  } = usePartner();

  const [operationMode, setOperationMode] = useState<OperationMode>('sale');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sale-specific state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'split' | 'free'>('card');
  const [splitCash, setSplitCash] = useState<string>('10');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [discountType, setDiscountType] = useState<'none' | 'percent50'>('none');
  const [discountComment, setDiscountComment] = useState<string>('');
  const [toastSale, setToastSale] = useState<PartnerSale | null>(null);

  // Receive-specific state
  const [deliveryNote, setDeliveryNote] = useState<string>('მიღება სამზარეულოდან');

  // Write-off-specific state
  const [reason, setReason] = useState<'expired' | 'damaged' | 'sample' | 'other'>('expired');
  const [note, setNote] = useState<string>('');

  // Preorder-specific state
  const [preorderComment, setPreorderComment] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<string>(() => getTomorrowDateStr());
  const [preorderPaymentMethod, setPreorderPaymentMethod] = useState<'card' | 'cash'>('card');
  const [toastPreorder, setToastPreorder] = useState<PartnerPreorder | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (toastSale) {
      const timer = setTimeout(() => setToastSale(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastSale]);

  React.useEffect(() => {
    if (toastPreorder) {
      const timer = setTimeout(() => setToastPreorder(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastPreorder]);

  if (!currentPoint) {
    return <div className="pos-min-empty"><p>გთხოვთ აირჩიოთ გაყიდვის წერტილი</p></div>;
  }

  const reasonLabels: Record<string, string> = {
    expired: 'ვადაგასული (72სთ)',
    damaged: 'შეფუთვის დაზიანება',
    sample: 'დეგუსტაცია',
    other: 'სხვა',
  };

  const maxAllowedQty = (productId: string): number => {
    if (!STOCK_LIMITED_MODES.includes(operationMode)) return Infinity;
    return getPointStock(currentPoint.id, productId);
  };

  const excludesDrinks = NO_DRINKS_MODES.includes(operationMode);

  const baseCategories = [
    { id: 'all', label: 'ყველა' },
    { id: 'poultry', label: 'ქათამი' },
    { id: 'fish', label: 'თევზი' },
    { id: 'meat', label: 'ხორცი' },
    { id: 'breakfast', label: 'საუზმე' },
    { id: 'dessert', label: 'დესერტები' },
  ];
  // Drinks are only sold directly at the register — preorder, write-off and
  // warehouse restocking are kitchen-only flows and never touch drinks.
  const categories = excludesDrinks
    ? baseCategories
    : [...baseCategories.slice(0, 5), { id: 'drinks', label: 'სასმელები' }, baseCategories[5]];

  const visibleProducts = excludesDrinks
    ? products.filter(p => {
        const cat = (p.category || '').toLowerCase();
        return !(cat.includes('drink') || cat.includes('detox') || cat.includes('სასმელ') || cat.includes('напит'));
      })
    : products;

  const filteredProducts = visibleProducts.filter(p => {
    if (selectedCategory !== 'all') {
      const cat = (p.category || '').toLowerCase();
      if (selectedCategory === 'fish' && !(cat.includes('fish') || cat.includes('seafood') || cat.includes('თევზ') || cat.includes('рыб'))) return false;
      if (selectedCategory === 'poultry' && !(cat.includes('poultry') || cat.includes('chicken') || cat.includes('ქათამ') || cat.includes('птиц'))) return false;
      if (selectedCategory === 'meat' && !(cat.includes('meat') || cat.includes('beef') || cat.includes('pork') || cat.includes('ხორც') || cat.includes('мяс'))) return false;
      if (selectedCategory === 'breakfast' && !(cat.includes('breakfast') || cat.includes('morning') || cat.includes('საუზმ') || cat.includes('завтрак'))) return false;
      if (selectedCategory === 'drinks' && !(cat.includes('drink') || cat.includes('detox') || cat.includes('სასმელ') || cat.includes('напит'))) return false;
      if (selectedCategory === 'dessert' && !(cat.includes('dessert') || cat.includes('snack') || cat.includes('დესერტ') || cat.includes('десерт'))) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameKa = (p.name?.ka || '').toLowerCase();
    const nameRu = (p.name?.ru || '').toLowerCase();
    const nameEn = (p.name?.en || '').toLowerCase();
    return nameKa.includes(q) || nameRu.includes(q) || nameEn.includes(q);
  });

  const addToCart = (product: PartnerProduct) => {
    const max = maxAllowedQty(product.id);
    const inCart = cart.find(item => item.product.id === product.id)?.quantity || 0;
    if (inCart >= max) {
      alert(`ხელმისაწვდომი ნაშთი: ${max} ც.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const max = maxAllowedQty(productId);
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > max) {
              alert(`ხელმისაწვდომი ნაშთი: ${max} ც.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
    setDiscountType('none');
    setDiscountComment('');
    setDeliveryNote('მიღება სამზარეულოდან');
    setNote('');
    setPreorderComment('');
    setPickupDate(getTomorrowDateStr());
    setPreorderPaymentMethod('card');
  };

  const handleModeChange = (mode: OperationMode) => {
    if (STOCK_LIMITED_MODES.includes(mode)) {
      // Sale / write-off are capped by current stock — clamp anything carried over from receive/preorder mode.
      let clamped = false;
      setCart(prev =>
        prev
          .map(item => {
            const stock = getPointStock(currentPoint.id, item.product.id);
            if (item.quantity > stock) clamped = true;
            return stock > 0 ? { ...item, quantity: Math.min(item.quantity, stock) } : null;
          })
          .filter(Boolean) as CartItem[]
      );
      if (clamped) {
        setTimeout(() => alert('რაოდენობები შეზღუდულია მიმდინარე ნაშთით.'), 0);
      }
    }
    if (NO_DRINKS_MODES.includes(mode) !== NO_DRINKS_MODES.includes(operationMode)) {
      setSelectedCategory('all');
    }
    setOperationMode(mode);
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Sale totals
  const isFreePayment = paymentMethod === 'free';
  const effectiveDiscountType = isFreePayment ? 'free' : discountType;
  let discountDeduction = 0;
  if (effectiveDiscountType === 'percent50') {
    discountDeduction = Math.round((rawSubtotal * 0.5) * 100) / 100;
  } else if (effectiveDiscountType === 'free') {
    discountDeduction = rawSubtotal;
  }
  const finalTotal = isFreePayment ? 0 : Math.max(0, rawSubtotal - discountDeduction);
  const splitCashVal = parseFloat(splitCash) || 0;
  const splitCardVal = Math.max(0, finalTotal - splitCashVal);
  const cashAmountNum = parseFloat(cashGiven) || 0;
  const change = Math.max(0, cashAmountNum - finalTotal);

  // Preorder totals: paid 50% in advance
  const preorderDiscount = Math.round((rawSubtotal * 0.5) * 100) / 100;
  const preorderTotal = Math.max(0, rawSubtotal - preorderDiscount);

  const handleSale = () => {
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

  const handleReceive = () => {
    if (cart.length === 0) return;
    const itemsToSend = cart.map(item => ({ productId: item.product.id, quantity: item.quantity }));
    const newShip = createShipment(currentPoint.id, itemsToSend, deliveryNote);
    setSuccessMsg(`მიღებულია +${newShip.totalUnits} ც. რაციონი (#${newShip.shipmentNumber})`);
    clearCart();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleWriteOff = () => {
    if (cart.length === 0) return;
    cart.forEach(item => {
      createWriteOff(currentPoint.id, item.product.id, item.quantity, reason, note);
    });
    notifyWriteOffBatch(
      currentPoint.id,
      cart.map(item => ({
        productName: item.product.name.ka || item.product.name.ru,
        quantity: item.quantity,
        totalValue: item.product.price * item.quantity,
      })),
      reasonLabels[reason] || reason,
      note.trim() || undefined
    );
    setSuccessMsg(`ჩამოწერილია ${cart.length} პოზიცია (${totalQuantity} ც., -${rawSubtotal.toFixed(2)} ₾)`);
    clearCart();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handlePreorder = () => {
    if (cart.length === 0) return;
    if (!preorderComment.trim()) {
      alert('გთხოვთ მიუთითოთ კომენტარი — ვისთვის/ვისზეა გაფორმებული წინასწარი შეკვეთა');
      return;
    }

    const preorder = createPreorder({
      pointId: currentPoint.id,
      items: cart,
      comment: preorderComment.trim(),
      pickupDate: pickupDate || getTomorrowDateStr(),
      paymentMethod: preorderPaymentMethod,
    });

    setToastPreorder(preorder);
    clearCart();
  };

  const pointShipments = shipments.filter(s => s.pointId === currentPoint.id);
  const pointWriteOffs = writeOffs.filter(w => w.pointId === currentPoint.id);
  const todayWriteOffs = pointWriteOffs.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString());
  const todayUnits = todayWriteOffs.reduce((sum, w) => sum + w.quantity, 0);
  const todayValue = todayWriteOffs.reduce((sum, w) => sum + (w.retailPrice || 0) * w.quantity, 0);
  const totalStock = products.reduce((sum, p) => sum + getPointStock(currentPoint.id, p.id), 0);

  return (
    <div className="ops-view-wrap">
      {/* Operation mode switcher */}
      <div className="ops-mode-switcher">
        {(['sale', 'preorder', 'writeoff'] as OperationMode[]).map(mode => {
          const Icon = MODE_META[mode].icon;
          return (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`ops-mode-btn ops-mode-${mode} ${operationMode === mode ? 'active' : ''}`}
            >
              <Icon size={15} /> {MODE_META[mode].label}
            </button>
          );
        })}
        <span className="ops-mode-divider" />
        <button
          onClick={() => handleModeChange('receive')}
          className={`ops-mode-btn ops-mode-receive ${operationMode === 'receive' ? 'active' : ''}`}
        >
          <Package size={15} /> {MODE_META.receive.label}
        </button>
      </div>

      {successMsg && (
        <div className="partner-min-alert">
          <span><Check size={14} /> {successMsg}</span>
        </div>
      )}

      <div className="pos-min-layout">
        {/* Left: Product Catalog (shared across all operations) */}
        <div className="pos-min-catalog">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="ძებნა (მაგ. ქათამი, წიწიბურა)..."
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
                }}
              />
            </div>
          </div>

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

          <div className="pos-min-grid">
            {filteredProducts.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: '#64748B',
                background: '#111318', borderRadius: '12px', border: '1px dashed #282E3A',
              }}>
                <Search size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
                <p style={{ fontSize: '15px', color: '#E2E8F0', fontWeight: 600 }}>რაციონი ვერ მოიძებნა</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const stock = getPointStock(currentPoint.id, product.id);
                const inCart = cart.find(item => item.product.id === product.id)?.quantity || 0;
                const isOutOfStock = STOCK_LIMITED_MODES.includes(operationMode) && stock <= 0;
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
                      {inCart > 0 && <div className="pos-min-cart-count">{inCart}</div>}
                    </div>
                    <div className="pos-min-card-body">
                      <h4 className="pos-min-card-name">{product.name?.ka || product.name?.ru || product.name?.en || 'კერძი'}</h4>
                      <div className="pos-min-card-meta">
                        <span>{product.calories} კკალ</span>
                        <span>•</span>
                        <span>{product.weightGrams} გრ</span>
                      </div>
                      <div className="pos-min-card-foot">
                        {operationMode !== 'receive' && <div className="pos-min-card-price">{product.price} <small>₾</small></div>}
                        <span className={`pos-min-stock-tag ${stock <= 3 ? 'low' : ''}`}>
                          {isOutOfStock ? 'არ არის' : `ნაშთი: ${stock} ც.`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Cart + operation-specific checkout */}
        <div className="pos-min-panel">
          <div className="pos-min-panel-head">
            <div>
              <h3>{React.createElement(MODE_META[operationMode].icon, { size: 16 })} {MODE_META[operationMode].label}</h3>
              <span className="point-sub">{currentPoint.name.ka || currentPoint.name.ru}</span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="pos-min-clear-btn">გასუფთავება</button>
            )}
          </div>

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
                    <span className="calc">
                      {operationMode === 'receive'
                        ? `ახლა: ${getPointStock(currentPoint.id, item.product.id)} ც. → +${item.quantity} ც.`
                        : `${item.product.price} ₾ × ${item.quantity} = ${(item.product.price * item.quantity).toFixed(2)} ₾`}
                    </span>
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

          {cart.length > 0 && operationMode === 'sale' && (
            <div className="pos-min-checkout-box">
              <div className="pos-min-pay-tabs">
                <button type="button" onClick={() => setPaymentMethod('card')} className={`pay-tab ${paymentMethod === 'card' ? 'active' : ''}`}><CreditCard size={13} /> ბარათი</button>
                <button type="button" onClick={() => setPaymentMethod('cash')} className={`pay-tab ${paymentMethod === 'cash' ? 'active' : ''}`}><Banknote size={13} /> ნაღდი</button>
                <button type="button" onClick={() => setPaymentMethod('split')} className={`pay-tab ${paymentMethod === 'split' ? 'active' : ''}`}><Shuffle size={13} /> შერეული</button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('free')}
                  className={`pay-tab ${paymentMethod === 'free' ? 'active' : ''}`}
                  style={{ background: paymentMethod === 'free' ? '#A855F7' : undefined, color: paymentMethod === 'free' ? '#FFFFFF' : undefined }}
                >
                  <Gift size={13} /> უფასო
                </button>
              </div>

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

              {paymentMethod !== 'free' && (
                <div className="pos-discounts-box">
                  <div className="discount-pills">
                    <button
                      type="button"
                      onClick={() => setDiscountType(prev => prev === 'percent50' ? 'none' : 'percent50')}
                      className={`disc-pill ${discountType === 'percent50' ? 'active' : ''}`}
                    >
                      <Tag size={13} /> -50% ფასდაკლება (-{(rawSubtotal * 0.5).toFixed(2)} ₾)
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

              {paymentMethod === 'split' && (
                <div className="pos-split-inputs-wrap">
                  <div className="split-row">
                    <label>ნაღდით (₾):</label>
                    <input type="number" min="0" max={finalTotal} value={splitCash} onChange={e => setSplitCash(e.target.value)} className="split-num-input" />
                  </div>
                  <div className="split-row">
                    <label>ბარათით (₾):</label>
                    <strong className="split-card-val">{splitCardVal.toFixed(2)} ₾</strong>
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="pos-min-cash-calc">
                  <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="მიღებული თანხა (₾)" className="pos-min-cash-input" />
                  {cashAmountNum > finalTotal && (
                    <span className="change-info">ხურდა: <strong>{change.toFixed(2)} ₾</strong></span>
                  )}
                </div>
              )}

              <div className="pos-min-totals">
                <div>
                  <span>{totalQuantity} პოზ.</span>
                  {paymentMethod === 'free' ? (
                    <span className="disc-applied-tag" style={{ color: '#A855F7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>(<Gift size={11} /> უფასო)</span>
                  ) : discountType === 'percent50' ? (
                    <span className="disc-applied-tag">(-50%: -{(rawSubtotal * 0.5).toFixed(2)} ₾)</span>
                  ) : null}
                </div>
                <div className="total-val">
                  {paymentMethod === 'free' ? <span style={{ color: '#A855F7' }}>0.00 <small>₾</small></span> : <>{finalTotal.toFixed(2)} <small>₾</small></>}
                </div>
              </div>

              <button onClick={handleSale} className="pos-min-charge-btn">
                {paymentMethod === 'free' ? (
                  <><Gift size={14} /> გაყიდვის გაფორმება (უფასო)</>
                ) : (
                  `გაყიდვის გაფორმება (${finalTotal.toFixed(2)} ₾)`
                )}
              </button>
            </div>
          )}

          {cart.length > 0 && operationMode === 'receive' && (
            <div className="pos-min-checkout-box">
              <div className="discount-comment-wrap" style={{ marginTop: 0 }}>
                <input
                  type="text"
                  placeholder="კომენტარი / ზედნადების ნომერი..."
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                  className="discount-comment-input"
                />
              </div>
              <div className="pos-min-totals">
                <div><span>{cart.length} პოზ.</span></div>
                <div className="total-val" style={{ color: '#10B981' }}>+{totalQuantity} <small>ც.</small></div>
              </div>
              <button onClick={handleReceive} className="pos-min-charge-btn" style={{ background: '#10B981', color: '#000' }}>
                მიღების დადასტურება (+{totalQuantity} ც.)
              </button>
            </div>
          )}

          {cart.length > 0 && operationMode === 'writeoff' && (
            <div className="pos-min-checkout-box">
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px', display: 'block' }}>მიზეზი (ეხება ყველა პოზიციას):</label>
                <select value={reason} onChange={e => setReason(e.target.value as any)} className="partner-min-input">
                  <option value="expired">ვადაგასული (72სთ)</option>
                  <option value="damaged">შეფუთვის დაზიანება</option>
                  <option value="sample">დეგუსტაცია</option>
                  <option value="other">სხვა</option>
                </select>
              </div>
              <div className="discount-comment-wrap" style={{ marginTop: 0 }}>
                <input
                  type="text"
                  placeholder="შენიშვნა (არასავალდებულო)..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="discount-comment-input"
                />
              </div>
              <div className="pos-min-totals">
                <div><span>{cart.length} პოზ.</span></div>
                <div className="total-val" style={{ color: '#F87171' }}>-{totalQuantity} <small>ც.</small></div>
              </div>
              <button onClick={handleWriteOff} className="partner-min-danger-btn">
                ჩამოწერა — {cart.length} პოზიცია ({totalQuantity} ც.)
              </button>
            </div>
          )}

          {cart.length > 0 && operationMode === 'preorder' && (
            <div className="pos-min-checkout-box">
              <div className="discount-comment-wrap" style={{ marginTop: 0 }}>
                <input
                  type="text"
                  required
                  placeholder="კომენტარი: ვისთვისაა შეკვეთა (სახელი, გვარი, ტელეფონი)..."
                  value={preorderComment}
                  onChange={e => setPreorderComment(e.target.value)}
                  className="discount-comment-input"
                  style={{ borderColor: '#EC4899', background: 'rgba(236, 72, 153, 0.08)' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  გატანის თარიღი:
                </label>
                <input
                  type="date"
                  required
                  min={getTomorrowDateStr()}
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#181B22',
                    border: '1px solid #282E3A',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div className="pos-min-pay-tabs" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setPreorderPaymentMethod('card')} className={`pay-tab ${preorderPaymentMethod === 'card' ? 'active' : ''}`}><CreditCard size={13} /> ბარათი</button>
                <button type="button" onClick={() => setPreorderPaymentMethod('cash')} className={`pay-tab ${preorderPaymentMethod === 'cash' ? 'active' : ''}`}><Banknote size={13} /> ნაღდი</button>
              </div>

              <div className="pos-min-totals">
                <div>
                  <span>{totalQuantity} პოზ.</span>
                  <span className="disc-applied-tag">(-50%: -{preorderDiscount.toFixed(2)} ₾)</span>
                </div>
                <div className="total-val">{preorderTotal.toFixed(2)} <small>₾</small></div>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '-6px', marginBottom: '6px' }}>
                სრული ფასი: {rawSubtotal.toFixed(2)} ₾ · ავანსად გადასახდელი (-50%): <strong style={{ color: '#EC4899' }}>{preorderTotal.toFixed(2)} ₾</strong>
              </div>

              <button onClick={handlePreorder} className="pos-min-charge-btn" style={{ background: '#EC4899' }}>
                წინასწარი შეკვეთის გაფორმება ({preorderTotal.toFixed(2)} ₾)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Operation-specific history / context below the main workspace */}
      {operationMode === 'writeoff' && (
        <div className="partner-min-section" style={{ marginTop: '16px' }}>
          <div className="partner-min-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '16px' }}>
            <div className="partner-min-kpi highlight">
              <span className="label">დღეს ჩამოწერილი</span>
              <strong className="value" style={{ color: '#EF4444' }}>{todayUnits} ც.</strong>
              <span className="sub">{todayWriteOffs.length} ოპერაცია</span>
            </div>
            <div className="partner-min-kpi">
              <span className="label">დღევანდელი ზარალი (ფასდაკლება)</span>
              <strong className="value" style={{ color: '#F87171' }}>-{todayValue.toFixed(2)} ₾</strong>
              <span className="sub">საცალო ფასებში</span>
            </div>
          </div>

          <h3 className="section-title">ჩამოწერების ჟურნალი ({pointWriteOffs.length})</h3>
          {pointWriteOffs.length === 0 ? (
            <div className="partner-min-empty-card"><p>ჩამოწერები არ არის</p></div>
          ) : (
            <div className="partner-min-table-wrap">
              <table className="partner-min-table">
                <thead>
                  <tr><th>დრო</th><th>რაციონი</th><th>რაოდ.</th><th>ღირებულება</th><th>მიზეზი</th></tr>
                </thead>
                <tbody>
                  {pointWriteOffs.map(w => (
                    <tr key={w.id}>
                      <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {new Date(w.createdAt).toLocaleString('ka-GE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </td>
                      <td><strong>{w.productName}</strong></td>
                      <td><span className="qty-minus">-{w.quantity}</span></td>
                      <td style={{ color: '#F87171' }}>{w.retailPrice ? `-${(w.retailPrice * w.quantity).toFixed(2)} ₾` : '—'}</td>
                      <td>{w.reasonText || reasonLabels[w.reason] || w.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {operationMode === 'receive' && (
        <div className="partner-min-section" style={{ marginTop: '16px' }}>
          <div className="partner-min-tag-stock" style={{ background: '#181B22', border: '1px solid #282E3A', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'inline-block', marginBottom: '16px' }}>
            ნაშთი ვიტრინაზე: <strong style={{ color: '#10B981', fontSize: '15px' }}>{totalStock} ც.</strong>
          </div>

          <h3 className="section-title">მიღებების ისტორია ({pointShipments.length})</h3>
          {pointShipments.length === 0 ? (
            <div className="partner-min-empty-card" style={{ padding: '40px 20px', textAlign: 'center', background: '#111318', borderRadius: '12px', border: '1px dashed #282E3A', color: '#64748B' }}>
              <p style={{ fontSize: '14px' }}>მიღებები ჯერ არ არის დაფიქსირებული</p>
            </div>
          ) : (
            <div className="partner-min-table-wrap">
              <table className="partner-min-table">
                <thead>
                  <tr><th>ზედნადები</th><th>თარიღი და დრო</th><th>რაოდენობა</th><th>შემადგენლობა</th><th>სტატუსი</th></tr>
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
                        {ship.note && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={11} /> {ship.note}</div>}
                      </td>
                      <td><span className="badge-ok"><Check size={11} /> მიღებულია</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Success Toast Notification for Sales */}
      {toastSale && (
        <div
          onClick={() => setToastSale(null)}
          style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111318',
            border: '1px solid #10B981', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(16, 185, 129, 0.2)',
            borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', maxWidth: '380px', animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
            <Check size={16} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '13.5px' }}>გაყიდვა გაფორმდა</strong>
              <span style={{ fontSize: '11px', color: '#64748B' }}>#{toastSale.receiptNumber}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{toastSale.totalAmount} ₾</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {toastSale.paymentMethod === 'free' || toastSale.discountType === 'free' || toastSale.totalAmount === 0 ? (
                  <><Gift size={12} /> უფასო</>
                ) : toastSale.paymentMethod === 'card' ? (
                  <><CreditCard size={12} /> ბარათით</>
                ) : toastSale.paymentMethod === 'cash' ? (
                  <><Banknote size={12} /> ნაღდით</>
                ) : (
                  <><Shuffle size={12} /> შერეული</>
                )}
              </span>
              <span>•</span>
              <span>{toastSale.items.reduce((s, it) => s + it.quantity, 0)} ც.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setToastSale(null); }}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Success Toast Notification for Preorders */}
      {toastPreorder && (
        <div
          onClick={() => setToastPreorder(null)}
          style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111318',
            border: '1px solid #EC4899', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(236, 72, 153, 0.2)',
            borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', maxWidth: '380px', animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899', flexShrink: 0 }}>
            <Check size={16} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '13.5px' }}>წინასწარი შეკვეთა შექმნილია</strong>
              <span style={{ fontSize: '11px', color: '#64748B' }}>#{toastPreorder.preorderNumber}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              <span style={{ color: '#EC4899', fontWeight: 700 }}>{toastPreorder.totalAmount} ₾</span> ავანსად · {toastPreorder.items.reduce((s, it) => s + it.quantity, 0)} ც.
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setToastPreorder(null); }}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
