'use client';

import React from 'react';
import './admin.css';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { AdminIncomingOrders } from '@/components/admin/AdminIncomingOrders';
import { AdminCustomersCRM } from '@/components/admin/AdminCustomersCRM';
import { AdminPosSalesHistory } from '@/components/admin/AdminPosSalesHistory';
import { AdminProgramsManager } from '@/components/admin/AdminProgramsManager';
import { AdminDishesManager } from '@/components/admin/AdminDishesManager';
import { AdminPointTransfers } from '@/components/admin/AdminPointTransfers';
import { AdminExpensesPayroll } from '@/components/admin/AdminExpensesPayroll';
import { AdminPointsSettings } from '@/components/admin/AdminPointsSettings';
import { AdminDish, AdminExpense, AdminSalary } from '@/types/admin';
import { PartnerPoint, PartnerSale } from '@/types/partner';

function AdminMainContent() {
  const { activeTab } = useAdmin();

  return (
    <main className="admin-main-content">
      {activeTab === 'overview' && <AdminDashboardOverview />}
      {activeTab === 'orders' && <AdminIncomingOrders />}
      {activeTab === 'customers' && <AdminCustomersCRM />}
      {activeTab === 'sales' && <AdminPosSalesHistory />}
      {activeTab === 'programs' && <AdminProgramsManager />}
      {activeTab === 'dishes' && <AdminDishesManager />}
      {activeTab === 'transfers' && <AdminPointTransfers />}
      {activeTab === 'expenses' && <AdminExpensesPayroll />}
      {activeTab === 'points' && <AdminPointsSettings />}
    </main>
  );
}

interface AdminClientLayoutProps {
  initialDishes?: AdminDish[];
  initialExpenses?: AdminExpense[];
  initialSalaries?: AdminSalary[];
  initialPoints?: PartnerPoint[];
  initialSales?: PartnerSale[];
}

export const AdminClientLayout: React.FC<AdminClientLayoutProps> = ({
  initialDishes = [],
  initialExpenses = [],
  initialSalaries = [],
  initialPoints = [],
  initialSales = [],
}) => {
  return (
    <AdminProvider
      initialServerDishes={initialDishes}
      initialServerExpenses={initialExpenses}
      initialServerSalaries={initialSalaries}
      initialServerPoints={initialPoints}
      initialServerSales={initialSales}
    >
      <div className="admin-root-container">
        <AdminHeader />
        <div className="admin-body-layout">
          <AdminSidebar />
          <AdminMainContent />
        </div>
      </div>
    </AdminProvider>
  );
};
