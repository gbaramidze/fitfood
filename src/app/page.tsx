'use client';

import React from 'react';
import { HeroSection } from '@/components/HeroSection';
import { ProgramsSection } from '@/components/ProgramsSection';
import { KitchenTrust } from '@/components/KitchenTrust';
import { TouristPassSection } from '@/components/TouristPassSection';
import { ReviewsSection } from '@/components/ReviewsSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ProgramsSection />
      <KitchenTrust />
      <TouristPassSection />
      <ReviewsSection />
    </main>
  );
}
