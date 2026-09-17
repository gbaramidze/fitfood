'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Dish, OrderConfirmation, UserSubscription } from '@/types';
import { dishes } from '@/data/dishes';
import { programs } from '@/data/programs';
import { IconSparkles } from '@/components/Icons';

interface StoreContextType {
  cart: CartItem | null;
  setCart: React.Dispatch<React.SetStateAction<CartItem | null>>;
  addToCart: (item: CartItem) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isQuizOpen: boolean;
  setIsQuizOpen: (open: boolean) => void;
  selectedDish: Dish | null;
  setSelectedDish: (dish: Dish | null) => void;
  dishSwaps: Record<string, string>; // originalDishId -> replacedDishId
  swapDish: (originalId: string, replacementId: string) => void;
  userSubscription: UserSubscription;
  freezeTomorrow: () => void;
  orders: OrderConfirmation[];
  addOrder: (order: OrderConfirmation) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishSwaps, setDishSwaps] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderConfirmation[]>([]);

  // Realistic mock subscription
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    isActive: true,
    programTitle: 'Balance Life (1700 kcal)',
    calories: 1700,
    totalDays: 7,
    remainingDays: 5,
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    frozenDates: [],
    todayStatus: 'delivered',
    address: 'Batumi, Rustaveli 24, apt 12',
    zoneName: 'Старый Батуми / Центр',
    referralCode: 'BATUMI-FIT-77',
    bonusPointsGEL: 40,
  });

  // Load from local storage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('fitfood_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedOrders = localStorage.getItem('fitfood_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedSub = localStorage.getItem('fitfood_sub');
      if (savedSub) setUserSubscription(JSON.parse(savedSub));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(item);
    localStorage.setItem('fitfood_cart', JSON.stringify(item));
    setIsCartOpen(true);
    showToast('Рацион добавлен в корзину');
  };

  const clearCart = () => {
    setCart(null);
    localStorage.removeItem('fitfood_cart');
  };

  const swapDish = (originalId: string, replacementId: string) => {
    setDishSwaps(prev => ({
      ...prev,
      [originalId]: replacementId,
    }));
    showToast('Блюдо успешно заменено в вашем плане');
  };

  const freezeTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setUserSubscription(prev => {
      const updated = {
        ...prev,
        frozenDates: [...prev.frozenDates, dateStr],
      };
      localStorage.setItem('fitfood_sub', JSON.stringify(updated));
      return updated;
    });
    showToast('Завтрашний день успешно заморожен без потери дней!');
  };

  const addOrder = (order: OrderConfirmation) => {
    const updated = [order, ...orders];
    setOrders(updated);
    localStorage.setItem('fitfood_orders', JSON.stringify(updated));
    clearCart();
    const days = order.cartItem.daysDuration || 12;
    setUserSubscription({
      isActive: true,
      programTitle: order.cartItem.programTitle || 'MealBox Premium',
      calories: order.cartItem.dailyCalories || 1500,
      totalDays: days,
      remainingDays: days,
      startDate: order.deliveryDate,
      endDate: new Date(Date.now() + days * 86400000).toISOString().split('T')[0],
      frozenDates: [],
      todayStatus: 'cooking',
      address: order.address,
      zoneName: order.zone,
      referralCode: 'MEALBOX-77',
      bonusPointsGEL: 40,
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isQuizOpen,
        setIsQuizOpen,
        selectedDish,
        setSelectedDish,
        dishSwaps,
        swapDish,
        userSubscription,
        freezeTomorrow,
        orders,
        addOrder,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="toast-notification" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconSparkles size={16} style={{ color: 'var(--accent-gold)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
