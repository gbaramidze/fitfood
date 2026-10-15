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
    cashierPin: '1313',
    managerPin: '7777',
    commissionPercent: 0,
    phone: '+995 555 11 22 33',
    status: 'active',
    logo: '/images/points/mega.jpg',
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
    cashierPin: '2424',
    managerPin: '9999',
    commissionPercent: 0,
    phone: '+995 555 33 44 55',
    status: 'active',
    logo: '/images/points/fitness-academy.png',
  },
];

export function getPointLogo(point?: PartnerPoint | null | { id?: string; name?: any; logo?: string }): string {
  if (!point) return '/images/logo-white.png';
  if (point.logo) return point.logo;
  const id = (point.id || '').toLowerCase();
  const nameStr = (typeof point.name === 'object' ? `${point.name?.ka || ''} ${point.name?.ru || ''} ${point.name?.en || ''}` : String(point.name || '')).toLowerCase();
  if (id.includes('mega') || nameStr.includes('mega')) return '/images/points/mega.jpg';
  if (id.includes('fitness') || id.includes('academy') || nameStr.includes('academy') || nameStr.includes('fitness')) return '/images/points/fitness-academy.png';
  return '/images/logo-white.png';
}

// NO MOCK PRODUCTS: Loaded 100% dynamically from Supabase database table `partner_products`
export const partnerProducts: PartnerProduct[] = [];

// Initial Stock levels per point (clean / zeroed)
export const initialStocks: Record<string, Record<string, number>> = {
  'point-mega-gym': {},
  'point-fitness-academy': {},
};

// Clean Shipments (No mock data)
export const initialShipments: PartnerShipment[] = [];

// Clean Sales History (No mock data)
export const initialSales: PartnerSale[] = [];

// Clean Write-Offs (No mock data)
export const initialWriteOffs: PartnerWriteOff[] = [];


