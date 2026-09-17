import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { StoreProvider } from '@/context/StoreContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { CartDrawer } from '@/components/CartDrawer';
import { DishModal } from '@/components/DishModal';
import { QuizModal } from '@/components/QuizModal';

export const metadata: Metadata = {
  title: 'FitFood — Сервис доставки правильного и спортивного питания в Батуми',
  description: 'Готовые рационы питания с расчетом КБЖУ, доставкой каждые 2 дня в Батуми. Линейки от 750 до 3000 ккал: Снижение, Баланс, Набор, Детокс.',
  keywords: 'FitFood, Level Kitchen, Grow Food, доставка правильного питания Батуми, рационы еды, фитнес еда, готовая еда с доставкой',
  openGraph: {
    title: 'FitFood — Умная доставка готового правильного питания',
    description: 'Интерактивное меню 30 дней без повторов, 4 линейки рационов, точный расчет нутриентов.',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <LanguageProvider>
          <StoreProvider>
            <Header />
            {children}
            <Footer />
            <MobileNav />
            <CartDrawer />
            <DishModal />
            <QuizModal />
          </StoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
