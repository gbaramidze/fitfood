'use client';

import React from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

export const AdminHeader: React.FC = () => {
  const { 
    setActiveTab, 
    searchQuery, 
    setSearchQuery, 
    incomingOrders,
    customers,
    exportDataJson 
  } = useAdmin();

  const newOrdersCount = incomingOrders.filter(o => o.status === 'new').length;
  const activeSubsCount = customers.filter(c => c.status === 'active').length;

  return (
    <header className="admin-top-header">
      <div className="admin-header-left">
        <Link href="/" className="admin-brand-link">
          <div className="admin-brand-badge">FITFOOD</div>
          <span className="admin-brand-title">მართვის პანელი</span>
        </Link>
        <span className="admin-badge-hq">სათავო ოფისი • ბათუმი</span>
      </div>

      <div className="admin-header-center">
        <div className="admin-search-wrapper">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="ძებნა კლიენტის, ტელეფონის, კერძის, შეკვეთის მიხედვით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="admin-search-clear">×</button>
          )}
        </div>
      </div>

      <div className="admin-header-right">
        {newOrdersCount > 0 && (
          <button 
            onClick={() => setActiveTab('orders')} 
            className="admin-alert-chip"
            title="ახალი შემოსული შეკვეთები"
          >
            <span className="alert-dot"></span>
            <span>{newOrdersCount} ახალი შეკვეთა</span>
          </button>
        )}

        <div className="admin-header-stats-pill">
          <span>აქტიური აბონემენტი: <b>{activeSubsCount}</b></span>
        </div>

        <button 
          onClick={exportDataJson} 
          className="admin-action-btn btn-secondary"
          title="მონაცემების ექსპორტი (JSON)"
        >
          ექსპორტი
        </button>

        <Link href="/" className="admin-action-btn btn-site" target="_blank">
          საიტზე გადასვლა ↗
        </Link>
      </div>
    </header>
  );
};
