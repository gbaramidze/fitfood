'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { AdminProgram } from '@/types/admin';

export const AdminProgramsManager: React.FC = () => {
  const { 
    programs, 
    customers,
    addProgram, 
    updateProgram, 
    deleteProgram, 
    toggleProgramActive 
  } = useAdmin();

  const [editingProg, setEditingProg] = useState<AdminProgram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formTitleKa, setFormTitleKa] = useState('');
  const [formBadgeKa, setFormBadgeKa] = useState('ჰიტი • კლება');
  const [formDescKa, setFormDescKa] = useState('');
  const [formTargetKa, setFormTargetKa] = useState('წონის კლება, რელიეფი');
  const [formCalorieRange, setFormCalorieRange] = useState('750–1500 კკალ');
  const [formTargetCalories, setFormTargetCalories] = useState(1200);
  const [formMealsPerDay, setFormMealsPerDay] = useState(4);
  const [formCostPerDay, setFormCostPerDay] = useState(14);
  
  // Prices
  const [price2d, setPrice2d] = useState(78);
  const [price6d, setPrice6d] = useState(222);
  const [price12d, setPrice12d] = useState(420);
  const [price24d, setPrice24d] = useState(792);
  const [price30d, setPrice30d] = useState(930);

  const [formFeaturesKa, setFormFeaturesKa] = useState(
    '4 დაბალკალორიული კვება დღეში\nშაქრისა და მავნე ცხიმების გარეშე\nსუ-ვიდ და ორთქლზე მომზადება\nუფასო დილის მიტანა'
  );

  const openCreateModal = () => {
    setEditingProg(null);
    setFormTitleKa('');
    setFormBadgeKa('ახალი რაციონი');
    setFormDescKa('');
    setFormTargetKa('წონის კლება და ენერგია');
    setFormCalorieRange('1200–1600 კკალ');
    setFormTargetCalories(1400);
    setFormMealsPerDay(4);
    setFormCostPerDay(14);
    setPrice2d(78);
    setPrice6d(222);
    setPrice12d(420);
    setPrice24d(792);
    setPrice30d(930);
    setFormFeaturesKa('4 კვება დღეში\nშაქრის გარეშე\nსუ-ვიდ ტექნოლოგია\nუფასო მიტანა');
    setIsModalOpen(true);
  };

  const openEditModal = (prog: AdminProgram) => {
    setEditingProg(prog);
    setFormTitleKa(prog.title.ka);
    setFormBadgeKa(prog.badge?.ka || '');
    setFormDescKa(prog.description.ka);
    setFormTargetKa(prog.target.ka);
    setFormCalorieRange(prog.calorieRange);
    setFormTargetCalories(prog.targetCalories || 1500);
    setFormMealsPerDay(prog.mealsPerDay);
    setFormCostPerDay(prog.costPerDay || 15);
    setPrice2d(prog.prices.trialTwoDays);
    setPrice6d(prog.prices.sixDays);
    setPrice12d(prog.prices.twelveDays);
    setPrice24d(prog.prices.twentyFourDays);
    setPrice30d(prog.prices.thirtyDays);
    setFormFeaturesKa(prog.features.ka.join('\n'));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleKa.trim()) {
      alert('გთხოვთ მიუთითოთ პროგრამის სახელწოდება');
      return;
    }

    const featKa = formFeaturesKa.split('\n').map(s => s.trim()).filter(Boolean);

    const payload = {
      slug: formTitleKa.toLowerCase().replace(/[^a-z0-9]/gi, '-').slice(0, 20) || 'program',
      badge: { ka: formBadgeKa, ru: formBadgeKa, en: formBadgeKa },
      title: { ka: formTitleKa, ru: formTitleKa, en: formTitleKa },
      description: { ka: formDescKa || 'ინდივიდუალური რაციონი.', ru: formDescKa, en: formDescKa },
      target: { ka: formTargetKa, ru: formTargetKa, en: formTargetKa },
      calorieRange: formCalorieRange,
      targetCalories: Number(formTargetCalories),
      mealsPerDay: Number(formMealsPerDay),
      prices: {
        trialTwoDays: Number(price2d),
        sixDays: Number(price6d),
        twelveDays: Number(price12d),
        twentyFourDays: Number(price24d),
        thirtyDays: Number(price30d),
      },
      costPerDay: Number(formCostPerDay),
      accentColor: '#10B981',
      active: editingProg ? editingProg.active : true,
      features: { ka: featKa, ru: featKa, en: featKa },
      activeSubscribersCount: 0,
      ordersSharePercent: 0,
      demandLevel: 'medium' as const,
    };

    if (editingProg) {
      updateProgram(editingProg.id, payload);
    } else {
      addProgram(payload);
    }

    setIsModalOpen(false);
  };

  const getSubscribersForProgram = (prog: AdminProgram) => {
    return customers.filter(c => 
      c.status === 'active' && (
        c.programId === prog.id ||
        c.programTitle.toLowerCase().includes(prog.title.ka.toLowerCase()) ||
        c.programTitle.toLowerCase().includes(prog.slug.toLowerCase())
      )
    ).length;
  };

  const totalSubsAll = customers.filter(c => c.status === 'active').length;

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">რაციონები & მოთხოვნის ანალიტიკა</h1>
          <p className="admin-page-subtitle">
            საიტის კვების პროგრამები, მოთხოვნის რეალური რეიტინგი, აბონემენტების ფასები (2-30 დღე) და თვითღირებულება
          </p>
        </div>
        <button onClick={openCreateModal} className="admin-btn-primary">
          + ახალი რაციონის დამატება
        </button>
      </div>

      {/* Demand Overview Bar */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="admin-card-header">
          <div>
            <h3>🔥 მოთხოვნის რეალური განაწილება რაციონების მიხედვით</h3>
            <p>კლიენტების რეალური არჩევანი fitnessfood.ge-ზე</p>
          </div>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>
            სულ აქტიური გამომწერი: <b className="text-success">{totalSubsAll} ადამიანი</b>
          </span>
        </div>

        <div className="admin-demand-grid">
          {programs.map((prog) => {
            const subsCount = getSubscribersForProgram(prog);
            const share = totalSubsAll > 0 ? Math.round((subsCount / totalSubsAll) * 100) : 0;

            return (
              <div key={prog.id} className="demand-card">
                <div className="demand-header">
                  <b>{prog.title.ka}</b>
                  <span className={`demand-badge ${share > 30 ? 'demand-high' : 'demand-mid'}`}>
                    {share > 30 ? '🔥 მაღალი მოთხოვნა' : 'სტაბილური'}
                  </span>
                </div>

                <div className="demand-stats-row">
                  <div>
                    <span className="demand-number">{subsCount}</span>
                    <span className="demand-label">კლიენტი</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="demand-number text-success">{share}%</span>
                    <span className="demand-label">ბაზრის წილი</span>
                  </div>
                </div>

                <div className="progress-bar-bg" style={{ marginTop: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: `${share}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Programs Matrix Grid */}
      <div className="admin-programs-matrix-grid">
        {programs.map((prog) => {
          const avgDayPrice30 = Math.round(prog.prices.thirtyDays / 30);
          const profitPerClientMonth = (avgDayPrice30 - (prog.costPerDay || 14)) * 30;

          return (
            <div 
              key={prog.id} 
              className={`admin-program-card ${!prog.active ? 'is-inactive' : ''}`}
            >
              <div className="admin-prog-card-top">
                <div>
                  <span className="prog-badge-pill">
                    {prog.badge?.ka || 'FitFood რაციონი'}
                  </span>
                  <h3 className="admin-prog-card-title">{prog.title.ka}</h3>
                  <div className="admin-prog-sub">{prog.target.ka}</div>
                </div>
                <button
                  onClick={() => toggleProgramActive(prog.id)}
                  className={`status-chip ${prog.active ? 'chip-active' : 'chip-disabled'}`}
                >
                  {prog.active ? '● აქტიური' : '○ გამორთული'}
                </button>
              </div>

              <div className="admin-prog-specs-bar">
                <div className="spec-item">
                  <span className="spec-label">კალორიულობა:</span>
                  <span className="spec-val"><b>{prog.calorieRange}</b></span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">კვება დღეში:</span>
                  <span className="spec-val"><b>{prog.mealsPerDay} ულუფა</b></span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">თვითღირებულება/დღე:</span>
                  <span className="spec-val text-warning"><b>{prog.costPerDay} ₾</b></span>
                </div>
              </div>

              {/* Pricing Matrix */}
              <div className="admin-prog-pricing-table">
                <div className="pricing-table-header">აბონემენტების ტარიფები (GEL ₾):</div>
                <div className="pricing-tiers-row">
                  <div className="tier-box">
                    <span className="tier-days">2 დღე (ტესტი)</span>
                    <span className="tier-price">{prog.prices.trialTwoDays} ₾</span>
                    <span className="tier-per-day">{Math.round(prog.prices.trialTwoDays / 2)} ₾/დ</span>
                  </div>
                  <div className="tier-box">
                    <span className="tier-days">6 დღე</span>
                    <span className="tier-price">{prog.prices.sixDays} ₾</span>
                    <span className="tier-per-day">{Math.round(prog.prices.sixDays / 6)} ₾/დ</span>
                  </div>
                  <div className="tier-box">
                    <span className="tier-days">12 დღე</span>
                    <span className="tier-price">{prog.prices.twelveDays} ₾</span>
                    <span className="tier-per-day">{Math.round(prog.prices.twelveDays / 12)} ₾/დ</span>
                  </div>
                  <div className="tier-box">
                    <span className="tier-days">24 დღე</span>
                    <span className="tier-price">{prog.prices.twentyFourDays} ₾</span>
                    <span className="tier-per-day">{Math.round(prog.prices.twentyFourDays / 24)} ₾/დ</span>
                  </div>
                  <div className="tier-box tier-best">
                    <span className="tier-days">30 დღე</span>
                    <span className="tier-price">{prog.prices.thirtyDays} ₾</span>
                    <span className="tier-per-day">{avgDayPrice30} ₾/დ</span>
                  </div>
                </div>
              </div>

              <div className="admin-prog-economics-box">
                <span>💡 მოგება 1 თვიანი აბონემენტიდან: </span>
                <b className="text-success">+{profitPerClientMonth} ₾</b>
              </div>

              <div className="admin-prog-actions">
                <button onClick={() => openEditModal(prog)} className="btn-dish-edit">
                  ✏️ ფასების რედაქტირება
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`წაიშალოს რაციონი «${prog.title.ka}»?`)) {
                      deleteProgram(prog.id);
                    }
                  }} 
                  className="btn-dish-delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit / Add Program */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container modal-wide">
            <div className="admin-modal-header">
              <h2>{editingProg ? 'რაციონის პარამეტრები' : 'ახალი რაციონის შექმნა'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">რაციონის სახელწოდება *</label>
                  <input
                    type="text"
                    required
                    value={formTitleKa}
                    onChange={(e) => setFormTitleKa(e.target.value)}
                    placeholder="მაგ: სნიჟენიე (750–1500 კკალ)"
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">ბეიჯი / მანიშნებელი</label>
                  <input
                    type="text"
                    value={formBadgeKa}
                    onChange={(e) => setFormBadgeKa(e.target.value)}
                    placeholder="ჰიტი • წონის კლება"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-col">
                  <label className="form-label">კალორიების დიაპაზონი</label>
                  <input
                    type="text"
                    value={formCalorieRange}
                    onChange={(e) => setFormCalorieRange(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">კვება დღეში</label>
                  <input
                    type="number"
                    value={formMealsPerDay}
                    onChange={(e) => setFormMealsPerDay(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">დღიური თვითღირებულება (GEL)</label>
                  <input
                    type="number"
                    value={formCostPerDay}
                    onChange={(e) => setFormCostPerDay(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Pricing Matrix */}
              <div className="kbju-inputs-card">
                <label className="form-section-title">ტარიფები საიტზე (GEL ₾)</label>
                <div className="pricing-edit-grid">
                  <div className="pricing-input-group">
                    <label>2 დღე (ტესტი)</label>
                    <input
                      type="number"
                      value={price2d}
                      onChange={(e) => setPrice2d(Number(e.target.value))}
                      className="admin-input-num"
                    />
                  </div>
                  <div className="pricing-input-group">
                    <label>6 დღე</label>
                    <input
                      type="number"
                      value={price6d}
                      onChange={(e) => setPrice6d(Number(e.target.value))}
                      className="admin-input-num"
                    />
                  </div>
                  <div className="pricing-input-group">
                    <label>12 დღე</label>
                    <input
                      type="number"
                      value={price12d}
                      onChange={(e) => setPrice12d(Number(e.target.value))}
                      className="admin-input-num"
                    />
                  </div>
                  <div className="pricing-input-group">
                    <label>24 დღე</label>
                    <input
                      type="number"
                      value={price24d}
                      onChange={(e) => setPrice24d(Number(e.target.value))}
                      className="admin-input-num"
                    />
                  </div>
                  <div className="pricing-input-group">
                    <label>30 დღე</label>
                    <input
                      type="number"
                      value={price30d}
                      onChange={(e) => setPrice30d(Number(e.target.value))}
                      className="admin-input-num"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">უპირატესობები (თითო პუნქტი ახალ ხაზზე)</label>
                  <textarea
                    rows={4}
                    value={formFeaturesKa}
                    onChange={(e) => setFormFeaturesKa(e.target.value)}
                    className="admin-textarea"
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
