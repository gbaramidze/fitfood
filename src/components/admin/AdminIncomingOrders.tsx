'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

export const AdminIncomingOrders: React.FC = () => {
  const { 
    incomingOrders, 
    updateOrderStatus, 
    convertOrderToSubscription, 
    deleteIncomingOrder,
    searchQuery 
  } = useAdmin();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const filteredOrders = incomingOrders.filter(o => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || o.orderNumber.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return true;
  });

  const handleConfirmAndActivate = (orderId: string, clientName: string) => {
    convertOrderToSubscription(orderId);
    setSuccessNotice(`შეკვეთა დადასტურებულია! მომხმარებელი «${clientName}» გადატანილია აქტიური აბონემენტების ბაზაში.`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">შემოსული შეკვეთები და განაცხადები</h1>
          <p className="admin-page-subtitle">
            ვებსაიტ fitnessfood.ge-დან შემოსული ონლაინ შეკვეთების, გადახდებისა და მოთხოვნების მართვა
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="admin-alert-banner alert-success">
          <span>✓ {successNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <span className="filter-group-label">სტატუსი:</span>
          <div className="admin-toggle-buttons">
            <button
              onClick={() => setFilterStatus('all')}
              className={`filter-toggle-btn ${filterStatus === 'all' ? 'active' : ''}`}
            >
              ყველა ({incomingOrders.length})
            </button>
            <button
              onClick={() => setFilterStatus('new')}
              className={`filter-toggle-btn ${filterStatus === 'new' ? 'active' : ''}`}
            >
              ახალი ({incomingOrders.filter(o => o.status === 'new').length})
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`filter-toggle-btn ${filterStatus === 'confirmed' ? 'active' : ''}`}
            >
              დადასტურებული ({incomingOrders.filter(o => o.status === 'confirmed').length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="admin-orders-list">
        {filteredOrders.length === 0 ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
            <h3 style={{ color: '#F9FAFB', margin: '0 0 4px 0' }}>შემოსული შეკვეთები არ არის</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>საიტიდან (fitnessfood.ge/checkout) გაკეთებული ონლაინ შეკვეთები გამოჩნდება აქ რეალურ დროში.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isNew = ord.status === 'new';

          return (
            <div key={ord.id} className={`admin-order-card ${isNew ? 'order-new' : ''}`}>
              <div className="order-card-header">
                <div className="order-num-block">
                  <span className="order-badge">#{ord.orderNumber}</span>
                  <span className="order-date">{new Date(ord.createdAt).toLocaleString('ka-GE')}</span>
                </div>
                <div className="order-status-block">
                  <span className={`status-pill ${ord.status === 'new' ? 'status-new' : ord.status === 'confirmed' ? 'status-confirmed' : 'status-done'}`}>
                    {ord.status === 'new' ? '● ახალი განაცხადი' : ord.status === 'confirmed' ? '✓ დადასტურებული' : 'დასრულებული'}
                  </span>
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-client-info">
                  <div className="client-name-row">
                    <b>{ord.customerName}</b>
                    <a href={`tel:${ord.phone}`} className="client-phone-link">{ord.phone}</a>
                  </div>
                  <div className="client-address-row">
                    📍 {ord.address} ({ord.zone})
                  </div>
                </div>

                <div className="order-program-info">
                  <span className="order-prog-title">🥗 {ord.programTitle}</span>
                  <div className="order-meta-chips">
                    <span className="order-chip">⏱️ {ord.deliverySlot}</span>
                    <span className="order-chip">💳 {ord.paymentMethod}</span>
                  </div>
                </div>

                <div className="order-pricing-box">
                  <span className="order-price-label">ღირებულება:</span>
                  <span className="order-price-val">{ord.totalPriceGEL} ₾</span>
                </div>
              </div>

              {ord.notes && (
                <div className="order-card-notes">
                  💬 <b>შენიშვნა / ალერგია:</b> {ord.notes}
                </div>
              )}

              <div className="order-card-footer">
                {isNew ? (
                  <button
                    onClick={() => handleConfirmAndActivate(ord.id, ord.customerName)}
                    className="admin-btn-primary"
                  >
                    ✓ დადასტურება და აბონემენტის გახსნა
                  </button>
                ) : (
                  <span className="text-muted" style={{ fontSize: '12px' }}>
                    აბონემენტი აქტიურია კლიენტების ბაზაში
                  </span>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => updateOrderStatus(ord.id, ord.status === 'new' ? 'confirmed' : 'new')}
                    className="admin-mini-btn"
                  >
                    სტატუსის შეცვლა
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`წაიშალოს შეკვეთა #${ord.orderNumber}?`)) {
                        deleteIncomingOrder(ord.id);
                      }
                    }}
                    className="btn-dish-delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
