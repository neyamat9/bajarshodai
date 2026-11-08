export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemRecord {
  id: string;
  orderId?: string;
  productId: string;
  productName: string;
  productNameBn?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  imageUrl?: string;
}

export interface CustomerOrderRecord {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  estimatedDelivery?: string | null;
  deliveryDate?: string | null;
  deliverySlot?: string | null;
  deliveryNote?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  };
  rider?: {
    name: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  } | null;
  items: OrderItemRecord[];
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}
