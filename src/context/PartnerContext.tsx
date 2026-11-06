'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PartnerPoint,
  PartnerProduct,
  PartnerRole,
  PartnerSale,
  PartnerShipment,
  PartnerWriteOff,
  PartnerPreorder
} from '@/types/partner';
import { 
  initialPartnerPoints, 
  initialStocks, 
  initialShipments, 
  initialSales, 
  initialWriteOffs 
} from '@/data/partnerData';
import { partnerDbService, sortPartnerProducts } from '@/services/partnerDbService';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface CreatePreorderParams {
  pointId: string;
  items: { product: PartnerProduct; quantity: number }[];
  comment: string;
  pickupDate?: string; // YYYY-MM-DD, defaults to tomorrow if omitted
  paymentMethod: 'card' | 'cash';
}

interface EditPreorderParams {
  preorderId: string;
  items?: { product: PartnerProduct; quantity: number }[];
  comment?: string;
  pickupDate?: string;
  paymentMethod?: 'card' | 'cash';
}

// YYYY-MM-DD for N days from today (Tbilisi local date)
const getTbilisiDateStr = (daysFromToday: number): string => {
  const now = new Date();
  const tbilisiNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tbilisi' }));
  tbilisiNow.setDate(tbilisiNow.getDate() + daysFromToday);
  const y = tbilisiNow.getFullYear();
  const m = String(tbilisiNow.getMonth() + 1).padStart(2, '0');
  const d = String(tbilisiNow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface CompleteSaleParams {
  pointId: string;
  items: { product: PartnerProduct; quantity: number }[];
  paymentMethod: 'card' | 'cash' | 'split' | 'free';
  splitDetails?: { cashAmount: number; cardAmount: number };
  discountType?: 'none' | 'percent50' | 'free' | 'fixed4';
  discountComment?: string;
  notes?: string;
}

export interface EditSaleParams {
  saleId: string;
  paymentMethod?: 'card' | 'cash' | 'split' | 'free';
  splitDetails?: { cashAmount: number; cardAmount: number };
  items?: { productId: string; productName: string; quantity: number; pricePerUnit: number; totalPrice: number }[];
  discountType?: 'none' | 'percent50' | 'free' | 'fixed4';
  discountComment?: string;
  totalAmount?: number;
  notes?: string;
}

interface PartnerContextType {
  // Current session
  currentPoint: PartnerPoint | null;
  currentRole: PartnerRole;
  isAuthenticated: boolean;
  points: PartnerPoint[];
  products: PartnerProduct[];
  
  // Data
  stocks: Record<string, Record<string, number>>; // [pointId][productId] = qty
  shipments: PartnerShipment[];
  sales: PartnerSale[];
  writeOffs: PartnerWriteOff[];
  preorders: PartnerPreorder[];

  // Session actions
  loginWithPin: (pointId: string, pin: string) => { success: boolean; role?: PartnerRole; message?: string };
  switchRole: (role: PartnerRole) => void;
  selectPoint: (pointId: string) => void;
  logout: () => void;

  // POS / Cashier actions
  completeSale: (params: CompleteSaleParams) => PartnerSale;
  editSale: (params: EditSaleParams) => boolean;
  deleteSale: (saleId: string, returnStockToShelf?: boolean) => boolean;
  refundSale: (saleId: string, reason?: string) => boolean;
  createWriteOff: (pointId: string, productId: string, quantity: number, reason: 'expired' | 'damaged' | 'sample' | 'other', note?: string) => boolean;
  notifyWriteOffBatch: (pointId: string, items: { productName: string; quantity: number; totalValue?: number }[], reasonText: string, note?: string) => void;

  // Preorder actions (paid in advance with -50%, not deducted from stock until fulfilled)
  createPreorder: (params: CreatePreorderParams) => PartnerPreorder;
  editPreorder: (params: EditPreorderParams) => boolean;
  fulfillPreorder: (preorderId: string) => boolean;
  cancelPreorder: (preorderId: string, reason?: string) => boolean;
  deletePreorder: (preorderId: string) => boolean;
  getPointPreorders: (pointId: string) => PartnerPreorder[];
  getTomorrowDateStr: () => string;

  // HQ Admin & Point actions
  createShipment: (pointId: string, items: { productId: string; quantity: number }[], note?: string) => PartnerShipment;
  quickRestockPoint: (pointId: string, unitsPerDish?: number) => PartnerShipment;
  addNewPoint: (point: Omit<PartnerPoint, 'id'>) => PartnerPoint;
  
  // Quick getters
  getPointStock: (pointId: string, productId: string) => number;
  getPointTodaySales: (pointId: string) => PartnerSale[];
  getPointSalesByPeriod: (pointId: string, days?: number) => PartnerSale[];
  resetToDefaults: () => void;
  refreshData: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<PartnerPoint[]>(initialPartnerPoints);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [stocks, setStocks] = useState<Record<string, Record<string, number>>>(initialStocks);
  const [shipments, setShipments] = useState<PartnerShipment[]>(initialShipments);
  const [sales, setSales] = useState<PartnerSale[]>(initialSales);
  const [writeOffs, setWriteOffs] = useState<PartnerWriteOff[]>(initialWriteOffs);
  const [preorders, setPreorders] = useState<PartnerPreorder[]>([]);

  const [currentPoint, setCurrentPoint] = useState<PartnerPoint | null>(initialPartnerPoints[0]);
  const [currentRole, setCurrentRole] = useState<PartnerRole>('manager');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);

  const loadAllData = async () => {
    // 1. Products (Strictly and dynamically from Supabase database `partner_products`)
    try {
      const dbProducts = await partnerDbService.getProducts();
      setProducts(sortPartnerProducts(dbProducts || []));
    } catch (e) {
      console.warn('Supabase products fetch error:', e);
      setProducts([]);
    }

    // 2. Points
    try {
      const dbPoints = await partnerDbService.getPoints();
      if (dbPoints && dbPoints.length > 0) {
        setPoints(dbPoints);
      } else {
        setPoints(initialPartnerPoints);
      }
    } catch (e) {
      console.warn('Supabase points fetch error, using fallback:', e);
      setPoints(initialPartnerPoints);
    }

    // 3. Stocks
    try {
      const dbStocks = await partnerDbService.getStocks();
      if (dbStocks && Object.keys(dbStocks).length > 0) {
        setStocks(dbStocks);
      }
    } catch (e) {
      console.warn('Supabase stocks fetch error:', e);
    }

    // 4. Sales
    try {
      const dbSales = await partnerDbService.getSales();
      if (dbSales) setSales(dbSales);
    } catch (e) {
      console.warn('Supabase sales fetch error:', e);
    }

    // 5. Shipments
    try {
      const dbShipments = await partnerDbService.getShipments();
      if (dbShipments) setShipments(dbShipments);
    } catch (e) {
      console.warn('Supabase shipments fetch error:', e);
    }

    // 6. WriteOffs
    try {
      const dbWriteOffs = await partnerDbService.getWriteOffs();
      if (dbWriteOffs) setWriteOffs(dbWriteOffs);
    } catch (e) {
      console.warn('Supabase writeoffs fetch error:', e);
    }

    // 7. Preorders
    try {
      const dbPreorders = await partnerDbService.getPreorders();
      if (dbPreorders) setPreorders(dbPreorders);
    } catch (e) {
      console.warn('Supabase preorders fetch error:', e);
    }
  };

  // Restore active session from sessionStorage if available
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedAuthStr = sessionStorage.getItem('fitfood_partner_auth');
        if (savedAuthStr) {
          const savedAuth = JSON.parse(savedAuthStr);
          if (savedAuth && savedAuth.pointId && savedAuth.authenticated) {
            const found = points.find(p => p.id === savedAuth.pointId) || initialPartnerPoints.find(p => p.id === savedAuth.pointId);
            if (found) {
              setCurrentPoint(found);
              setCurrentRole(savedAuth.role || 'cashier');
              setIsAuthenticated(true);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error restoring partner auth session:', e);
    }
  }, [points]);

  // Load directly from Supabase on mount & listen to local storage order changes
  useEffect(() => {
    loadAllData();

    // Re-sort products immediately when admin updates dish ordering
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fitfood_admin_dishes_order') {
        setProducts(prev => sortPartnerProducts(prev));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (!isSupabaseConfigured) {
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }

    // Realtime listener for products, sales, stocks, shipments
    try {
      const channel = supabase
        .channel('partner_realtime_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_products' }, async () => {
          const freshProducts = await partnerDbService.getProducts();
          if (freshProducts && freshProducts.length > 0) {
            setProducts(sortPartnerProducts(freshProducts));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_sales' }, async () => {
          const freshSales = await partnerDbService.getSales();
          if (freshSales) setSales(freshSales);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_stocks' }, async () => {
          const freshStocks = await partnerDbService.getStocks();
          if (freshStocks) setStocks(freshStocks);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_shipments' }, async () => {
          const freshShip = await partnerDbService.getShipments();
          if (freshShip) setShipments(freshShip);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_preorders' }, async () => {
          const freshPreorders = await partnerDbService.getPreorders();
          if (freshPreorders) setPreorders(freshPreorders);
        })
        .subscribe();

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase Realtime subscription error:', e);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  const loginWithPin = (
    pointId: string,
    pin: string
  ): { success: boolean; role?: PartnerRole; message?: string } => {
    const point = points.find(p => p.id === pointId) || initialPartnerPoints.find(p => p.id === pointId);
    if (!point) return { success: false, message: 'წერტილი ვერ მოიძებნა' };

    let role: PartnerRole | null = null;

    if (pin === '0000') {
      role = 'admin';
    } else if (pin === point.managerPin) {
      role = 'manager';
    } else if (pin === point.cashierPin) {
      role = 'cashier';
    }

    if (role) {
      setCurrentPoint(point);
      setCurrentRole(role);
      setIsAuthenticated(true);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('fitfood_partner_auth', JSON.stringify({
            pointId: point.id,
            role,
            authenticated: true,
            timestamp: Date.now()
          }));
        }
      } catch {}
      return { success: true, role };
    }

    return {
      success: false,
      message: 'არასწორი PIN კოდი',
    };
  };

  const switchRole = (role: PartnerRole) => {
    setCurrentRole(role);
    try {
      if (typeof window !== 'undefined' && currentPoint) {
        sessionStorage.setItem('fitfood_partner_auth', JSON.stringify({
          pointId: currentPoint.id,
          role,
          authenticated: true,
          timestamp: Date.now()
        }));
      }
    } catch {}
  };

  const selectPoint = (pointId: string) => {
    const p = points.find(item => item.id === pointId);
    if (p) {
      setCurrentPoint(p);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('fitfood_partner_auth', JSON.stringify({
            pointId: p.id,
            role: currentRole,
            authenticated: isAuthenticated,
            timestamp: Date.now()
          }));
        }
      } catch {}
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fitfood_partner_auth');
      }
    } catch {}
  };

  const getPointStock = (pointId: string, productId: string): number => {
    if (stocks[pointId] && stocks[pointId][productId] !== undefined) {
      return stocks[pointId][productId];
    }
    return 20; // Default healthy shelf stock
  };

  // Complete a sale from POS with discounts and split payments
  const completeSale = ({
    pointId,
    items,
    paymentMethod,
    splitDetails,
    discountType = 'none',
    discountComment,
    notes,
  }: CompleteSaleParams): PartnerSale => {
    const saleItems = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name.ka || item.product.name.ru || item.product.name.en,
      quantity: item.quantity,
      pricePerUnit: item.product.price,
      totalPrice: item.product.price * item.quantity,
    }));

    const originalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalUnitsCount = saleItems.reduce((sum, item) => sum + item.quantity, 0);

    let discountAmount = 0;
    if (discountType === 'percent50') {
      // 50% discount on total original amount
      discountAmount = Math.round((originalAmount * 0.5) * 100) / 100;
    } else if (discountType === 'fixed4') {
      // Legacy 4 GEL discount on EACH item in the receipt
      discountAmount = Math.min(originalAmount, 4 * totalUnitsCount);
    } else if (discountType === 'free') {
      discountAmount = originalAmount;
    }

    const totalAmount = Math.max(0, originalAmount - discountAmount);
    const receiptNumber = `CHK-${Math.floor(1000 + Math.random() * 9000)}`;

    const isFree = discountType === 'free' || totalAmount === 0;
    const finalPaymentMethod = isFree ? 'free' : paymentMethod;
    const finalSplitDetails = (finalPaymentMethod === 'split' && !isFree) ? splitDetails : undefined;

    const newSale: PartnerSale = {
      id: `sale-${Date.now()}`,
      pointId,
      receiptNumber,
      items: saleItems,
      originalAmount,
      discountAmount,
      discountType,
      discountComment: discountComment || undefined,
      totalAmount,
      paymentMethod: finalPaymentMethod,
      splitDetails: finalSplitDetails,
      sellerRole: currentRole === 'manager' ? 'manager' : 'cashier',
      createdAt: new Date().toISOString(),
      notes,
      status: 'completed',
    };

    // Deduct stock from shelf
    setStocks(prev => {
      const pointStock = { ...(prev[pointId] || {}) };
      items.forEach(i => {
        const currentQty = pointStock[i.product.id] !== undefined ? pointStock[i.product.id] : getPointStock(pointId, i.product.id);
        const newQty = Math.max(0, currentQty - i.quantity);
        pointStock[i.product.id] = newQty;
        partnerDbService.updateStock(pointId, i.product.id, newQty);
      });
      return { ...prev, [pointId]: pointStock };
    });

    setSales(prev => [newSale, ...prev]);
    partnerDbService.saveSale(newSale);

    // Send Telegram Channel Notification
    try {
      const currentPointObj = points.find(p => p.id === pointId);
      const pointName = currentPointObj ? (currentPointObj.name.ka || currentPointObj.name.ru) : pointId;

      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sale',
          data: {
            pointName,
            receiptNumber: newSale.receiptNumber,
            items: newSale.items,
            originalAmount: newSale.originalAmount,
            discountAmount: newSale.discountAmount,
            discountType: newSale.discountType,
            discountComment: newSale.discountComment,
            totalAmount: newSale.totalAmount,
            paymentMethod: newSale.paymentMethod,
            splitDetails: newSale.splitDetails,
            sellerRole: newSale.sellerRole,
          },
        }),
      }).catch(err => console.warn('Telegram notify error:', err));
    } catch (e) {
      console.warn('Telegram call failed:', e);
    }

    return newSale;
  };

  // Edit payment details, items, discounts or notes of an existing sale
  const editSale = ({
    saleId,
    paymentMethod,
    splitDetails,
    items,
    discountType,
    discountComment,
    totalAmount: customTotalAmount,
    notes,
  }: EditSaleParams): boolean => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) return false;

    // If items are being changed and sale was not refunded, reconcile shelf stock
    if (items && targetSale.status !== 'refunded') {
      const pointId = targetSale.pointId;
      setStocks(prev => {
        const pointStock = { ...(prev[pointId] || {}) };
        // 1. Return old items to shelf
        targetSale.items.forEach(oldIt => {
          const currentQty = pointStock[oldIt.productId] !== undefined ? pointStock[oldIt.productId] : getPointStock(pointId, oldIt.productId);
          pointStock[oldIt.productId] = currentQty + oldIt.quantity;
        });
        // 2. Deduct new items from shelf
        items.forEach(newIt => {
          const currentQty = pointStock[newIt.productId] !== undefined ? pointStock[newIt.productId] : getPointStock(pointId, newIt.productId);
          pointStock[newIt.productId] = Math.max(0, currentQty - newIt.quantity);
        });
        // 3. Sync all affected items to Supabase
        [...targetSale.items, ...items].forEach(it => {
          partnerDbService.updateStock(pointId, it.productId, pointStock[it.productId] || 0);
        });
        return { ...prev, [pointId]: pointStock };
      });
    }

    let updatedSaleObj: PartnerSale | null = null;

    setSales(prev =>
      prev.map(sale => {
        if (sale.id === saleId) {
          const finalItems = items
            ? items.map(it => ({
                productId: it.productId,
                productName: it.productName,
                quantity: it.quantity,
                pricePerUnit: it.pricePerUnit,
                totalPrice: it.pricePerUnit * it.quantity,
              }))
            : sale.items;

          const finalDiscountType = discountType !== undefined ? discountType : sale.discountType;
          const originalAmount = finalItems.reduce((sum, it) => sum + it.totalPrice, 0);
          const totalUnitsCount = finalItems.reduce((sum, it) => sum + it.quantity, 0);

          let discountAmount = 0;
          if (finalDiscountType === 'percent50') {
            discountAmount = Math.round((originalAmount * 0.5) * 100) / 100;
          } else if (finalDiscountType === 'fixed4') {
            discountAmount = Math.min(originalAmount, 4 * totalUnitsCount);
          } else if (finalDiscountType === 'free') {
            discountAmount = originalAmount;
          }

          const calculatedTotal = Math.max(0, originalAmount - discountAmount);
          const totalAmount = customTotalAmount !== undefined ? customTotalAmount : calculatedTotal;
          const isFree = finalDiscountType === 'free' || totalAmount === 0;
          const finalPayMethod = isFree ? 'free' : (paymentMethod || sale.paymentMethod);

          let finalSplit = undefined;
          if (finalPayMethod === 'split' && !isFree) {
            const cash = splitDetails?.cashAmount ?? (sale.splitDetails?.cashAmount || 0);
            const card = Math.max(0, totalAmount - cash);
            finalSplit = { cashAmount: cash, cardAmount: card };
          }

          const updated: PartnerSale = {
            ...sale,
            items: finalItems,
            originalAmount,
            discountAmount,
            discountType: finalDiscountType,
            discountComment: discountComment !== undefined ? discountComment : sale.discountComment,
            totalAmount,
            paymentMethod: finalPayMethod,
            splitDetails: finalSplit,
            notes: notes !== undefined ? notes : sale.notes,
          };

          updatedSaleObj = updated;
          return updated;
        }
        return sale;
      })
    );

    if (updatedSaleObj) {
      partnerDbService.saveSale(updatedSaleObj);
    }

    return true;
  };

  // Delete an operation completely
  const deleteSale = (saleId: string, returnStockToShelf: boolean = true): boolean => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) return false;

    if (returnStockToShelf && targetSale.status !== 'refunded') {
      const pointId = targetSale.pointId;
      setStocks(prev => {
        const pointStock = { ...(prev[pointId] || {}) };
        targetSale.items.forEach(it => {
          const currentQty = pointStock[it.productId] !== undefined ? pointStock[it.productId] : getPointStock(pointId, it.productId);
          const newQty = currentQty + it.quantity;
          pointStock[it.productId] = newQty;
          partnerDbService.updateStock(pointId, it.productId, newQty);
        });
        return { ...prev, [pointId]: pointStock };
      });
    }

    setSales(prev => prev.filter(s => s.id !== saleId));
    partnerDbService.deleteSale(saleId);
    return true;
  };

  // Refund / Return a sale (re-credits items to stock!)
  const refundSale = (saleId: string, reason?: string): boolean => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale || targetSale.status === 'refunded') return false;

    const pointId = targetSale.pointId;

    // Restore stock back to the shelf
    setStocks(prev => {
      const pointStock = { ...(prev[pointId] || {}) };
      targetSale.items.forEach(item => {
        const currentQty = pointStock[item.productId] !== undefined ? pointStock[item.productId] : getPointStock(pointId, item.productId);
        const newQty = currentQty + item.quantity;
        pointStock[item.productId] = newQty;
        partnerDbService.updateStock(pointId, item.productId, newQty);
      });
      return { ...prev, [pointId]: pointStock };
    });

    const refundedSaleObj: PartnerSale = {
      ...targetSale,
      status: 'refunded',
      refundReason: reason || 'Возврат / ошибочный чек',
      refundedAt: new Date().toISOString(),
    };

    setSales(prev =>
      prev.map(sale => (sale.id === saleId ? refundedSaleObj : sale))
    );

    partnerDbService.saveSale(refundedSaleObj);
    return true;
  };

  // Record write-off / damaged item
  const createWriteOff = (
    pointId: string,
    productId: string,
    quantity: number,
    reason: 'expired' | 'damaged' | 'sample' | 'other',
    note?: string
  ): boolean => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return false;

    const reasonMap: Record<string, string> = {
      expired: 'ვადაგასული (72სთ)',
      damaged: 'შეფუთვის დაზიანება / ბრაკი',
      sample: 'დეგუსტაცია / მარკეტინგი',
      other: 'სხვა',
    };

    const newWriteOff: PartnerWriteOff = {
      id: `wro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pointId,
      productId,
      productName: prod.name.ka || prod.name.ru,
      quantity,
      reason,
      reasonText: reasonMap[reason] || 'ჩამოწერა',
      createdAt: new Date().toISOString(),
      notes: note,
      costPrice: prod.costPrice,
      retailPrice: prod.price,
    };

    setStocks(prev => {
      const pointStock = { ...(prev[pointId] || {}) };
      const currentQty = pointStock[productId] !== undefined ? pointStock[productId] : getPointStock(pointId, productId);
      const newQty = Math.max(0, currentQty - quantity);
      pointStock[productId] = newQty;
      partnerDbService.updateStock(pointId, productId, newQty);
      return { ...prev, [pointId]: pointStock };
    });

    setWriteOffs(prev => [newWriteOff, ...prev]);
    partnerDbService.saveWriteOff(newWriteOff);
    return true;
  };

  // Send one aggregated Telegram notification for a batch of write-offs created via createWriteOff
  // (createWriteOff itself only handles a single product, so the UI calls this once per checkout).
  const notifyWriteOffBatch = (
    pointId: string,
    items: { productName: string; quantity: number; totalValue?: number }[],
    reasonText: string,
    note?: string
  ) => {
    try {
      const currentPointObj = points.find(p => p.id === pointId);
      const pointName = currentPointObj ? (currentPointObj.name.ka || currentPointObj.name.ru) : pointId;
      const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
      const totalValue = items.reduce((s, i) => s + (i.totalValue || 0), 0);

      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'writeoff',
          data: {
            pointName,
            items,
            totalUnits,
            totalValue: totalValue > 0 ? totalValue : undefined,
            reasonText,
            note,
            sellerRole: currentRole === 'manager' ? 'manager' : 'cashier',
          },
        }),
      }).catch(err => console.warn('Telegram notify error:', err));
    } catch (e) {
      console.warn('Telegram call failed:', e);
    }
  };

  // Create a preorder: customer reserves dishes & pays 50% upfront. Stock is NOT touched yet —
  // it is only deducted once the preorder is fulfilled (picked up) via fulfillPreorder().
  const createPreorder = ({
    pointId,
    items,
    comment,
    pickupDate,
    paymentMethod,
  }: CreatePreorderParams): PartnerPreorder => {
    const preorderItems = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name.ka || item.product.name.ru || item.product.name.en,
      quantity: item.quantity,
      pricePerUnit: item.product.price,
      totalPrice: item.product.price * item.quantity,
    }));

    const originalAmount = preorderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = Math.round((originalAmount * 0.5) * 100) / 100;
    const totalAmount = Math.max(0, originalAmount - discountAmount);
    const preorderId = `preorder-${Date.now()}`;
    const preorderNumber = `PRE-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const sellerRole: 'cashier' | 'manager' = currentRole === 'manager' ? 'manager' : 'cashier';

    // The advance payment was collected right now, in cash/card, at the register —
    // so it's recorded as a completed sale immediately and counts toward THIS shift's
    // revenue totals (Z-report), without touching stock (that happens on fulfillment).
    const linkedSaleId = `sale-preorder-${preorderId}`;
    const linkedSale: PartnerSale = {
      id: linkedSaleId,
      pointId,
      receiptNumber: preorderNumber,
      items: preorderItems,
      originalAmount,
      discountAmount,
      discountType: 'percent50',
      discountComment: `📝 წინასწარი შეკვეთის ავანსი • ${comment.trim()}`,
      totalAmount,
      paymentMethod,
      sellerRole,
      createdAt: nowIso,
      notes: `PREORDER_ADVANCE:${preorderId}`,
      status: 'completed',
    };

    const newPreorder: PartnerPreorder = {
      id: preorderId,
      pointId,
      preorderNumber,
      items: preorderItems,
      originalAmount,
      discountAmount,
      totalAmount,
      comment: comment.trim(),
      pickupDate: pickupDate && pickupDate >= getTbilisiDateStr(1) ? pickupDate : getTbilisiDateStr(1),
      paymentMethod,
      sellerRole,
      status: 'pending',
      linkedSaleId,
      createdAt: nowIso,
    };

    setSales(prev => [linkedSale, ...prev]);
    partnerDbService.saveSale(linkedSale);

    setPreorders(prev => [newPreorder, ...prev]);
    partnerDbService.savePreorder(newPreorder);

    // Send Telegram Channel Notification
    try {
      const currentPointObj = points.find(p => p.id === pointId);
      const pointName = currentPointObj ? (currentPointObj.name.ka || currentPointObj.name.ru) : pointId;

      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'preorder',
          data: {
            pointName,
            preorderNumber: newPreorder.preorderNumber,
            items: newPreorder.items,
            originalAmount: newPreorder.originalAmount,
            discountAmount: newPreorder.discountAmount,
            totalAmount: newPreorder.totalAmount,
            comment: newPreorder.comment,
            pickupDate: newPreorder.pickupDate,
            paymentMethod: newPreorder.paymentMethod,
            sellerRole: newPreorder.sellerRole,
          },
        }),
      }).catch(err => console.warn('Telegram notify error:', err));
    } catch (e) {
      console.warn('Telegram call failed:', e);
    }

    return newPreorder;
  };

  // Mark a preorder as fulfilled (customer picked it up) — deducts items from shelf stock now.
  const fulfillPreorder = (preorderId: string): boolean => {
    const target = preorders.find(p => p.id === preorderId);
    if (!target || target.status !== 'pending') return false;

    const pointId = target.pointId;
    setStocks(prev => {
      const pointStock = { ...(prev[pointId] || {}) };
      target.items.forEach(it => {
        const currentQty = pointStock[it.productId] !== undefined ? pointStock[it.productId] : getPointStock(pointId, it.productId);
        const newQty = Math.max(0, currentQty - it.quantity);
        pointStock[it.productId] = newQty;
        partnerDbService.updateStock(pointId, it.productId, newQty);
      });
      return { ...prev, [pointId]: pointStock };
    });

    const updated: PartnerPreorder = {
      ...target,
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString(),
    };

    setPreorders(prev => prev.map(p => (p.id === preorderId ? updated : p)));
    partnerDbService.savePreorder(updated);
    return true;
  };

  // Cancel a pending preorder (e.g. customer never showed up) — no stock was deducted, nothing to return.
  // The advance payment is refunded (marked refunded on its linked sale, no stock change) so it
  // stops counting toward revenue, matching the fact that the order was never fulfilled.
  const cancelPreorder = (preorderId: string, reason?: string): boolean => {
    const target = preorders.find(p => p.id === preorderId);
    if (!target || target.status !== 'pending') return false;

    if (target.linkedSaleId) {
      const refundedAt = new Date().toISOString();
      setSales(prev =>
        prev.map(s =>
          s.id === target.linkedSaleId
            ? { ...s, status: 'refunded', refundReason: reason || 'წინასწარი შეკვეთის გაუქმება', refundedAt }
            : s
        )
      );
      const linkedSale = sales.find(s => s.id === target.linkedSaleId);
      if (linkedSale) {
        partnerDbService.saveSale({ ...linkedSale, status: 'refunded', refundReason: reason || 'წინასწარი შეკვეთის გაუქმება', refundedAt });
      }
    }

    const updated: PartnerPreorder = {
      ...target,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      comment: reason ? `${target.comment} • გაუქმდა: ${reason}` : target.comment,
    };

    setPreorders(prev => prev.map(p => (p.id === preorderId ? updated : p)));
    partnerDbService.savePreorder(updated);
    return true;
  };

  // Hard-delete a preorder record together with its linked advance-payment sale.
  const deletePreorder = (preorderId: string): boolean => {
    const target = preorders.find(p => p.id === preorderId);

    if (target?.linkedSaleId) {
      setSales(prev => prev.filter(s => s.id !== target.linkedSaleId));
      partnerDbService.deleteSale(target.linkedSaleId);
    }

    setPreorders(prev => prev.filter(p => p.id !== preorderId));
    partnerDbService.deletePreorder(preorderId);
    return true;
  };

  // Edit a pending preorder (items, comment, pickup date, payment method) and keep its
  // linked advance-payment sale in sync so the shift's revenue totals stay accurate.
  const editPreorder = ({
    preorderId,
    items,
    comment,
    pickupDate,
    paymentMethod,
  }: EditPreorderParams): boolean => {
    const target = preorders.find(p => p.id === preorderId);
    if (!target || target.status !== 'pending') return false;

    const newItems = items
      ? items.map(item => ({
          productId: item.product.id,
          productName: item.product.name.ka || item.product.name.ru || item.product.name.en,
          quantity: item.quantity,
          pricePerUnit: item.product.price,
          totalPrice: item.product.price * item.quantity,
        }))
      : target.items;

    const originalAmount = newItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const discountAmount = Math.round((originalAmount * 0.5) * 100) / 100;
    const totalAmount = Math.max(0, originalAmount - discountAmount);
    const finalComment = comment !== undefined ? comment.trim() : target.comment;
    const finalPickupDate = pickupDate && pickupDate >= getTbilisiDateStr(1) ? pickupDate : target.pickupDate;
    const finalPaymentMethod = paymentMethod || target.paymentMethod;

    const updated: PartnerPreorder = {
      ...target,
      items: newItems,
      originalAmount,
      discountAmount,
      totalAmount,
      comment: finalComment,
      pickupDate: finalPickupDate,
      paymentMethod: finalPaymentMethod,
    };

    setPreorders(prev => prev.map(p => (p.id === preorderId ? updated : p)));
    partnerDbService.savePreorder(updated);

    if (target.linkedSaleId) {
      const linkedSale = sales.find(s => s.id === target.linkedSaleId);
      if (linkedSale) {
        const updatedSale: PartnerSale = {
          ...linkedSale,
          items: newItems,
          originalAmount,
          discountAmount,
          totalAmount,
          discountComment: `📝 წინასწარი შეკვეთის ავანსი • ${finalComment}`,
          paymentMethod: finalPaymentMethod,
        };
        setSales(prev => prev.map(s => (s.id === target.linkedSaleId ? updatedSale : s)));
        partnerDbService.saveSale(updatedSale);
      }
    }

    return true;
  };

  const getPointPreorders = (pointId: string): PartnerPreorder[] => {
    return preorders.filter(p => p.pointId === pointId);
  };

  const getTomorrowDateStr = (): string => getTbilisiDateStr(1);

  // HQ Admin or Point Manager receives food to a point: AUTOMATICALLY CREDITS STOCK IMMEDIATELY!
  const createShipment = (
    pointId: string,
    items: { productId: string; quantity: number }[],
    note?: string
  ): PartnerShipment => {
    const shipmentItems = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name.ka || prod?.name.ru || 'Рацион FitFood',
        quantity: item.quantity,
      };
    });

    const totalUnits = shipmentItems.reduce((s, i) => s + i.quantity, 0);
    const nowIso = new Date().toISOString();

    const newShipment: PartnerShipment = {
      id: `ship-${Date.now()}`,
      shipmentNumber: `FF-SH-${Math.floor(100 + Math.random() * 900)}`,
      pointId,
      items: shipmentItems,
      status: 'received',
      createdAt: nowIso,
      receivedAt: nowIso,
      note: note || 'Начислено со склада FitFood',
      totalUnits,
    };

    // Automatically increase stock on the point immediately
    setStocks(prev => {
      const pointStock = { ...(prev[pointId] || {}) };
      items.forEach(item => {
        const currentQty = pointStock[item.productId] !== undefined ? pointStock[item.productId] : getPointStock(pointId, item.productId);
        const newQty = currentQty + item.quantity;
        pointStock[item.productId] = newQty;
        partnerDbService.updateStock(pointId, item.productId, newQty);
      });
      return { ...prev, [pointId]: pointStock };
    });

    setShipments(prev => [newShipment, ...prev]);
    partnerDbService.saveShipment(newShipment);

    // Send Telegram Channel Notification
    try {
      const currentPointObj = points.find(p => p.id === pointId);
      const pointName = currentPointObj ? (currentPointObj.name.ka || currentPointObj.name.ru) : pointId;

      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shipment',
          data: {
            pointName,
            shipmentNumber: newShipment.shipmentNumber,
            items: newShipment.items,
            totalUnits: newShipment.totalUnits,
            note: newShipment.note,
            sellerRole: currentRole === 'manager' ? 'manager' : 'cashier',
          },
        }),
      }).catch(err => console.warn('Telegram notify error:', err));
    } catch (e) {
      console.warn('Telegram call failed:', e);
    }

    return newShipment;
  };

  // Quick Restock Action for the Point
  const quickRestockPoint = (pointId: string, unitsPerDish: number = 20): PartnerShipment => {
    const shipmentItems = products.map(p => ({
      productId: p.id,
      quantity: unitsPerDish,
    }));
    return createShipment(pointId, shipmentItems, `სწრაფი შევსება (+${unitsPerDish} ც. თითოეულზე)`);
  };

  const addNewPoint = (pointData: Omit<PartnerPoint, 'id'>): PartnerPoint => {
    const newId = `point-${Date.now()}`;
    const newPoint: PartnerPoint = {
      ...pointData,
      id: newId,
    };
    setPoints(prev => [...prev, newPoint]);
    setStocks(prev => ({ ...prev, [newId]: {} }));
    partnerDbService.savePoint(newPoint);
    return newPoint;
  };

  const getPointTodaySales = (pointId: string): PartnerSale[] => {
    const today = new Date().toDateString();
    return sales.filter(s => s.pointId === pointId && new Date(s.createdAt).toDateString() === today);
  };

  const getPointSalesByPeriod = (pointId: string, days?: number): PartnerSale[] => {
    if (!days) return sales.filter(s => s.pointId === pointId);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime();
    return sales.filter(s => s.pointId === pointId && new Date(s.createdAt).getTime() >= cutoff);
  };

  const resetToDefaults = () => {
    setPoints(initialPartnerPoints);
    setStocks(initialStocks);
    setShipments(initialShipments);
    setSales(initialSales);
    setWriteOffs(initialWriteOffs);
    setPreorders([]);
    setCurrentPoint(initialPartnerPoints[0]);
    setCurrentRole('manager');
    setIsAuthenticated(true);
  };

  return (
    <PartnerContext.Provider
      value={{
        currentPoint,
        currentRole,
        isAuthenticated,
        points,
        products,
        stocks,
        shipments,
        sales,
        writeOffs,
        preorders,
        loginWithPin,
        switchRole,
        selectPoint,
        logout,
        completeSale,
        editSale,
        deleteSale,
        refundSale,
        createWriteOff,
        notifyWriteOffBatch,
        createPreorder,
        editPreorder,
        fulfillPreorder,
        cancelPreorder,
        deletePreorder,
        getPointPreorders,
        getTomorrowDateStr,
        createShipment,
        quickRestockPoint,
        addNewPoint,
        getPointStock,
        getPointTodaySales,
        getPointSalesByPeriod,
        resetToDefaults,
        refreshData: loadAllData,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};
