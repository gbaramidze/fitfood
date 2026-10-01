import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  PartnerPoint,
  PartnerProduct,
  PartnerSale,
  PartnerShipment,
  PartnerWriteOff,
} from '@/types/partner';

import { mapSupabaseProductToAdminDish } from '@/lib/adminDishMapper';

export const partnerDbService = {
  // 1. Fetch Points
  async getPoints(): Promise<PartnerPoint[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('partner_points').select('*').order('created_at', { ascending: true });
      if (error || !data) return null;
      return data.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        address: p.address,
        cashierPin: p.cashier_pin,
        managerPin: p.manager_pin,
        commissionPercent: p.commission_percent || 0,
        phone: p.phone,
        status: p.status,
      }));
    } catch {
      return null;
    }
  },

  // 2. Fetch Products
  async getProducts(): Promise<PartnerProduct[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('partner_products').select('*');
      if (error || !data) return null;
      return data.map(prod => {
        const dish = mapSupabaseProductToAdminDish(prod);
        return {
          id: dish.id,
          name: dish.name,
          category: dish.category,
          categoryName: { ka: dish.category, ru: dish.category, en: dish.category },
          price: dish.retailPrice,
          costPrice: dish.costPrice,
          calories: dish.macros.calories,
          weightGrams: dish.macros.weightGrams,
          image: dish.image || '/images/meals/chicken-ptitim.webp',
          badge: { ka: dish.day || 'FitFood', ru: dish.day || 'FitFood', en: dish.day || 'FitFood' },
        };
      });
    } catch (e) {
      console.warn('Error fetching products from Supabase:', e);
      return null;
    }
  },

  // 3. Fetch Stocks (Record<pointId, Record<productId, number>>)
  async getStocks(): Promise<Record<string, Record<string, number>> | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('partner_stocks').select('*');
      if (error || !data) return null;
      const stocksMap: Record<string, Record<string, number>> = {};
      data.forEach(row => {
        if (!stocksMap[row.point_id]) stocksMap[row.point_id] = {};
        stocksMap[row.point_id][row.product_id] = row.quantity;
      });
      return stocksMap;
    } catch {
      return null;
    }
  },

  // 4. Fetch Sales
  async getSales(): Promise<PartnerSale[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('partner_sales').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map(s => ({
        id: s.id,
        pointId: s.point_id,
        receiptNumber: s.receipt_number,
        items: s.items,
        originalAmount: Number(s.original_amount),
        discountAmount: Number(s.discount_amount || 0),
        discountType: s.discount_type,
        discountComment: s.discount_comment,
        totalAmount: Number(s.total_amount),
        paymentMethod: s.payment_method,
        splitDetails: s.split_details,
        sellerRole: s.seller_role,
        notes: s.notes,
        status: s.status,
        refundReason: s.refund_reason,
        refundedAt: s.refunded_at,
        createdAt: s.created_at,
      }));
    } catch {
      return null;
    }
  },

  // 5. Fetch Shipments
  async getShipments(): Promise<PartnerShipment[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('partner_shipments').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map(ship => ({
        id: ship.id,
        shipmentNumber: ship.shipment_number,
        pointId: ship.point_id,
        items: ship.items,
        status: ship.status,
        createdAt: ship.created_at,
        receivedAt: ship.received_at,
        note: ship.note,
        totalUnits: ship.total_units,
      }));
    } catch {
      return null;
    }
  },

  // 6. Fetch Write-offs
  async getWriteOffs(): Promise<PartnerWriteOff[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('partner_write_offs').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map(w => ({
        id: w.id,
        pointId: w.point_id,
        productId: w.product_id,
        productName: w.product_name,
        quantity: w.quantity,
        reason: w.reason,
        reasonText: w.reason_text,
        notes: w.notes,
        createdAt: w.created_at,
      }));
    } catch {
      return null;
    }
  },

  // Sync / Mutate Operations
  async saveSale(sale: PartnerSale) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('partner_sales').upsert({
        id: sale.id,
        point_id: sale.pointId,
        receipt_number: sale.receiptNumber,
        items: sale.items,
        original_amount: sale.originalAmount,
        discount_amount: sale.discountAmount,
        discount_type: sale.discountType,
        discount_comment: sale.discountComment,
        total_amount: sale.totalAmount,
        payment_method: sale.paymentMethod,
        split_details: sale.splitDetails,
        seller_role: sale.sellerRole,
        notes: sale.notes,
        status: sale.status,
        refund_reason: sale.refundReason,
        refunded_at: sale.refundedAt,
        created_at: sale.createdAt,
      });
    } catch (e) {
      console.warn('Error saving sale to Supabase:', e);
    }
  },

  async deleteSale(saleId: string) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('partner_sales').delete().eq('id', saleId);
    } catch (e) {
      console.warn('Error deleting sale in Supabase:', e);
    }
  },

  async updateStock(pointId: string, productId: string, quantity: number) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('partner_stocks').upsert({
        point_id: pointId,
        product_id: productId,
        quantity: Math.max(0, quantity),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error updating stock in Supabase:', e);
    }
  },

  async saveShipment(shipment: PartnerShipment) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('partner_shipments').upsert({
        id: shipment.id,
        shipment_number: shipment.shipmentNumber,
        point_id: shipment.pointId,
        items: shipment.items,
        total_units: shipment.totalUnits,
        status: shipment.status,
        note: shipment.note,
        received_at: shipment.receivedAt,
        created_at: shipment.createdAt,
      });
    } catch (e) {
      console.warn('Error saving shipment to Supabase:', e);
    }
  },

  async saveWriteOff(writeOff: PartnerWriteOff) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('partner_write_offs').upsert({
        id: writeOff.id,
        point_id: writeOff.pointId,
        product_id: writeOff.productId,
        product_name: writeOff.productName,
        quantity: writeOff.quantity,
        reason: writeOff.reason,
        reason_text: writeOff.reasonText,
        notes: writeOff.notes,
        created_at: writeOff.createdAt,
      });
    } catch (e) {
      console.warn('Error saving write-off to Supabase:', e);
    }
  },

  async savePoint(point: PartnerPoint) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('partner_points').upsert({
        id: point.id,
        name: point.name,
        city: point.city,
        address: point.address,
        cashier_pin: point.cashierPin,
        manager_pin: point.managerPin,
        commission_percent: point.commissionPercent || 0,
        phone: point.phone,
        status: point.status,
      });
    } catch (e) {
      console.warn('Error saving point to Supabase:', e);
    }
  },
};
