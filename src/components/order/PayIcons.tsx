import React from 'react';

/** Small card-network and wallet marks shown next to "pay online". Simple drawings, not the official artwork. */
export function PayIcons() {
  return (
    <span className="pay-icons" aria-label="Visa, Mastercard, Apple Pay, Google Pay">
      {/* Visa */}
      <svg viewBox="0 0 48 30" role="img" aria-label="Visa">
        <rect width="48" height="30" rx="5" fill="#fff" />
        <text x="24" y="20.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="15" letterSpacing="-0.6" fill="#1A1F71">VISA</text>
      </svg>
      {/* Mastercard */}
      <svg viewBox="0 0 48 30" role="img" aria-label="Mastercard">
        <rect width="48" height="30" rx="5" fill="#fff" />
        <circle cx="19" cy="15" r="9" fill="#EB001B" />
        <circle cx="29" cy="15" r="9" fill="#F79E1B" />
        <path d="M24 7.7a9 9 0 0 1 0 14.6 9 9 0 0 1 0-14.6z" fill="#FF5F00" />
      </svg>
      {/* Apple Pay */}
      <svg viewBox="0 0 48 30" role="img" aria-label="Apple Pay">
        <rect width="48" height="30" rx="5" fill="#000" />
        <g fill="#fff">
          <path d="M14.6 11.2c.7-.9 1.7-1.4 2.6-1.4.1 1-.3 1.9-.9 2.6-.6.7-1.5 1.2-2.5 1.1-.1-.9.3-1.8.8-2.3z" />
          <path d="M13.9 13.2c1.3 0 1.8.8 2.9.8 1.1 0 1.8-.8 2.9-.8-.2.3-1.6.9-1.6 2.9 0 2 1.7 2.7 1.7 2.8 0 0-.7 2.3-2.2 2.3-.9 0-1.2-.6-2.3-.6-1 0-1.4.6-2.3.6-1.6 0-3.1-3-3.1-5 0-1.9 1.2-3 2.3-3 .9 0 1.4.6 1.7 0z" transform="translate(.6 -.8)" />
        </g>
        <text x="31" y="19.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="600" fontSize="12.5" fill="#fff">Pay</text>
      </svg>
      {/* Google Pay */}
      <svg viewBox="0 0 48 30" role="img" aria-label="Google Pay">
        <rect width="48" height="30" rx="5" fill="#fff" />
        <defs>
          <linearGradient id="gpay-g" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#EA4335" />
            <stop offset="0.3" stopColor="#EA4335" />
            <stop offset="0.3" stopColor="#FBBC05" />
            <stop offset="0.55" stopColor="#FBBC05" />
            <stop offset="0.55" stopColor="#34A853" />
            <stop offset="0.78" stopColor="#34A853" />
            <stop offset="0.78" stopColor="#4285F4" />
            <stop offset="1" stopColor="#4285F4" />
          </linearGradient>
        </defs>
        <text x="13" y="20.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="17" fill="url(#gpay-g)">G</text>
        <text x="31" y="19.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="600" fontSize="12.5" fill="#5F6368">Pay</text>
      </svg>
    </span>
  );
}
