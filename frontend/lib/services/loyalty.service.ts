import { api } from '../api/client';

export interface LoyaltySummary {
  points: number;
  pointsValue: number;
  settings: {
    enabled: boolean;
    pointsPerHundredSpent: number;
    pointsPerCurrencyUnit: number;
    minOrderAmountToRedeem: number;
    minPointsToRedeem: number;
    maxDiscountPercent: number;
    freeShippingMilestoneEnabled: boolean;
    freeShippingOrderInterval: number;
    freeShippingMaxWeightKg: number;
  };
  milestone: {
    enabled: boolean;
    deliveredOrders: number;
    interval: number;
    progressInCycle: number;
    ordersUntilNextMilestone: number;
    isMilestoneUnlocked: boolean;
    maxWeightKg: number;
  };
  transactions: {
    id: string;
    points: number;
    type: 'EARNED_ORDER' | 'REDEEMED_DISCOUNT' | 'REFUNDED_ORDER' | 'ADMIN_ADJUSTMENT';
    description: string;
    balanceAfter: number;
    orderNumber: string | null;
    createdAt: string;
  }[];
}

export const getLoyaltySummary = () => api.get<LoyaltySummary>('/customer/loyalty');
