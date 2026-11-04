export type RiderDeliveryStatus =
  'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export type RiderFailReason =
  | 'CUSTOMER_NOT_REACHABLE'
  | 'CUSTOMER_REFUSED'
  | 'WRONG_ADDRESS'
  | 'NOBODY_HOME'
  | 'PAYMENT_PROBLEM'
  | 'OTHER';

export interface RiderDeliveryItem {
  id: string;
  productName: string;
  productNameBn?: string;
  quantity: number;
  unitPrice: number;
}

export interface RiderDeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  };
  items: RiderDeliveryItem[];
  customerNote?: string;
}

export interface RiderDelivery {
  id: string;
  orderId: string;
  assigneeId?: string;
  status: RiderDeliveryStatus;
  cashCollected?: number;
  cashToCollect?: number;
  handedOverAt?: string;
  failReason?: RiderFailReason;
  note?: string;
  createdAt: string;
  updatedAt: string;
  order: RiderDeliveryOrder;
}

export interface RiderSummary {
  activeCount: number;
  deliveredToday: number;
  failedToday: number;
  cashInHand: number;
  cashCollectedToday: number;
}

export interface RiderSettlement {
  id: string;
  riderId: string;
  date: string;
  deliveriesCount: number;
  totalCodCollected: number;
  amountSettled: number;
  status: 'PENDING' | 'SETTLED';
  settledAt?: string;
  notes?: string;
}
