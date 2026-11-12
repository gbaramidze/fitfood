import { BatumiZone } from '@/types';

/**
 * The delivery zone of a map point (approximate, by position along the coast).
 * `null` = outside the area we deliver to.
 */
export function zoneForPoint(lat: number, lng: number): BatumiZone | null {
  if (!(lat >= 41.48 && lat <= 41.75 && lng >= 41.48 && lng <= 41.8)) return null;
  const id = lat < 41.605 ? 'zone-gonio' : lat > 41.672 ? 'zone-makhinjauri' : lat > 41.652 ? 'zone-boulevard-new' : 'zone-center';
  return batumiZones.find(z => z.id === id) ?? null;
}

export const batumiZones: BatumiZone[] = [
  {
    id: 'zone-center',
    name: {
      ka: 'ძველი ბათუმი და ცენტრი (რუსთაველი / ერას მოედანი)',
      ru: 'Старый Батуми и Центр (ул. Руставели, пл. Европы)',
      en: 'Old Batumi & Center (Rustaveli Ave, Europe Sq)',
    },
    priceGEL: 0,
    deliveryTimeNotice: {
      ka: 'უფასო მიტანა • 15 წთ',
      ru: 'Бесплатная доставка • 15 мин',
      en: 'Free Delivery • 15 min',
    },
    popularHotels: ['Radisson Blu Batumi', 'Sheraton Batumi', 'Hilton Batumi', 'Leogrand'],
  },
  {
    id: 'zone-boulevard-new',
    name: {
      ka: 'ახალი ბათუმი და გმირთა ხეივანი (Orbi / Alliance)',
      ru: 'Новый Батуми и Аллея Героев (Orbi City, Alliance)',
      en: 'New Batumi & Heroes Alley (Orbi City, Alliance)',
    },
    priceGEL: 0,
    deliveryTimeNotice: {
      ka: 'უფასო მიტანა • 20 წთ',
      ru: 'Бесплатная доставка • 20 мин',
      en: 'Free Delivery • 20 min',
    },
    popularHotels: ['Orbi City', 'Orbi Sea Towers', 'Courtyard by Marriott', 'Alliance Palace'],
  },
  {
    id: 'zone-makhinjauri',
    name: {
      ka: 'მახინჯაური / ბოტანიკური ბაღი',
      ru: 'Махинджаури / Ботанический Сад',
      en: 'Makhinjauri / Botanical Garden Area',
    },
    priceGEL: 5,
    deliveryTimeNotice: {
      ka: 'მიტანა 5 ₾ • 30 წთ',
      ru: 'Доставка 5 ₾ • 30 мин',
      en: 'Delivery 5 ₾ • 30 min',
    },
    popularHotels: ['Castello Mare (nearby)', 'Makhinjauri Private Villas'],
  },
  {
    id: 'zone-gonio',
    name: {
      ka: 'გონიო / კვარიათი / სარფი',
      ru: 'Гонио / Квариати / Сарпи',
      en: 'Gonio / Kvariati / Sarpi',
    },
    priceGEL: 7,
    deliveryTimeNotice: {
      ka: 'მიტანა 7 ₾ • 35 წთ',
      ru: 'Доставка 7 ₾ • 35 мин',
      en: 'Delivery 7 ₾ • 35 min',
    },
    popularHotels: ['Gonio Seaside Resorts', 'Kvariati Hills Apartments'],
  },
];
