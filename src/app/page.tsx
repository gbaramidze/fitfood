import type { Metadata } from 'next';
import { OrderExperience } from '@/components/order/OrderExperience';

export const metadata: Metadata = {
  title: 'FitFood Batumi — рационы питания с доставкой',
  description: 'Соберите свой рацион за 3 минуты: программа, калории, срок, стоп-лист, меню на неделю и вечерняя доставка по Батуми.',
};

export default function HomePage() {
  return <OrderExperience />;
}
