'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';
import { getPointLogo } from '@/data/partnerData';
import { Crown, Briefcase, Circle, KeyRound, LogOut } from 'lucide-react';

interface PartnerHeaderProps {
  openPinModal: () => void;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
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
            {currentRole === 'admin' ? (
              <><Crown size={11} /> Admin</>
            ) : currentRole === 'manager' ? (
              <><Briefcase size={11} /> მენეჯერი</>
            ) : (
              <><Circle size={8} fill="currentColor" /> მოლარე</>
            )}
          </span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="partner-min-right">
        <button
          onClick={openPinModal}
          className="partner-min-pin-btn"
          title="თანამშრომლის შეცვლა (PIN კოდი)"
        >
          <KeyRound size={13} /> PIN
        </button>
        <button
          onClick={logout}
          className="partner-min-logout-btn"
          title="გასვლა და სხვა დარბაზის არჩევა"
        >
          <LogOut size={13} /> გასვლა
        </button>
      </div>
    </header>
  );
};
