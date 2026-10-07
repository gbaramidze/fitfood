'use client';

import React from 'react';
import { useAdmin, AdminTab } from '@/context/AdminContext';

export const AdminSidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    incomingOrders,
    customers,
    sales,
    programs,
    dishes,
    transfers,
    writeOffs,
    points 
  } = useAdmin();

  const newOrdersCount = incomingOrders.filter(o => o.status === 'new').length;
  const activeClientsCount = customers.filter(c => c.status === 'active').length;

  const menuItems: { id: AdminTab; label: string; icon: string; count?: number; countHighlight?: boolean }[] = [
    {
      id: 'overview',
      label: 'მთავარი მიმოხილვა',
      icon: '📊',
    },
    {
      id: 'orders',
      label: 'შემოსული შეკვეთები',
      icon: '📥',
      count: newOrdersCount > 0 ? newOrdersCount : incomingOrders.length,
      countHighlight: newOrdersCount > 0,
    },
    {
      id: 'customers',
      label: 'კლიენტები & მიწოდება',
      icon: '👤',
      count: activeClientsCount,
    },
    {
      id: 'sales',
      label: 'წერტილების გაყიდვები',
      icon: '🧾',
      count: sales.length,
    },
    {
      id: 'programs',
      label: 'რაციონები & მოთხოვნა',
      icon: '🥗',
      count: programs.length,
    },
    {
      id: 'dishes',
      label: 'კერძების ბაზა (მენიუ)',
      icon: '🍱',
      count: dishes.length,
    },
    {
      id: 'transfers',
      label: 'წერტილების ლოჯისტიკა',
      icon: '🚚',
      count: transfers.length,
    },
    {
      id: 'writeoffs',
      label: 'საქონლის ჩამოწერა & ბრაკი',
      icon: '🗑️',
      count: writeOffs.length,
    },
    {
      id: 'expenses',
      label: 'ხარჯები & ხელფასები',
      icon: '💼',
    },
    {
      id: 'points',
      label: 'წერტილები & POS',
      icon: '🏢',
      count: points.length,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-section-title">ნავიგაცია</div>
      <nav className="admin-nav-list">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
              {item.count !== undefined && (
                <span className={`admin-nav-count ${item.countHighlight ? 'count-alert' : ''}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-card">
          <div className="admin-avatar">🏢</div>
          <div className="admin-user-info">
            <div className="admin-user-name">ხელმძღვანელი</div>
            <div className="admin-user-role">ადმინისტრატორი</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
