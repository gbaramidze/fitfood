// Types for the kitchen tablet workstation (/kitchen)

export type KitchenDeliverySlot = 'morning' | 'comfort' | 'evening';
export type KitchenClientStatus = 'active' | 'paused' | 'completed';

/** A client's ration subscription card, as shown to the kitchen / couriers. */
export interface KitchenClient {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  zone: string;
  programId: string;
  programTitle: string;
  calories: number;
  totalDays: number;
  deliveredDays: number;
  deliverySlot: KitchenDeliverySlot;
  startDate: string; // YYYY-MM-DD
  status: KitchenClientStatus;
  notes?: string; // allergies / stop-list / courier comments
  createdAt: string;
}

/**
 * One tick on the kitchen board. `ref` identifies what was ticked:
 *   cook:<productKey>              hall dish cooked
 *   send:<pointId>:<productKey>    hall dish sent to that hall
 *   rcook:<dishId>                 ration dish cooked
 *   rsent:<clientId>               ration box sent to the client
 */
export interface KitchenCheck {
  planDate: string; // YYYY-MM-DD the tick belongs to
  ref: string;
  done: boolean;
  qty?: number; // quantity the plan asked for when it was ticked
  doneAt: string; // ISO
}

export const checkId = (planDate: string, ref: string) => `${planDate}|${ref}`;
