'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { PartnerPoint } from '@/types/partner';

export const AdminPointsSettings: React.FC = () => {
  const { points, addPoint, updatePoint } = useAdmin();

  const [editingPoint, setEditingPoint] = useState<PartnerPoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formNameKa, setFormNameKa] = useState('');
  const [formAddressKa, setFormAddressKa] = useState('');
  const [formCashierPin, setFormCashierPin] = useState('1111');
  const [formManagerPin, setFormManagerPin] = useState('7777');
  const [formCommission, setFormCommission] = useState(0);
  const [formPhone, setFormPhone] = useState('+995 555 00 00 00');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const openCreateModal = () => {
    setEditingPoint(null);
    setFormNameKa('');
    setFormAddressKa('');
    setFormCashierPin('1234');
    setFormManagerPin('9876');
    setFormCommission(15);
    setFormPhone('+995 555 12 34 56');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (pt: PartnerPoint) => {
    setEditingPoint(pt);
    setFormNameKa(pt.name.ka);
    setFormAddressKa(pt.address.ka);
    setFormCashierPin(pt.cashierPin);
    setFormManagerPin(pt.managerPin);
    setFormCommission(pt.commissionPercent);
    setFormPhone(pt.phone);
    setFormStatus(pt.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameKa.trim()) return;

    const payload = {
      name: { ka: formNameKa, ru: formNameKa, en: formNameKa },
      city: 'Batumi',
      address: { ka: formAddressKa, ru: formAddressKa, en: formAddressKa },
      cashierPin: formCashierPin,
      managerPin: formManagerPin,
      commissionPercent: Number(formCommission),
      phone: formPhone,
      status: formStatus,
    };

    if (editingPoint) {
      updatePoint(editingPoint.id, payload);
    } else {
      addPoint(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">გაყიდვის წერტილები & POS პარამეტრები</h1>
          <p className="admin-page-subtitle">
            ფიტნეს-დარბაზების ფილიალები, მოლარის და მენეჯერის PIN კოდები, საკომისიო და მისამართები
          </p>
        </div>
        <button onClick={openCreateModal} className="admin-btn-primary">
          + ახალი წერტილის დამატება
        </button>
      </div>

      {/* Points Grid */}
      <div className="admin-grid-2col">
        {points.map((pt) => (
          <div key={pt.id} className="admin-card point-card">
            <div className="admin-card-header">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '26px' }}>🏋️</span>
                <div>
                  <h3 style={{ margin: 0 }}>{pt.name.ka}</h3>
                  <p style={{ margin: 0, color: '#94A3B8' }}>{pt.address.ka}</p>
                </div>
              </div>
              <span className="table-badge badge-green">
                {pt.status === 'active' ? '● აქტიური' : '○ გამორთული'}
              </span>
            </div>

            <div className="point-card-specs">
              <div className="spec-row">
                <span className="spec-label">მოლარის PIN:</span>
                <span className="pin-code-badge">{pt.cashierPin}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">მენეჯერის PIN:</span>
                <span className="pin-code-badge badge-manager">{pt.managerPin}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">საკომისიო:</span>
                <span className="spec-val"><b>{pt.commissionPercent}%</b></span>
              </div>
              <div className="spec-row">
                <span className="spec-label">ტელეფონი:</span>
                <span className="spec-val">{pt.phone}</span>
              </div>
            </div>

            <div className="admin-card-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => openEditModal(pt)} className="btn-dish-edit">
                ⚙️ პარამეტრები & PIN
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Edit / Create Point */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="admin-modal-header">
              <h2>{editingPoint ? `წერტილის პარამეტრები: ${editingPoint.name.ka}` : 'ახალი წერტილის დამატება'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">წერტილის დასახელება *</label>
                  <input
                    type="text"
                    required
                    value={formNameKa}
                    onChange={(e) => setFormNameKa(e.target.value)}
                    placeholder="მაგ: Prime Fitness Batumi"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">მისამართი ბათუმში</label>
                  <input
                    type="text"
                    required
                    value={formAddressKa}
                    onChange={(e) => setFormAddressKa(e.target.value)}
                    placeholder="მაგ: რუსთაველის 42"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">მოლარის PIN-კოდი (სალარო)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formCashierPin}
                    onChange={(e) => setFormCashierPin(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">მენეჯერის PIN-კოდი (Z-ანგარიში)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formManagerPin}
                    onChange={(e) => setFormManagerPin(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">დარბაზის საკომისიო (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formCommission}
                    onChange={(e) => setFormCommission(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">საკონტაქტო ტელეფონი</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
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
