export type PartnerRole = 'cashier' | 'manager' | 'admin';

export interface PartnerPoint {
  id: string;
  name: {
    ru: string;
    ka: string;
    en: string;
  };
  city: string;
  address: {
    ru: string;
    ka: string;
    en: string;
  };
  cashierPin: string;
  managerPin: string;
  commissionPercent: number; // e.g. 20%
  phone: string;
  status: 'active' | 'inactive';
}

export interface PartnerProduct {
  id: string;
  name: {
    ru: string;
    ka: string;
    en: string;
  };
  category: 'poultry' | 'fish' | 'meat' | 'breakfast' | 'drinks' | 'dessert' | 'soup' | 'salad' | string;
  categoryName: {
    ru: string;
    ka: string;
    en: string;
  };
  price: number; // Retail price in GEL (₾)
  costPrice: number; // Wholesale/production price
  calories: number;
  weightGrams: number;
  image: string;
  badge?: {
    ru: string;
    ka: string;
    en: string;
  };
}

export interface PartnerStockItem {
  productId: string;
  quantity: number;
}

export interface PartnerSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface PartnerSale {
  id: string;
  pointId: string;
  receiptNumber: string;
  items: PartnerSaleItem[];
  originalAmount: number; // before discount
  discountAmount: number; // e.g. 4 GEL or full price
  discountType: 'none' | 'fixed4' | 'free';
  discountComment?: string;
  totalAmount: number;
  paymentMethod: 'card' | 'cash' | 'split' | 'free';
  splitDetails?: {
    cashAmount: number;
    cardAmount: number;
  };
  sellerRole: 'cashier' | 'manager';
  createdAt: string; // ISO string
  notes?: string;
  status: 'completed' | 'refunded';
  refundReason?: string;
  refundedAt?: string;
}

export interface PartnerShipmentItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface PartnerShipment {
  id: string;
  shipmentNumber: string;
  pointId: string;
  items: PartnerShipmentItem[];
  status: 'received' | 'pending' | 'cancelled';
  createdAt: string;
  receivedAt?: string;
  note?: string;
  totalUnits: number;
}

export interface PartnerWriteOff {
  id: string;
  pointId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'sample' | 'other';
  reasonText: string;
  createdAt: string;
  notes?: string;
}
