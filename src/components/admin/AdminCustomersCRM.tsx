'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { AdminCustomerSubscription } from '@/types/admin';

export const AdminCustomersCRM: React.FC = () => {
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    recordDayDelivery, 
    deleteCustomer,
    searchQuery 
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<AdminCustomerSubscription | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+995 5');
  const [formAddress, setFormAddress] = useState('');
  const [formZone, setFormZone] = useState('ცენტრი / ძველი ბათუმი');
  const [formProgramTitle, setFormProgramTitle] = useState('სნიჟენიე (1500 კკალ)');
  const [formCalories, setFormCalories] = useState(1500);
  const [formTotalDays, setFormTotalDays] = useState(30);
  const [formDeliveredDays, setFormDeliveredDays] = useState(0);
  const [formRemainingDays, setFormRemainingDays] = useState(30);
  const [formSlot, setFormSlot] = useState<'morning' | 'comfort' | 'evening'>('morning');
  const [formAmount, setFormAmount] = useState(930);
  const [formPaymentMethod, setFormPaymentMethod] = useState('BOG Apple Pay');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [formNotes, setFormNotes] = useState('');

  const filteredCustomers = customers.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = c.clientName.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingCust(null);
    setFormName('');
    setFormPhone('+995 5');
    setFormAddress('');
    setFormZone('ცენტრი');
    setFormProgramTitle('სნიჟენიე (1500 კკალ)');
    setFormCalories(1500);
    setFormTotalDays(30);
    setFormDeliveredDays(0);
    setFormRemainingDays(30);
    setFormSlot('morning');
    setFormAmount(930);
    setFormPaymentMethod('Bank of Georgia');
    setFormPaymentStatus('paid');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: AdminCustomerSubscription) => {
    setEditingCust(c);
    setFormName(c.clientName);
    setFormPhone(c.phone);
    setFormAddress(c.address);
    setFormZone(c.zone);
    setFormProgramTitle(c.programTitle);
    setFormCalories(c.calories);
    setFormTotalDays(c.totalDays);
    setFormDeliveredDays(c.deliveredDays);
    setFormRemainingDays(c.remainingDays);
    setFormSlot(c.deliverySlot);
    setFormAmount(c.totalAmount);
    setFormPaymentMethod(c.paymentMethod);
    setFormPaymentStatus(c.paymentStatus);
    setFormNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) {
      alert('გთხოვთ შეავსოთ კლიენტის სახელი და მისამართი');
      return;
    }

    const payload = {
      clientName: formName,
      phone: formPhone,
      address: formAddress,
      zone: formZone,
      programId: 'prog-slim',
      programTitle: formProgramTitle,
      calories: Number(formCalories),
      totalDays: Number(formTotalDays),
      deliveredDays: Number(formDeliveredDays),
      remainingDays: Number(formRemainingDays),
      deliverySlot: formSlot,
      startDate: new Date().toISOString().slice(0, 10),
      paymentStatus: formPaymentStatus,
      paymentMethod: formPaymentMethod,
      totalAmount: Number(formAmount),
      status: Number(formRemainingDays) === 0 ? ('completed' as const) : ('active' as const),
      notes: formNotes,
    };

    if (editingCust) {
      updateCustomer(editingCust.id, payload);
    } else {
      addCustomer(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">მომხმარებელთა ბაზა & მიწოდების კონტროლი (CRM)</h1>
          <p className="admin-page-subtitle">
            აბონემენტების აღრიცხვა, მიტანილი და დარჩენილი დღეების ბალანსი, მისამართები და გადახდები
          </p>
        </div>
        <button onClick={openCreateModal} className="admin-btn-primary">
          + ახალი კლიენტის დამატება
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <span className="filter-group-label">ფილტრი:</span>
          <div className="admin-toggle-buttons">
            <button
              onClick={() => setStatusFilter('active')}
              className={`filter-toggle-btn ${statusFilter === 'active' ? 'active' : ''}`}
            >
              აქტიური აბონემენტები ({customers.filter(c => c.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`filter-toggle-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            >
              დასრულებული ({customers.filter(c => c.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`filter-toggle-btn ${statusFilter === 'all' ? 'active' : ''}`}
            >
              ყველა ({customers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-card">
        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>კლიენტი & ტელეფონი</th>
                <th>მისამართი & ზონა</th>
                <th>რაციონი</th>
                <th>მიწოდების გრაფიკი</th>
                <th>დღეების ბალანსი</th>
                <th>გადახდა</th>
                <th>მიტანის აღრიცხვა</th>
                <th>მოქმედება</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>👤</div>
                    <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '2px' }}>მომხმარებელთა ჩანაწერები არ არის</div>
                    <div style={{ fontSize: '12px' }}>დააჭირეთ «+ ახალი კლიენტის დამატება»-ს ან დაადასტურეთ შემოსული ონლაინ შეკვეთა.</div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const percentDone = Math.round((cust.deliveredDays / (cust.totalDays || 1)) * 100);

                  return (
                    <tr key={cust.id}>
                    <td>
                      <b style={{ fontSize: '14px' }}>{cust.clientName}</b>
                      <div style={{ fontSize: '12px', color: '#10B981', marginTop: '2px' }}>
                        <a href={`tel:${cust.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {cust.phone}
                        </a>
                      </div>
                    </td>

                    <td>
                      <div style={{ maxWidth: '240px', fontSize: '13px', lineHeight: '1.4' }}>
                        📍 {cust.address}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cust.zone}</div>
                      {cust.notes && (
                        <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '4px', fontStyle: 'italic' }}>
                          💬 {cust.notes}
                        </div>
                      )}
                    </td>

                    <td>
                      <b>{cust.programTitle}</b>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        {cust.calories} კკალ • {cust.totalDays} დღიანი პაკეტი
                      </div>
                    </td>

                    <td>
                      <span className="table-badge badge-blue">
                        {cust.deliverySlot === 'morning' ? '🌅 დილა 06:00-08:00' : '🌙 საღამო'}
                      </span>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                        დაიწყო: {cust.startDate}
                      </div>
                    </td>

                    <td>
                      <div style={{ minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>მიწოდებულია: <b>{cust.deliveredDays}</b></span>
                          <span>დარჩა: <b className="text-success">{cust.remainingDays} დღე</b></span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${Math.min(100, percentDone)}%` }}></div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <b className="text-success">{cust.totalAmount} ₾</b>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {cust.paymentStatus === 'paid' ? '✓ გადახდილია' : '⏳ მოლოდინში'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>{cust.paymentMethod}</div>
                    </td>

                    <td>
                      {cust.remainingDays > 0 ? (
                        <button
                          onClick={() => {
                            if (confirm(`დაფიქსირდეს დღევანდელი მიწოდება კლიენტისთვის «${cust.clientName}»? (დარჩება: ${cust.remainingDays - 1} დღე)`)) {
                              recordDayDelivery(cust.id);
                            }
                          }}
                          className="admin-btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          title="დააჭირეთ ყოველდღიური მიწოდების ჩასათვლელად"
                        >
                          +1 დღის მიწოდება
                        </button>
                      ) : (
                        <span className="table-badge badge-green">✓ კურსი დასრულდა</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEditModal(cust)} className="btn-dish-edit" style={{ padding: '4px 8px' }}>
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`წაიშალოს კლიენტი «${cust.clientName}»?`)) {
                              deleteCustomer(cust.id);
                            }
                          }}
                          className="btn-dish-delete"
                          style={{ padding: '4px 8px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Client */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="admin-modal-header">
              <h2>{editingCust ? 'კლიენტის მონაცემების რედაქტირება' : 'ახალი აბონემენტის რეგისტრაცია'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">კლიენტის სახელი და გვარი *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="მაგ: გიორგი მიქელაძე"
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">ტელეფონის ნომერი *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">მისამართი ბათუმში (ქუჩა, ბინა, სართული, კოდი) *</label>
                  <input
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="მაგ: ფარნავაზ მეფის 64, ბინა 12, სართული 4"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">არჩეული რაციონი</label>
                  <select
                    value={formProgramTitle}
                    onChange={(e) => setFormProgramTitle(e.target.value)}
                    className="admin-select-input"
                  >
                    <option value="სნიჟენიე (750–1500 კკალ)">სნიჟენიე (750–1500 კკალ)</option>
                    <option value="ბალანსი (1500–2000 კკალ)">ბალანსი (1500–2000 კკალ)</option>
                    <option value="ნაბორი (2200–3200 კკალ)">ნაბორი (2200–3200 კკალ)</option>
                    <option value="დეტოქსი (1000–1200 კკალ)">დეტოქსი (1000–1200 კკალ)</option>
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">მიტანის დროის სლოტი</label>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value as any)}
                    className="admin-select-input"
                  >
                    <option value="morning">დილის 06:00 - 08:00</option>
                    <option value="comfort">კომფორტული 08:00 - 10:00</option>
                    <option value="evening">საღამოს 19:00 - 21:00</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-col">
                  <label className="form-label">სულ დღეები</label>
                  <input
                    type="number"
                    value={formTotalDays}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      setFormTotalDays(total);
                      setFormRemainingDays(Math.max(0, total - formDeliveredDays));
                    }}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">მიწოდებული დღეები</label>
                  <input
                    type="number"
                    value={formDeliveredDays}
                    onChange={(e) => {
                      const deliv = Number(e.target.value);
                      setFormDeliveredDays(deliv);
                      setFormRemainingDays(Math.max(0, formTotalDays - deliv));
                    }}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">დარჩენილი დღეები</label>
                  <input
                    type="number"
                    value={formRemainingDays}
                    onChange={(e) => setFormRemainingDays(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">გადახდილი თანხა (GEL ₾)</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">გადახდის მეთოდი</label>
                  <input
                    type="text"
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    placeholder="BOG Apple Pay / TBC / Cash"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">შენიშვნები (ალერგია, კოდი, კურიერის შენიშვნა)</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-secondary">
                  გაუქმება
                </button>
                <button type="submit" className="admin-btn-primary">
                  💾 შენახვა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
