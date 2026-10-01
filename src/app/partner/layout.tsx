import type { Metadata } from 'next';
import { PartnerProvider } from '@/context/PartnerContext';

export const metadata: Metadata = {
  title: 'FitFood Partner — POS & Управление точками',
  description: 'Терминал кассира, приемка рационов и панель менеджера партнерских точек FitFood.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PartnerProvider>
      <div className="partner-root-wrapper">
        {children}
      </div>
    </PartnerProvider>
  );
}
