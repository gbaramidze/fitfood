import type { Metadata } from 'next';
import { OrderExperience } from '@/components/order/OrderExperience';

export const metadata: Metadata = {
  title: 'Заказать рацион — FitFood Batumi',
  description: 'Соберите свой рацион за 3 минуты: программа, калории, срок, стоп-лист, меню по дням и доставка по Батуми.',
};

export default function OrderPage() {
  return <OrderExperience />;
}
