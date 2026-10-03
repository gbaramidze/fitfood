'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';

interface PartnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerLoginModal: React.FC<PartnerLoginModalProps> = ({ isOpen, onClose }) => {
  const { points, loginWithPin, currentPoint } = usePartner();
  const [selectedPointId, setSelectedPointId] = useState<string>(
    currentPoint?.id || points[0]?.id || ''
  );
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verifyPin = (pinToTest: string) => {
    const res = loginWithPin(selectedPointId, pinToTest);
    if (res.success) {
      setPin('');
      setErrorMsg(null);
      onClose();
    } else {
      setErrorMsg('არასწორი PIN კოდი');
      setPin('');
    }
  };

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-min-pin-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>ავტორიზაცია PIN კოდით</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* Select Point */}
        <div className="pin-point-select-wrap">
          <select
            value={selectedPointId}
            onChange={e => {
              setSelectedPointId(e.target.value);
              setPin('');
              setErrorMsg(null);
            }}
            className="partner-min-input"
          >
            {points.map(p => (
              <option key={p.id} value={p.id}>
                📍 {p.name?.ka || p.name?.ru || 'წერტილი'} ({p.address?.ka || p.address?.ru})
              </option>
            ))}
          </select>
        </div>

        {/* PIN Indicators */}
        <div className="min-pin-dots">
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
                  onClick={handleBackspace}
                  className="min-key"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={btn}
                onClick={() => handleDigitClick(btn)}
                className="min-key"
              >
                {btn}
              </button>
            );
          })}
        </div>

        {/* Quick PIN hints */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #282E3A', fontSize: '11.5px', color: '#94A3B8', textAlign: 'center', lineHeight: '1.5' }}>
          <div>🏢 ოფისი / Admin PIN: <strong style={{ color: '#10B981' }}>0000</strong></div>
          <div style={{ marginTop: '2px' }}>💼 მოლარე: <strong>1111</strong> (Mega Gym) • <strong>2222</strong> (XXL) • <strong>3333</strong> (Fitness Academy)</div>
          <div style={{ marginTop: '2px' }}>👑 მენეჯერი: <strong>7777</strong> (Mega Gym) • <strong>8888</strong> (XXL) • <strong>9999</strong> (Fitness Academy)</div>
        </div>
      </div>
    </div>
  );
};
