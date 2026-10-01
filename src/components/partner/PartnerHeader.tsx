'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';

interface PartnerHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openPinModal: () => void;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  activeTab,
  setActiveTab,
  openPinModal,
}) => {
  const {
    currentPoint,
    currentRole,
    points,
    selectPoint,
  } = usePartner();

  return (
    <header className="partner-minimal-header">
      {/* Left: Brand & Point */}
      <div className="partner-min-left">
        <Link href="/" className="partner-min-logo">
          <div className="partner-min-logo-img">
            <Image
              src="/images/logo-white.png"
              alt="FitFood"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className="partner-min-logo-text">
            <span className="brand-name">FITFOOD</span>
            <span className="portal-name">PARTNER POS</span>
          </div>
        </Link>

        {currentRole === 'cashier' ? (
          <div className="partner-min-point-locked" title="გაყიდვის წერტილი">
            <span style={{ fontSize: '13px' }}>📍</span>
            <span>{currentPoint?.name.ka || currentPoint?.name.ru}</span>
            <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '4px' }}>
              ({currentPoint?.address.ka || currentPoint?.address.ru})
            </span>
          </div>
        ) : (
          <div className="partner-min-point-wrap" title="წერტილის არჩევა">
            <select
              value={currentPoint?.id || ''}
              onChange={e => selectPoint(e.target.value)}
              className="partner-min-select"
            >
              {points.map(p => (
                <option key={p.id} value={p.id}>
                  📍 {p.name.ka || p.name.ru} — {p.address.ka || p.address.ru}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center: Georgian Nav Pills */}
      <nav className="partner-min-nav">
        <button
          onClick={() => setActiveTab('pos')}
          className={`partner-min-tab ${activeTab === 'pos' ? 'active' : ''}`}
        >
          სალარო (POS)
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`partner-min-tab ${activeTab === 'receipts' ? 'active' : ''}`}
        >
          ჩეკები
        </button>

        <button
          onClick={() => setActiveTab('shipments')}
          className={`partner-min-tab ${activeTab === 'shipments' ? 'active' : ''}`}
        >
          მიღება
        </button>

        <button
          onClick={() => setActiveTab('zreport')}
          className={`partner-min-tab ${activeTab === 'zreport' ? 'active' : ''}`}
        >
          დღიური ანგარიში
        </button>
      </nav>

      {/* Right: PIN Authentication only */}
      <div className="partner-min-right">
        <button
          onClick={openPinModal}
          className="partner-min-pin-btn"
          title="თანამშრომლის შეცვლა (PIN კოდი)"
        >
          🔑 PIN
        </button>
      </div>
    </header>
  );
};
