'use client';

import React from 'react';
import { ShoppingCart, Receipt, ClipboardList, BarChart3 } from 'lucide-react';

interface PartnerSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS: { id: string; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'operations', label: 'საწყობი', icon: ShoppingCart },
  { id: 'receipts', label: 'ჩეკები', icon: Receipt },
  { id: 'preorder', label: 'შეკვეთები', icon: ClipboardList },
  { id: 'zreport', label: 'დღის ანგარიში', icon: BarChart3 },
];

export const PartnerSidebar: React.FC<PartnerSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="partner-sidebar">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`partner-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="partner-sidebar-icon"><Icon size={17} /></span>
            <span className="partner-sidebar-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
