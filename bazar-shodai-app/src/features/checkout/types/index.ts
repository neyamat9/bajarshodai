export type PaymentMethod = 'CASH_ON_DELIVERY' | 'BKASH' | 'NAGAD' | 'ROCKET';

export interface CustomerAddress {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  upazila?: string;
  postalCode?: string;
  isDefault?: boolean;
  label?: 'HOME' | 'OFFICE' | 'OTHER' | string;
}

export interface DeliverySlotOption {
  id: string;
  label: string;
  labelBn: string;
  timeWindow: string;
  isExpress?: boolean;
}

export interface PlaceOrderPayload {
  language?: 'bn' | 'en';
  paymentMethod: PaymentMethod;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    district?: string;
    locationSource?: 'GPS' | 'PIN' | 'SEARCH' | 'LINK';
  };
  deliverySlot?: string;
  deliveryDate?: string;
  deliveryNote?: string;
  couponCode?: string;
  bkashSenderNumber?: string;
  bkashTransactionId?: string;
  email?: string;
  redeemPoints?: number;
  skipLocation?: boolean;
  isAbroadOrder?: boolean;
  senderCountry?: string;
  senderContactMethod?: 'WHATSAPP' | 'IMO' | 'PHONE';
  senderContactNumber?: string;
}

export interface OrderDetailItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface PlacedOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  shippingAddress?: CustomerAddress;
  items?: OrderDetailItem[];
  createdAt: string;
  estimatedDelivery?: string;
  deliveryFeePending?: boolean;
  isAbroadOrder?: boolean;
  senderCountry?: string | null;
  senderContactMethod?: string | null;
  senderContactNumber?: string | null;
  locationToken?: string | null;
  locationUrl?: string | null;
}
