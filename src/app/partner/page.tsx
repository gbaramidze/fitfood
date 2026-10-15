'use client';

import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PosTerminalView } from '@/components/partner/PosTerminalView';
import { ReceiptsHistoryView } from '@/components/partner/ReceiptsHistoryView';
import { ShipmentsView } from '@/components/partner/ShipmentsView';
import { ZReportView } from '@/components/partner/ZReportView';
import { PartnerLoginModal } from '@/components/partner/PartnerLoginModal';

export default function PartnerPage() {
  const { isAuthenticated } = usePartner();
  const [activeTab, setActiveTab] = useState<string>('pos');
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
      <PartnerHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openPinModal={() => setIsPinModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="partner-min-main">
        {activeTab === 'pos' && <PosTerminalView />}
        {activeTab === 'receipts' && <ReceiptsHistoryView />}
        {activeTab === 'shipments' && <ShipmentsView />}
        {activeTab === 'zreport' && <ZReportView />}
      </main>

      {/* PIN Modal on demand from header */}
      <PartnerLoginModal
        isOpen={isPinModalOpen}
        isFullScreen={false}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
}
