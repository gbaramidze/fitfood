'use client';

import React, { useState } from 'react';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PosTerminalView } from '@/components/partner/PosTerminalView';
import { ReceiptsHistoryView } from '@/components/partner/ReceiptsHistoryView';
import { ShipmentsView } from '@/components/partner/ShipmentsView';
import { ZReportView } from '@/components/partner/ZReportView';
import { PartnerLoginModal } from '@/components/partner/PartnerLoginModal';

export default function PartnerPage() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

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

      {/* PIN Modal */}
      <PartnerLoginModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
}
