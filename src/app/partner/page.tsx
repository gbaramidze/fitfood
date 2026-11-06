'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { OperationsView } from '@/components/partner/OperationsView';
import { ReceiptsHistoryView } from '@/components/partner/ReceiptsHistoryView';
import { ZReportView } from '@/components/partner/ZReportView';
import { PreorderView } from '@/components/partner/PreorderView';
import { PartnerLoginModal } from '@/components/partner/PartnerLoginModal';

export default function PartnerPage() {
  const { isAuthenticated } = usePartner();
  const [activeTab, setActiveTab] = useState<string>('operations');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // If not authenticated yet, show full-screen auth with the point logos selection & PIN
  if (!isAuthenticated) {
    return (
      <div className="partner-minimal-workstation partner-auth-fullscreen-wrap">
        <PartnerLoginModal
          isOpen={true}
          isFullScreen={true}
        />
      </div>
    );
  }

  return (
    <div className="partner-minimal-workstation">
      {/* Topbar */}
      <PartnerHeader openPinModal={() => setIsPinModalOpen(true)} />

      <div className="partner-min-body">
        {/* Sidebar */}
        <PartnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Workspace Area */}
        <main className="partner-min-main">
          {activeTab === 'operations' && <OperationsView />}
          {activeTab === 'receipts' && <ReceiptsHistoryView />}
          {activeTab === 'preorder' && <PreorderView />}
          {activeTab === 'zreport' && <ZReportView />}
        </main>
      </div>

      {/* PIN Modal on demand from header */}
      <PartnerLoginModal
        isOpen={isPinModalOpen}
        isFullScreen={false}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
}
