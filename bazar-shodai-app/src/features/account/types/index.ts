export interface UserAddress {
  id: string;
  userId: string;
  label?: string; // 'Home', 'Office', 'Other'
  fullName: string;
  phone: string;
  alternatePhone?: string;
  line1: string;
  line2?: string;
  city?: string;
  district?: string;
  division?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAddressPayload {
  label?: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  line1: string;
  line2?: string;
  city?: string;
  district?: string;
  division?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string | null;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  language?: 'bn' | 'en';
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  orderId?: string | null;
  points: number;
  type: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
  order?: {
    orderNumber: string;
  };
}

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
    isEligible: boolean;
    milestoneFreeShipping: boolean;
    deliveredCount: number;
    interval: number;
    ordersUntilNextMilestone: number;
  };
  transactions: LoyaltyTransaction[];
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    name: string;
    nameBn?: string;
    price: number;
    salePrice?: number | null;
    stock: number;
    images?: string[];
    primaryImage?: string;
    unit?: string;
    isFresh?: boolean;
    ratingAverage?: number;
    reviewsCount?: number;
  };
}
