'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { batumiZones } from '@/data/batumiZones';
import { IconMapPin, IconClock, IconShield, IconCheck, IconCart, IconGift, IconArrowRight } from '@/components/Icons';
import { getAllergenDisplayName } from '@/data/allergensList';

export default function CheckoutPage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { cart, addOrder, clearCart } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedZone, setSelectedZone] = useState(batumiZones[0].id);
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [deliverySlot, setDeliverySlot] = useState<'morning' | 'comfort' | 'evening'>('morning');
  const [paymentMethod, setPaymentMethod] = useState<'tbc' | 'bog_apple_pay' | 'cash'>('bog_apple_pay');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  if (!cart && !isSubmitted) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--text-muted)' }}>
          <IconCart size={32} />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '12px' }}>
          {t.cart.empty}
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
          {t.cart.emptySub}
        </p>
        <Link href="/menu" className="btn btn-primary">
          {t.nav.menu}
        </Link>
      </div>
    );
  }

  const isCert = cart?.type === 'certificate';
  const currentZone = batumiZones.find(z => z.id === selectedZone) || batumiZones[0];
  const deliveryCost = isCert && cart?.certificateDetails?.deliveryFormat === 'digital' ? 0 : currentZone.priceGEL;
  const orderTotal = cart ? cart.totalPriceGEL + deliveryCost : 0;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || (!isCert && !address)) {
      alert('Пожалуйста, заполните контактные данные и адрес доставки');
      return;
    }

    const newOrderNum = `MB-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(newOrderNum);

    if (cart) {
      addOrder({
        orderId: newOrderNum,
        createdAt: new Date().toISOString(),
        status: 'preparing',
        customerName: name,
        phone,
        address: address || 'Digital Delivery',
        zone: currentZone.name[locale],
        deliveryDate: cart.startDate || new Date().toISOString().split('T')[0],
        deliverySlot,
        paymentMethod,
        totalPriceGEL: orderTotal,
        cartItem: cart,
      });
    }

    clearCart();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="container" style={{ padding: '80px 20px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--accent-green-light)',
          color: '#00A859',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '1px solid rgba(0, 168, 89, 0.3)',
        }}>
          <IconCheck size={40} />
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '12px' }}>
          Заказ #{orderNumber} успешно оформлен!
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
          Мы отправили детали подтверждения на указанный номер телефона и email. Наш оператор свяжется с вами для уточнения деталей.
        </p>

        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', textAlign: 'left', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Клиент:</span>
            <span style={{ color: 'var(--text-heading)', fontWeight: 700 }}>{name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Сумма к оплате:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 800, fontSize: '18px' }}>{orderTotal} GEL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Способ оплаты:</span>
            <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{paymentMethod === 'bog_apple_pay' ? 'Apple Pay / BOG' : paymentMethod === 'tbc' ? 'TBC Bank Online' : 'Оплата курьеру'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
          <Link href="/account" className="btn btn-primary">
            Перейти в личный кабинет
          </Link>
          <Link href="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-pad" style={{ padding: '60px 0 100px', background: 'var(--bg-page)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '36px' }}>
          {t.checkout.title}
        </h1>

        <form onSubmit={handleSubmitOrder}>
          <div className="checkout-layout-grid">
            {/* Left Col: Customer & Delivery Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
              {/* 1. Contacts */}
              <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '20px' }}>
                  1. {t.checkout.step1}
                </h3>

                <div className="checkout-fields-2col">
                  <div>
                    <label className="config-label">{t.checkout.fullName}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={locale === 'ru' ? 'Иван Иванов' : locale === 'ka' ? 'გიორგი ბერიძე' : 'John Doe'}
                      className="config-input-text"
                    />
                  </div>
                  <div>
                    <label className="config-label">{t.checkout.phone}</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+995 5XX XX XX XX"
                      className="config-input-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="config-label">{t.checkout.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="config-input-text"
                  />
                </div>
              </div>

              {/* 2. Address & Delivery */}
              <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '20px' }}>
                  2. {t.checkout.step2}
                </h3>

                {!isCert || cart?.certificateDetails?.deliveryFormat === 'luxury-box' ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="config-label">{locale === 'ru' ? 'Зона доставки' : locale === 'ka' ? 'მიტანის ზონა' : 'Delivery Zone'}</label>
                      <select
                        value={selectedZone}
                        onChange={e => setSelectedZone(e.target.value)}
                        className="config-input-text"
                        style={{ background: '#FFFFFF' }}
                      >
                        {batumiZones.map(z => (
                          <option key={z.id} value={z.id}>
                            {z.name[locale]} ({z.priceGEL === 0 ? (locale === 'ru' ? 'Бесплатно' : locale === 'ka' ? 'უფასო' : 'Free') : `+${z.priceGEL} GEL`})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="config-label">{t.checkout.address}</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder={locale === 'ru' ? 'Улица, дом, кв / Отель и номер' : locale === 'ka' ? 'ქუჩა, ბინა / სასტუმროს ნომერი' : 'Street, apt / Hotel room'}
                        className="config-input-text"
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="config-label">{t.cart.deliveryTime}</label>
                      <div className="checkout-slots-3col">
                        <button
                          type="button"
                          className="btn"
                          style={{
                            border: '1.5px solid',
                            borderColor: deliverySlot === 'morning' ? 'var(--accent-green)' : 'var(--border)',
                            background: deliverySlot === 'morning' ? 'var(--accent-green-light)' : '#FFFFFF',
                            color: deliverySlot === 'morning' ? '#008746' : 'var(--text-heading)',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '10px 6px',
                          }}
                          onClick={() => setDeliverySlot('morning')}
                        >
                          06:30 - 08:30
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            border: '1.5px solid',
                            borderColor: deliverySlot === 'comfort' ? 'var(--accent-green)' : 'var(--border)',
                            background: deliverySlot === 'comfort' ? 'var(--accent-green-light)' : '#FFFFFF',
                            color: deliverySlot === 'comfort' ? '#008746' : 'var(--text-heading)',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '10px 6px',
                          }}
                          onClick={() => setDeliverySlot('comfort')}
                        >
                          08:30 - 10:30
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            border: '1.5px solid',
                            borderColor: deliverySlot === 'evening' ? 'var(--accent-green)' : 'var(--border)',
                            background: deliverySlot === 'evening' ? 'var(--accent-green-light)' : '#FFFFFF',
                            color: deliverySlot === 'evening' ? '#008746' : 'var(--text-heading)',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '10px 6px',
                          }}
                          onClick={() => setDeliverySlot('evening')}
                        >
                          19:00 - 21:00
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '16px', background: 'var(--accent-green-light)', borderRadius: 'var(--radius-md)', color: '#008746', fontSize: '14px', fontWeight: 600 }}>
                    {locale === 'ru'
                      ? 'Электронный сертификат будет мгновенно отправлен на email и номер телефона получателя.'
                      : locale === 'ka'
                      ? 'ელექტრონული სასაჩუქრე ბარათი მყისიერად გაიგზავნება მიმღების ელ-ფოსტაზე და ტელეფონზე.'
                      : 'Digital gift card will be instantly sent to recipient email and phone number.'}
                  </div>
                )}

                <div>
                  <label className="config-label">{t.checkout.comment}</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder={locale === 'ru' ? 'Код домофона, оставить консьержу и т.д.' : locale === 'ka' ? 'დომოფონის კოდი, დატოვეთ კართან და ა.შ.' : 'Doorbell code, leave at reception etc.'}
                    className="config-input-text"
                  />
                </div>
              </div>

              {/* 3. Payment Method */}
              <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '20px' }}>
                  3. {t.checkout.step3}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'bog_apple_pay' ? '2px solid var(--accent-green)' : '1.5px solid var(--border)',
                      background: paymentMethod === 'bog_apple_pay' ? 'var(--accent-green-light)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => setPaymentMethod('bog_apple_pay')}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{t.checkout.payMethods.bog}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{locale === 'ru' ? 'Банковская карта / Apple Pay онлайн' : locale === 'ka' ? 'საბანკო ბარათი / Apple Pay ონლაინ' : 'Card / Apple Pay online'}</div>
                    </div>
                    {paymentMethod === 'bog_apple_pay' && <IconCheck size={18} style={{ color: 'var(--accent-green)' }} />}
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'tbc' ? '2px solid var(--accent-green)' : '1.5px solid var(--border)',
                      background: paymentMethod === 'tbc' ? 'var(--accent-green-light)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => setPaymentMethod('tbc')}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{t.checkout.payMethods.tbc}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{locale === 'ru' ? 'TBC Bank Pay онлайн' : locale === 'ka' ? 'TBC Bank Pay ონლაინ' : 'TBC Bank Pay online'}</div>
                    </div>
                    {paymentMethod === 'tbc' && <IconCheck size={18} style={{ color: 'var(--accent-green)' }} />}
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'cash' ? '2px solid var(--accent-green)' : '1.5px solid var(--border)',
                      background: paymentMethod === 'cash' ? 'var(--accent-green-light)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{t.checkout.payMethods.cash}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{locale === 'ru' ? 'Оплата курьеру при получении' : locale === 'ka' ? 'გადახდა კურიერთან მიღებისას' : 'Cash on delivery'}</div>
                    </div>
                    {paymentMethod === 'cash' && <IconCheck size={18} style={{ color: 'var(--accent-green)' }} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Order Summary */}
            <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', position: 'sticky', top: '100px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '20px' }}>
                {locale === 'ru' ? 'Ваш заказ' : locale === 'ka' ? 'თქვენი შეკვეთა' : 'Your Order'}
              </h3>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: '16px', marginBottom: '4px' }}>
                  {cart?.type === 'certificate' ? t.certificates.badge : cart?.programTitle}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {cart?.daysDuration} {locale === 'ru' ? 'дней' : locale === 'ka' ? 'დღე' : 'Days'} • {cart?.dailyCalories} {locale === 'ru' ? 'ккал' : locale === 'ka' ? 'კკალ' : 'kcal'}
                </div>

                {cart?.allergiesStopList && cart.allergiesStopList.length > 0 && (
                  <div style={{ padding: '6px 10px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '12px', color: '#991B1B', marginBottom: '6px' }}>
                    <strong>{locale === 'ru' ? 'Стоп-лист:' : locale === 'ka' ? 'გამორიცხულია:' : 'Stop-list:'}</strong> {cart.allergiesStopList.map(item => getAllergenDisplayName(item, locale)).join(', ')}
                  </div>
                )}

                {cart?.customSwaps && Object.keys(cart.customSwaps).length > 0 && (
                  <div style={{ padding: '6px 10px', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '12px', color: '#065F46' }}>
                    <strong>{locale === 'ru' ? 'Замен блюд:' : locale === 'ka' ? 'შეცვლილი კერძები:' : 'Meal swaps:'}</strong> {Object.keys(cart.customSwaps).length} {locale === 'ru' ? 'позиций' : locale === 'ka' ? 'კერძი' : 'meals'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{locale === 'ru' ? 'Стоимость рациона:' : locale === 'ka' ? 'რაციონის ღირებულება:' : 'Subtotal:'}</span>
                <span style={{ color: 'var(--text-heading)', fontWeight: 700 }}>{cart?.totalPriceGEL} GEL</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{locale === 'ru' ? 'Доставка:' : locale === 'ka' ? 'მიტანა:' : 'Delivery:'}</span>
                <span style={{ color: deliveryCost === 0 ? 'var(--accent-green)' : 'var(--text-heading)', fontWeight: 700 }}>
                  {deliveryCost === 0 ? (locale === 'ru' ? 'Бесплатно' : locale === 'ka' ? 'უფასო' : 'Free') : `${deliveryCost} GEL`}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)' }}>{locale === 'ru' ? 'Итого к оплате:' : locale === 'ka' ? 'სულ გადასახდელი:' : 'Total:'}</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-heading)' }}>
                  {orderTotal} <span style={{ fontSize: '18px' }}>GEL</span>
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '16px', justifyContent: 'center' }}
              >
                <span>{t.checkout.confirmOrder}</span>
                <IconArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
