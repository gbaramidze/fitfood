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
  logo?: string;
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
  sortOrder?: number;
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
  discountAmount: number; // e.g. 50% or full price
  discountType: 'none' | 'percent50' | 'free' | 'fixed4';
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

export interface PartnerPreorderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface PartnerPreorder {
  id: string;
  pointId: string;
  preorderNumber: string;
  items: PartnerPreorderItem[];
  originalAmount: number; // full price before discount
  discountAmount: number; // -50%
  totalAmount: number; // paid in advance (50% of original)
  comment: string; // who is taking the preorder
  pickupDate: string; // YYYY-MM-DD, date the customer will pick up the order (defaults to tomorrow)
  paymentMethod: 'card' | 'cash';
  sellerRole: 'cashier' | 'manager';
  status: 'pending' | 'fulfilled' | 'cancelled';
  linkedSaleId?: string; // the advance-payment sale record created immediately, counted in the shift's revenue
  createdAt: string; // ISO string
  fulfilledAt?: string;
  cancelledAt?: string;
}

export interface PartnerWriteOff {
  id: string;
  pointId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'sample' | 'kitchen_waste' | 'other' | string;
  reasonText: string;
  createdAt: string;
  notes?: string;
  costPrice?: number;
  retailPrice?: number;
}
