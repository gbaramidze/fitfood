'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { usePartner } from '@/context/PartnerContext';
import { getPointLogo } from '@/data/partnerData';

interface PartnerLoginModalProps {
  isOpen: boolean;
  isFullScreen?: boolean;
  onClose?: () => void;
  defaultPointId?: string;
}

export const PartnerLoginModal: React.FC<PartnerLoginModalProps> = ({
  isOpen,
  isFullScreen = false,
  onClose,
  defaultPointId,
}) => {
  const { points, loginWithPin, currentPoint, isAuthenticated } = usePartner();
  
  // Available points with logos
  const activePoints = points.filter(p => p.status === 'active');
  const displayPoints = activePoints.length > 0 ? activePoints : points;

  const [selectedPointId, setSelectedPointId] = useState<string>(
    defaultPointId || currentPoint?.id || displayPoints[0]?.id || 'point-mega-gym'
  );
  const [step, setStep] = useState<'select-point' | 'enter-pin'>('select-point');
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Sync selected point if defaultPointId changes
  useEffect(() => {
    if (defaultPointId) {
      setSelectedPointId(defaultPointId);
    } else if (currentPoint?.id) {
      setSelectedPointId(currentPoint.id);
    }
  }, [defaultPointId, currentPoint?.id]);

  const selectedPoint = displayPoints.find(p => p.id === selectedPointId) || displayPoints[0];

  const verifyPin = useCallback((pinToTest: string) => {
    const res = loginWithPin(selectedPointId, pinToTest);
    if (res.success) {
      setPin('');
      setErrorMsg(null);
      if (onClose) onClose();
    } else {
      setErrorMsg(res.message || 'არასწორი PIN კოდი');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
    }
  }, [loginWithPin, selectedPointId, onClose]);

  const handleDigitClick = useCallback((digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  }, [pin, verifyPin]);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  }, []);

  // Keyboard handler for touch/desktop typing
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'enter-pin') {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleDigitClick(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleBackspace();
        } else if (e.key === 'Escape') {
          if (isAuthenticated && onClose) {
            onClose();
          } else {
            setStep('select-point');
            setPin('');
            setErrorMsg(null);
          }
        }
      } else if (step === 'select-point') {
        if (e.key === 'Escape' && isAuthenticated && onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, handleDigitClick, handleBackspace, isAuthenticated, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={`pos-modal-overlay ${isFullScreen ? 'fullscreen-auth' : ''}`}
      onClick={() => {
        if (!isFullScreen && isAuthenticated && onClose) onClose();
      }}
    >
      <div 
        className={`partner-auth-card ${step === 'select-point' ? 'step-select-mode' : 'step-pin-mode'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="partner-auth-topbar">
          <div className="partner-auth-brand">
            <div className="brand-logo-glow">
              <Image
                src="/images/logo-white.png"
                alt="FitFood Partner"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div>
              <span className="brand-title">FITFOOD</span>
              <span className="brand-subtitle">PARTNER POS</span>
            </div>
          </div>

          {!isFullScreen && isAuthenticated && onClose && (
            <button 
              type="button" 
              onClick={onClose} 
              className="partner-auth-close-btn"
              title="დახურვა"
            >
              ✕
            </button>
          )}
        </div>

        {/* STEP 1: Point Selection with prominent logos */}
        {step === 'select-point' && (
          <div className="partner-auth-step-point">
            <div className="partner-auth-heading">
              <h2>აირჩიეთ გაყიდვის წერტილი</h2>
              <p>ავტორიზაციისთვის დააჭირეთ დარბაზის ლოგოს</p>
            </div>

            <div className="partner-points-selection-grid">
              {displayPoints.map(point => {
                const logoUrl = getPointLogo(point);
                const pointName = point.name?.ka || point.name?.ru || 'დარბაზი';
                const pointAddress = point.address?.ka || point.address?.ru || point.city || '';
                const isSelected = selectedPointId === point.id;

                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => {
                      setSelectedPointId(point.id);
                      setStep('enter-pin');
                      setPin('');
                      setErrorMsg(null);
                    }}
                    className={`partner-point-select-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    <div className="partner-point-logo-container">
                      <img
                        src={logoUrl}
                        alt={pointName}
                        className="partner-point-img"
                      />
                    </div>
                    <div className="partner-point-details">
                      <h3 className="partner-point-name">{pointName}</h3>
                      <span className="partner-point-addr">📍 {pointAddress}</span>
                    </div>
                    <div className="partner-point-enter-badge">
                      ავტორიზაცია PIN-ით →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PIN Entry for the selected gym */}
        {step === 'enter-pin' && selectedPoint && (
          <div className="partner-auth-step-pin">
            {/* Selected Gym Chip & Switch button */}
            <div className="partner-selected-gym-bar">
              <button
                type="button"
                onClick={() => {
                  setStep('select-point');
                  setPin('');
                  setErrorMsg(null);
                }}
                className="partner-back-to-points-btn"
                title="წერტილის შეცვლა"
              >
                ← სხვა დარბაზი
              </button>

              <div className="partner-current-gym-chip">
                <img
                  src={getPointLogo(selectedPoint)}
                  alt={selectedPoint.name?.ka}
                  className="gym-chip-logo"
                />
                <div className="gym-chip-text">
                  <b>{selectedPoint.name?.ka || selectedPoint.name?.ru}</b>
                  <span>📍 {selectedPoint.address?.ka || selectedPoint.address?.ru}</span>
                </div>
              </div>
            </div>

            <div className="partner-pin-prompt">
              <h3>შეიყვანეთ PIN კოდი</h3>
              <p>მოლარის, მენეჯერის ან ადმინისტრატორის კოდი</p>
            </div>

            {/* PIN Indicators */}
            <div className={`min-pin-dots ${isShaking ? 'shake-anim' : ''}`}>
              {[0, 1, 2, 3].map(index => (
                <div
                  key={index}
                  className={`min-pin-dot ${index < pin.length ? 'active' : ''} ${
                    errorMsg ? 'error' : ''
                  }`}
                />
              ))}
            </div>

            {errorMsg && <div className="min-pin-error">{errorMsg}</div>}

            {/* Numeric Keypad */}
            <div className="min-pin-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => {
                if (btn === 'C') {
                  return (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => {
                        setPin('');
                        setErrorMsg(null);
                      }}
                      className="min-key clear"
                    >
                      C
                    </button>
                  );
                }
                if (btn === '⌫') {
                  return (
                    <button
                      key={btn}
                      type="button"
                      onClick={handleBackspace}
                      className="min-key backspace"
                    >
                      ⌫
                    </button>
                  );
                }
                return (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleDigitClick(btn)}
                    className="min-key digit"
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
