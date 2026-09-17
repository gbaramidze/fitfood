'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';

export default function QuizPage() {
  const { setIsQuizOpen } = useStore();
  const router = useRouter();

  useEffect(() => {
    setIsQuizOpen(true);
    router.replace('/');
  }, [setIsQuizOpen, router]);

  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
      <p>Загрузка калькулятора рациона...</p>
    </div>
  );
}
