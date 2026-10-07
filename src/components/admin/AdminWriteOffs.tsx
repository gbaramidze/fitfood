'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { LazyProductImage } from '@/components/partner/LazyProductImage';

type WriteOffReason = 'expired' | 'damaged' | 'sample' | 'kitchen_waste' | 'other';

const REASONS: { 
  id: WriteOffReason; 
  label: string; 
  icon: string; 
  color: string; 
  badgeBg: string 
}[] = [
  { id: 'expired', label: 'ვადაგასული / გაფუჭებული', icon: '🥀', color: '#EF4444', badgeBg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'damaged', label: 'დაზიანებული შეფუთვა / ბრაკი', icon: '📦', color: '#F59E0B', badgeBg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'sample', label: 'დეგუსტაცია / პრორაბოტკა', icon: '👨‍🍳', color: '#38BDF8', badgeBg: 'rgba(56, 189, 248, 0.15)' },
  { id: 'kitchen_waste', label: 'სამზარეულოს დანაკარგი', icon: '🍳', color: '#FB923C', badgeBg: 'rgba(251, 146, 60, 0.15)' },
  { id: 'other', label: 'სხვა მიზეზი', icon: '❓', color: '#94A3B8', badgeBg: 'rgba(148, 163, 184, 0.15)' },
];

export const AdminWriteOffs: React.FC = () => {
  const { 
    points, 
    dishes, 
    stocks, 
    writeOffs, 
    createWriteOff, 
    deleteWriteOff 
  } = useAdmin();

  // Active view tab
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'history' | 'analytics'>('form');

  // New Write-off Form State
  const [selectedPointId, setSelectedPointId] = useState<string>(points[0]?.id || 'point-mega-gym');
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedReason, setSelectedReason] = useState<WriteOffReason>('expired');
  const [notes, setNotes] = useState<string>('');
  const [dishSearch, setDishSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History Filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyPointFilter, setHistoryPointFilter] = useState<string>('all');
  const [historyReasonFilter, setHistoryReasonFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Selected Dish details
  const selectedDish = dishes.find(d => d.id === selectedDishId);
  const currentStockOnPoint = selectedDishId ? (stocks[selectedPointId]?.[selectedDishId] || 0) : 0;

  // Filtered dishes for creation form
  const filteredDishes = useMemo(() => {
    return dishes.filter(d => {
      const nameStr = (typeof d.name === 'object' ? `${d.name.ka} ${d.name.ru || ''} ${d.name.en || ''}` : d.name).toLowerCase();
      if (dishSearch && !nameStr.includes(dishSearch.toLowerCase())) return false;
      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
      return true;
    });
  }, [dishes, dishSearch, selectedCategory]);

  // Overall Write-off KPI Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostLoss = 0;
    let totalRetailLoss = 0;
    let expiredUnits = 0;

    writeOffs.forEach(w => {
      const dish = dishes.find(d => d.id === w.productId);
      const cost = w.costPrice ?? dish?.costPrice ?? 0;
      const retail = w.retailPrice ?? dish?.retailPrice ?? 15;

      totalUnits += w.quantity;
      totalCostLoss += w.quantity * cost;
      totalRetailLoss += w.quantity * retail;
      if (w.reason === 'expired') {
        expiredUnits += w.quantity;
      }
    });

    return {
      totalWriteOffsCount: writeOffs.length,
      totalUnits,
      totalCostLoss,
      totalRetailLoss,
      expiredUnits,
      expiredPercent: totalUnits > 0 ? (expiredUnits / totalUnits) * 100 : 0,
    };
  }, [writeOffs, dishes]);

  // Filtered History list
  const filteredHistory = useMemo(() => {
    return writeOffs.filter(w => {
      if (historyPointFilter !== 'all' && w.pointId !== historyPointFilter) return false;
      if (historyReasonFilter !== 'all' && w.reason !== historyReasonFilter) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const pName = (w.productName || '').toLowerCase();
        const nText = (w.notes || '').toLowerCase();
        if (!pName.includes(q) && !nText.includes(q)) return false;
      }
      return true;
    });
  }, [writeOffs, historyPointFilter, historyReasonFilter, historySearch]);

  // Handle Write-off Submission
  const handleSubmitWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishId) {
      alert('გთხოვთ აირჩიოთ კერძი');
      return;
    }
    if (quantity <= 0) {
      alert('გთხოვთ მიუთითოთ რაოდენობა 1 ან მეტი');
      return;
    }

    setIsSubmitting(true);
    try {
      const reasonObj = REASONS.find(r => r.id === selectedReason);
      const reasonLabel = reasonObj?.label || selectedReason;

      const res = await createWriteOff(
        selectedPointId,
        selectedDishId,
        quantity,
        selectedReason,
        reasonLabel,
        notes.trim()
      );

      const pt = points.find(p => p.id === selectedPointId);
      const ptName = typeof pt?.name === 'object' ? (pt.name.ka || pt.name.ru) : pt?.name || 'წერტილი';
      
      setSuccessMessage(`✓ ჩამოიწერა: «${res.productName}» (${res.quantity} ცალი) - ${ptName}`);
      
      // Reset form fields
      setSelectedDishId('');
      setQuantity(1);
      setNotes('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`შეცდომა ჩამოწერისას: ${err.message || 'შეცდომა'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Write-off record
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('გსურთ ამ ჩამოწერის გაუქმება? საქონელი დაბრუნდება ნაშთზე.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteWriteOff(id, true);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const getDishName = (d?: typeof dishes[0]) => {
    if (!d) return '';
    if (typeof d.name === 'object') return d.name.ka || d.name.ru || d.name.en;
    return d.name;
  };

  const getPointName = (pt?: typeof points[0]) => {
    if (!pt) return '';
    if (typeof pt.name === 'object') return pt.name.ka || pt.name.ru || pt.name.en;
    return pt.name;
  };

  return (
    <div className="admin-view-container">
      {/* Header Hero */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">
            🗑️ საქონლის ჩამოწერა & ბრაკი
          </h1>
          <p className="admin-page-subtitle">
            ვადაგასული, დაზიანებული და გაფუჭებული პროდუქციის ჩამოწერა ნაშთებიდან
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('form')}
            className={`admin-btn ${activeSubTab === 'form' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>✍️ ახალი ჩამოწერა</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`admin-btn ${activeSubTab === 'history' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>📋 ჟურნალი ({writeOffs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('analytics')}
            className={`admin-btn ${activeSubTab === 'analytics' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>📊 ანალიტიკა</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 78, 59, 0.28))',
          border: '1px solid #10B981',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34D399',
          fontWeight: 600,
          fontSize: '13.5px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#34D399', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean KPI Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '18px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">სულ ჩამოწერილი</div>
          <div className="admin-stat-value" style={{ color: '#EF4444' }}>
            {metrics.totalUnits} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 400 }}>ცალი</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">ზარალი (თვითღირებულება)</div>
          <div className="admin-stat-value" style={{ color: '#FB923C' }}>
            {metrics.totalCostLoss.toFixed(2)} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 400 }}>₾</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">ზარალი (გასაყიდი ფასი)</div>
          <div className="admin-stat-value" style={{ color: '#FCD34D' }}>
            {metrics.totalRetailLoss.toFixed(2)} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 400 }}>₾</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">ვადაგასული</div>
          <div className="admin-stat-value" style={{ color: '#F87171' }}>
            {metrics.expiredUnits} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 400 }}>ცალი</span>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: FORM */}
      {activeSubTab === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 440px) 1fr', gap: '18px', alignItems: 'start' }}>
          {/* Write-off Input Parameters Form */}
          <div className="admin-card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px' }}>
              ✍️ ჩამოწერის გაფორმება
            </h2>

            <form onSubmit={handleSubmitWriteOff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Point / Location selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                  🏢 წერტილი:
                </label>
                <select
                  value={selectedPointId}
                  onChange={(e) => setSelectedPointId(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', padding: '9px 12px', background: '#14171F', borderColor: '#282E3A' }}
                >
                  {points.map(pt => (
                    <option key={pt.id} value={pt.id}>
                      {getPointName(pt)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Selected Dish Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                  🍱 კერძი:
                </label>

                {selectedDish ? (
                  <div style={{
                    background: '#14171F',
                    border: '1px solid #282E3A',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                      <LazyProductImage
                        productId={selectedDish.id}
                        src={selectedDish.image}
                        alt={getDishName(selectedDish)}
                        width={42}
                        height={42}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getDishName(selectedDish)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        თვითღ.: <strong style={{ color: '#FB923C' }}>{selectedDish.costPrice} ₾</strong> • გასაყიდი: <strong style={{ color: '#FCD34D' }}>{selectedDish.retailPrice} ₾</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: currentStockOnPoint > 0 ? '#34D399' : '#EF4444', fontWeight: 600 }}>
                        ნაშთი: {currentStockOnPoint} ც.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDishId('')}
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        color: '#94A3B8',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      შეცვლა
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px',
                    background: '#14171F',
                    border: '1px dashed #334155',
                    borderRadius: '6px',
                    textAlign: 'center',
                    color: '#94A3B8',
                    fontSize: '12px',
                  }}>
                    ← აირჩიეთ კერძი სიიდან
                  </div>
                )}
              </div>

              {/* 3. Quantity to write off */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>
                    📦 რაოდენობა:
                  </label>
                  {selectedDish && currentStockOnPoint > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(currentStockOnPoint)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38BDF8',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      ყველა ({currentStockOnPoint} ც.)
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: '#181B22',
                      border: '1px solid #282E3A',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="admin-input"
                    style={{ flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: 700, padding: '7px', background: '#14171F' }}
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: '#181B22',
                      border: '1px solid #282E3A',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 4. Reason of write-off */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  ⚠️ მიზეზი:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
                  {REASONS.map(r => {
                    const isSel = selectedReason === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReason(r.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isSel ? r.badgeBg : '#14171F',
                          border: `1px solid ${isSel ? r.color : '#282E3A'}`,
                          color: isSel ? '#FFFFFF' : '#CBD5E1',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: isSel ? 600 : 400,
                        }}
                      >
                        <span>{r.icon}</span>
                        <span style={{ flex: 1 }}>{r.label}</span>
                        {isSel && <span style={{ color: r.color, fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                  📝 კომენტარი:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="კომენტარი (არასავალდებულო)..."
                  className="admin-input"
                  style={{ width: '100%', padding: '8px', background: '#14171F', borderColor: '#282E3A', fontSize: '12px' }}
                />
              </div>

              {/* Loss Summary Preview */}
              {selectedDish && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', marginBottom: '3px' }}>
                    <span>ზარალი (თვითღირებულება):</span>
                    <strong style={{ color: '#FB923C' }}>{(selectedDish.costPrice * quantity).toFixed(2)} ₾</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', marginBottom: '3px' }}>
                    <span>ზარალი (გასაყიდი ფასი):</span>
                    <strong style={{ color: '#FCD34D' }}>{(selectedDish.retailPrice * quantity).toFixed(2)} ₾</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                    <span>ახალი ნაშთი:</span>
                    <strong style={{ color: '#34D399' }}>{Math.max(0, currentStockOnPoint - quantity)} ც.</strong>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedDishId}
                className="admin-btn admin-btn-primary"
                style={{
                  padding: '11px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  background: selectedDishId ? 'linear-gradient(135deg, #EF4444, #B91C1C)' : '#334155',
                  borderColor: selectedDishId ? '#EF4444' : '#334155',
                  color: '#FFFFFF',
                  cursor: selectedDishId ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'მიმდინარეობს...' : '🗑️ ჩამოწერის დადასტურება'}
              </button>
            </form>
          </div>

          {/* Dish Selection Grid with Real-time Stock */}
          <div className="admin-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                🍱 კერძის არჩევა
              </h2>

              {/* Search input */}
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="🔍 ძებნა..."
                className="admin-input"
                style={{ width: '170px', padding: '5px 10px', fontSize: '11.5px', background: '#14171F', borderColor: '#282E3A' }}
              />
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
              {[
                { id: 'all', label: 'ყველა' },
                { id: 'poultry', label: '🍗 ქათამი' },
                { id: 'meat', label: '🥩 ხორცი' },
                { id: 'fish', label: '🐟 თევზი' },
                { id: 'breakfast', label: '🥞 საუზმე' },
                { id: 'salad', label: '🥗 სალათი' },
                { id: 'soup', label: '🍲 სუპი' },
                { id: 'dessert', label: '🧁 დესერტი' },
                { id: 'drinks', label: '🥤 სასმელი' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: selectedCategory === cat.id ? '#FFFFFF' : '#14171F',
                    color: selectedCategory === cat.id ? '#090A0F' : '#94A3B8',
                    border: '1px solid #282E3A',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: selectedCategory === cat.id ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Dishes Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '10px',
              maxHeight: '580px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}>
              {filteredDishes.map(dish => {
                const isSelected = selectedDishId === dish.id;
                const stock = stocks[selectedPointId]?.[dish.id] || 0;

                return (
                  <div
                    key={dish.id}
                    onClick={() => {
                      setSelectedDishId(dish.id);
                      if (stock > 0 && quantity > stock) setQuantity(stock);
                    }}
                    style={{
                      background: isSelected ? 'rgba(239, 68, 68, 0.14)' : '#14171F',
                      border: `1.5px solid ${isSelected ? '#EF4444' : '#282E3A'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                      <LazyProductImage
                        productId={dish.id}
                        src={dish.image}
                        alt={getDishName(dish)}
                        width={160}
                        height={90}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: stock > 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}>
                        {stock > 0 ? `${stock} ც.` : '0 ც.'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#FFFFFF', marginBottom: '4px', lineHeight: '1.2' }}>
                      {getDishName(dish)}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#94A3B8' }}>
                      <span>თვითღ.: <strong style={{ color: '#FB923C' }}>{dish.costPrice} ₾</strong></span>
                      <strong style={{ color: '#FCD34D' }}>{dish.retailPrice} ₾</strong>
                    </div>

                    {isSelected && (
                      <div style={{
                        marginTop: '6px',
                        padding: '3px',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}>
                        ✓ არჩეულია
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HISTORY */}
      {activeSubTab === 'history' && (
        <div className="admin-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              📋 ჩამოწერების ჟურნალი ({filteredHistory.length})
            </h2>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="🔍 ძებნა..."
                className="admin-input"
                style={{ width: '150px', padding: '5px 10px', fontSize: '11.5px', background: '#14171F', borderColor: '#282E3A' }}
              />

              <select
                value={historyPointFilter}
                onChange={(e) => setHistoryPointFilter(e.target.value)}
                className="admin-input"
                style={{ padding: '5px 10px', fontSize: '11.5px', background: '#14171F', borderColor: '#282E3A' }}
              >
                <option value="all">ყველა წერტილი</option>
                {points.map(p => (
                  <option key={p.id} value={p.id}>
                    {getPointName(p)}
                  </option>
                ))}
              </select>

              <select
                value={historyReasonFilter}
                onChange={(e) => setHistoryReasonFilter(e.target.value)}
                className="admin-input"
                style={{ padding: '5px 10px', fontSize: '11.5px', background: '#14171F', borderColor: '#282E3A' }}
              >
                <option value="all">ყველა მიზეზი</option>
                {REASONS.map(r => (
                  <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              ჩამოწერების ჩანაწერები არ არის
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>თარიღი</th>
                    <th>წერტილი</th>
                    <th>კერძი</th>
                    <th style={{ textAlign: 'center' }}>რაოდენობა</th>
                    <th>მიზეზი</th>
                    <th>თვითღირებულება</th>
                    <th>გასაყიდი ფასი</th>
                    <th>კომენტარი</th>
                    <th style={{ textAlign: 'right' }}>მოქმედება</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(w => {
                    const dish = dishes.find(d => d.id === w.productId);
                    const pt = points.find(p => p.id === w.pointId);
                    const reasonObj = REASONS.find(r => r.id === w.reason) || REASONS[4];
                    const costPrice = w.costPrice ?? dish?.costPrice ?? 0;
                    const retailPrice = w.retailPrice ?? dish?.retailPrice ?? 15;
                    const dateFormatted = new Date(w.createdAt).toLocaleString('ka-GE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={w.id}>
                        <td style={{ fontSize: '11.5px', color: '#CBD5E1', whiteSpace: 'nowrap' }}>
                          {dateFormatted}
                        </td>
                        <td>
                          <strong>{getPointName(pt) || w.pointId}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {dish?.image && (
                              <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
                                <LazyProductImage
                                  productId={w.productId}
                                  src={dish.image}
                                  alt={w.productName}
                                  width={28}
                                  height={28}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <strong>{w.productName}</strong>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: '#EF4444' }}>
                            {w.quantity} ც.
                          </strong>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: reasonObj.badgeBg,
                            color: reasonObj.color,
                            fontWeight: 600,
                          }}>
                            {reasonObj.icon} {reasonObj.label}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#FB923C' }}>{(costPrice * w.quantity).toFixed(2)} ₾</strong>
                        </td>
                        <td>
                          <span style={{ color: '#FCD34D' }}>{(retailPrice * w.quantity).toFixed(2)} ₾</span>
                        </td>
                        <td style={{ fontSize: '11.5px', color: '#94A3B8', maxWidth: '180px' }}>
                          {w.notes || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            disabled={deletingId === w.id}
                            onClick={() => handleDeleteRecord(w.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#EF4444',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            {deletingId === w.id ? '...' : '✕ გაუქმება'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid #334155', background: '#0F172A' }}>
                    <td>სულ</td>
                    <td>—</td>
                    <td>{filteredHistory.length} ჩანაწერი</td>
                    <td style={{ textAlign: 'center', color: '#EF4444' }}>
                      {filteredHistory.reduce((sum, w) => sum + w.quantity, 0)} ც.
                    </td>
                    <td>—</td>
                    <td style={{ color: '#FB923C' }}>
                      {filteredHistory.reduce((sum, w) => {
                        const dish = dishes.find(d => d.id === w.productId);
                        return sum + (w.quantity * (w.costPrice ?? dish?.costPrice ?? 0));
                      }, 0).toFixed(2)} ₾
                    </td>
                    <td style={{ color: '#FCD34D' }}>
                      {filteredHistory.reduce((sum, w) => {
                        const dish = dishes.find(d => d.id === w.productId);
                        return sum + (w.quantity * (w.retailPrice ?? dish?.retailPrice ?? 15));
                      }, 0).toFixed(2)} ₾
                    </td>
                    <td>—</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: LOSS ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          {/* Breakdown by Reason */}
          <div className="admin-card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
              📊 ჩამოწერები მიზეზების მიხედვით
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {REASONS.map(r => {
                const countUnits = writeOffs.filter(w => w.reason === r.id).reduce((sum, w) => sum + w.quantity, 0);
                const percent = metrics.totalUnits > 0 ? (countUnits / metrics.totalUnits) * 100 : 0;
                const costLoss = writeOffs.filter(w => w.reason === r.id).reduce((sum, w) => {
                  const dish = dishes.find(d => d.id === w.productId);
                  return sum + (w.quantity * (w.costPrice ?? dish?.costPrice ?? 0));
                }, 0);

                return (
                  <div key={r.id} style={{ background: '#14171F', padding: '10px 12px', borderRadius: '6px', border: '1px solid #282E3A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{r.icon}</span>
                        <strong style={{ color: '#FFFFFF', fontSize: '12.5px' }}>{r.label}</strong>
                      </div>
                      <div>
                        <span style={{ color: r.color, fontWeight: 700, fontSize: '12.5px' }}>{countUnits} ც.</span>
                        <span style={{ fontSize: '10.5px', color: '#94A3B8', marginLeft: '5px' }}>({percent.toFixed(0)}%)</span>
                      </div>
                    </div>

                    <div style={{ height: '5px', background: '#1E2430', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: r.color, borderRadius: '3px' }} />
                    </div>

                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>ზარალი:</span>
                      <strong style={{ color: '#FB923C' }}>{costLoss.toFixed(2)} ₾</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown by Point */}
          <div className="admin-card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
              🏢 ჩამოწერები წერტილების მიხედვით
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {points.map(pt => {
                const ptWriteOffs = writeOffs.filter(w => w.pointId === pt.id);
                const ptUnits = ptWriteOffs.reduce((sum, w) => sum + w.quantity, 0);
                const ptCost = ptWriteOffs.reduce((sum, w) => {
                  const dish = dishes.find(d => d.id === w.productId);
                  return sum + (w.quantity * (w.costPrice ?? dish?.costPrice ?? 0));
                }, 0);
                const ptPercent = metrics.totalUnits > 0 ? (ptUnits / metrics.totalUnits) * 100 : 0;

                return (
                  <div key={pt.id} style={{ background: '#14171F', padding: '10px 12px', borderRadius: '6px', border: '1px solid #282E3A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#FFFFFF', fontSize: '12.5px' }}>
                        {getPointName(pt)}
                      </strong>
                      <div>
                        <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '12.5px' }}>{ptUnits} ც.</span>
                        <span style={{ fontSize: '10.5px', color: '#94A3B8', marginLeft: '5px' }}>({ptPercent.toFixed(0)}%)</span>
                      </div>
                    </div>

                    <div style={{ height: '5px', background: '#1E2430', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                      <div style={{ width: `${ptPercent}%`, height: '100%', background: '#EF4444', borderRadius: '3px' }} />
                    </div>

                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>ზარალი:</span>
                      <strong style={{ color: '#FB923C' }}>{ptCost.toFixed(2)} ₾</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
