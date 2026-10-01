'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { CartDrawer } from '@/components/CartDrawer';
import { DishModal } from '@/components/DishModal';
import { QuizModal } from '@/components/QuizModal';
import { PreLaunchLanding } from '@/components/PreLaunchLanding';

// In Pre-launch mode, public pages show the landing page
const PRE_LAUNCH_MODE = true;

export const SiteNavigationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  // Admin & Partner POS routes are fully active internal workstations
  const isSpecialWorkstation = pathname?.startsWith('/admin') || pathname?.startsWith('/partner');

  if (isSpecialWorkstation) {
    return <>{children}</>;
  }

  // Pre-launch mode: clean dedicated landing page without store headers/footers
  if (PRE_LAUNCH_MODE) {
    // If user tries to access /menu, /checkout, /quiz, etc., render the pre-launch landing
    if (pathname !== '/') {
      return <PreLaunchLanding />;
    }
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <MobileNav />
      <CartDrawer />
      <DishModal />
      <QuizModal />
    </>
  );
};
