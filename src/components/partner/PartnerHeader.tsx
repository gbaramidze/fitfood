'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';
import { getPointLogo } from '@/data/partnerData';

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
    logout,
  } = usePartner();

  const logoUrl = getPointLogo(currentPoint);
  const pointName = currentPoint?.name?.ka || currentPoint?.name?.ru || 'დარბაზი';
  const pointAddress = currentPoint?.address?.ka || currentPoint?.address?.ru || '';

  return (
    <header className="partner-minimal-header">
      {/* Left: Brand & Active Gym Logo Chip */}
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

        {/* Gym Point Badge with Logo */}
        <button
          type="button"
          onClick={openPinModal}
          className="partner-active-gym-chip"
          title="წერტილის შეცვლა / PIN"
        >
          <img
            src={logoUrl}
            alt={pointName}
            className="partner-chip-logo"
          />
          <div className="partner-chip-info">
            <span className="partner-chip-name">{pointName}</span>
            <span className="partner-chip-addr">{pointAddress}</span>
          </div>
          <span className={`partner-role-pill ${currentRole}`}>
            {currentRole === 'admin' ? '👑 Admin' : currentRole === 'manager' ? '💼 მენეჯერი' : '🟢 მოლარე'}
          </span>
        </button>
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

      {/* Right: Actions */}
      <div className="partner-min-right">
        <button
          onClick={openPinModal}
          className="partner-min-pin-btn"
          title="თანამშრომლის შეცვლა (PIN კოდი)"
        >
          🔑 PIN
        </button>
        <button
          onClick={logout}
          className="partner-min-logout-btn"
          title="გასვლა და სხვა დარბაზის არჩევა"
        >
          🚪 გასვლა
        </button>
      </div>
    </header>
  );
};
