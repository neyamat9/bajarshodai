export type ReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'SIZE_ISSUE'
  | 'DAMAGED_IN_TRANSIT'
  | 'NO_LONGER_NEEDED';

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type RefundMethodType = 'ORIGINAL_PAYMENT' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'WALLET';

export interface ReturnItemPayload {
  orderItemId: string;
  quantity: number;
  condition?: 'New' | 'Opened' | 'Damaged' | string;
}

export interface CreateReturnPayload {
  orderId: string;
  reason: ReturnReason;
  detail?: string;
  pickupAddress?: string;
  items: ReturnItemPayload[];
  refundMethod?: RefundMethodType;
  refundAccountNumber?: string;
  evidenceImages?: string[];
}

export interface ReturnRequestItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  status: ReturnStatus;
  reason: ReturnReason;
  detail?: string;
  pickupAddress?: string;
  refundMethod?: string;
  refundAmount?: number;
  adminNote?: string;
  items: {
    id: string;
    orderItemId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  createdAt: string;
  updatedAt?: string;
}

