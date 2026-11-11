import type { Metadata, Viewport } from 'next';
import { AdminProvider } from '@/context/AdminContext';
import { KitchenProvider } from '@/context/KitchenContext';
import './kitchen.css';

export const metadata: Metadata = {
  title: 'FitFood — სამზარეულო (პლანშეტი)',
  description: 'მომზადების გეგმა, რაციონები, დარბაზების ნაშთები და კლიენტის ბარათები სამზარეულოსთვის.',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0B0D12',
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  // AdminProvider already loads (and live-syncs) sales, stock per hall, preorders, points and dishes —
  // the same data the admin sales forecast uses.
  return (
    <AdminProvider>
      <KitchenProvider>{children}</KitchenProvider>
    </AdminProvider>
  );
}
