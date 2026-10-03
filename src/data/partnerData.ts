import { PartnerPoint, PartnerProduct, PartnerSale, PartnerShipment, PartnerWriteOff } from '@/types/partner';

export const initialPartnerPoints: PartnerPoint[] = [
  {
    id: 'point-mega-gym',
    name: {
      ru: 'Mega Gym',
      ka: 'Mega Gym',
      en: 'Mega Gym',
    },
    city: 'Batumi',
    address: {
      ru: 'ул. Качинских 5Б',
      ka: 'კაჩინსკების 5ბ',
      en: '5B Kachinski St',
    },
    cashierPin: '1111',
    managerPin: '7777',
    commissionPercent: 0,
    phone: '+995 555 11 22 33',
    status: 'active',
  },
  {
    id: 'point-xxl',
    name: {
      ru: 'XXL',
      ka: 'XXL',
      en: 'XXL',
    },
    city: 'Batumi',
    address: {
      ru: 'ул. Качинских 1',
      ka: 'კაცინსკების 1',
      en: '1 Kachinski St',
    },
    cashierPin: '2222',
    managerPin: '8888',
    commissionPercent: 0,
    phone: '+995 555 22 33 44',
    status: 'active',
  },
  {
    id: 'point-fitness-academy',
    name: {
      ru: 'Fitness Academy',
      ka: 'Fitness Academy',
      en: 'Fitness Academy',
    },
    city: 'Batumi',
    address: {
      ru: 'ул. Пиросмани 18',
      ka: 'ფიროსმანის 18',
      en: '18 Pirosmani St',
    },
    cashierPin: '3333',
    managerPin: '9999',
    commissionPercent: 0,
    phone: '+995 555 33 44 55',
    status: 'active',
  },
];

// NO MOCK PRODUCTS: Loaded 100% dynamically from Supabase database table `partner_products`
export const partnerProducts: PartnerProduct[] = [];

// Initial Stock levels per point (clean / zeroed)
export const initialStocks: Record<string, Record<string, number>> = {
  'point-mega-gym': {},
  'point-xxl': {},
  'point-fitness-academy': {},
};

// Clean Shipments (No mock data)
export const initialShipments: PartnerShipment[] = [];

// Clean Sales History (No mock data)
export const initialSales: PartnerSale[] = [];

// Clean Write-Offs (No mock data)
export const initialWriteOffs: PartnerWriteOff[] = [];


