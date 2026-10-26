export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  label: string;
  type: 'color' | 'size' | 'storage' | 'ram';
  colorHex?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
}

export interface SpecItem {
  key: string;
  value: string;
}

export interface SpecGroup {
  groupName: string;
  items: SpecItem[];
}

export interface PinnedSpec {
  icon: 'chip' | 'memory' | 'connector' | 'power' | 'display' | 'storage' | 'speed' | 'weight';
  label: string;
  value: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

/** How a product is sold (kg, piece, packet …). The labels are already in the page language. */
export interface ProductUnit {
  code: string;
  label: string;
  allowDecimal: boolean;
  /** how much the + / − buttons add */
  step: number;
  minQty: number;
}

export type ProductBadge = 'NEW' | 'HOT' | 'BEST SELLER' | 'LIMITED STOCK';

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brand: string;
  brandName: string;
  category: string;
  categoryName: string;
  /** root → the product's own category (for the breadcrumb); only on the product page */
  categoryPath: { slug: string; name: string }[];
  productCode: string;
  unit: ProductUnit | null;
  /** e.g. "500 g" */
  packSize: string;
  isWeighed: boolean;
  trackStock?: boolean;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  images: ProductImage[];
  variants: ProductVariant[];
  specs: SpecGroup[];
  pinnedSpecs: PinnedSpec[];
  badges: ProductBadge[];
  soldLast24h: number;
  purchasePoints: number;
  priceHistory: PriceHistoryPoint[];
  isFeatured: boolean;
  createdAt: string;
  /** has options (colour / storage…) the customer must pick first */
  hasVariants?: boolean;
  avgRating?: number;
  reviewCount?: number;
  freeShipping?: boolean;
  medicineMeta?: MedicineMeta | null;
}

export interface MedicineMeta {
  id: string;
  genericName: string;
  genericSlug: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  type: 'OTC' | 'PRESCRIPTION';
  medexUrl?: string | null;
  medexId?: number | null;
  mrpUnit?: number | null;
  mrpStrip?: number | null;
  mrpBox?: number | null;
  packSizeInfo?: string | null;
}

/** A category below the top level. The tree can go several levels deep: `children` are the next level. */
export interface SubCategory {
  id: string;
  slug: string;
  name: string;
  /** the top-level category it belongs to */
  categorySlug: string;
  /** active products in it and below it */
  productCount: number;
  children: SubCategory[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image?: string | null;
  /** the children (next level of the tree); each can have children of its own */
  subCategories: SubCategory[];
  /** active products in it and below it */
  productCount: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  country: string;
  foundedYear: number;
  productCount: number;
}

export interface Review {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
  helpfulCount: number;
  notHelpfulCount: number;
  verified: boolean;
}

export interface Question {
  id: string;
  productId: string;
  askerName: string;
  questionText: string;
  answerText?: string;
  answererName?: string;
  date: string;
}

export interface CartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  variantId?: string;
  variantLabel?: string;
  /** how much (0.5 kg is fine for a product sold in parts) */
  quantity: number;
  imageUrl: string;
  stock: number;
  /** how the product is sold: the unit text and the step / minimum of the + and − buttons */
  unit?: ProductUnit | null;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  stock: number;
  addedAt: string;
}

/** The same eleven statuses (and wording) the admin dashboard shows: keep it in step with dashboard/src/components/shared/StatusBadge.tsx. */
export type OrderStatus =
  | 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'In transit' | 'Out for delivery'
  | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded' | 'On hold';

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantLabel?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  landmark?: string;
  placeName?: string;
}

/** A point on the map: where the delivery goes. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** A delivery location the customer chose: shared from the phone, dropped on the map, searched or sent through a link. */
export interface PickedLocation extends GeoPoint {
  accuracyM?: number | null;
  source: 'GPS' | 'PIN' | 'SEARCH' | 'LINK';
  /** the place name in the page language (the other language is looked up by the server) */
  placeName?: string | null;
  landmark?: string | null;
}

/** What delivery to a point costs: the answer of the server (the checkout never works it out itself). */
export interface DeliveryQuote {
  available: boolean;
  block: 'DISABLED' | 'ORIGIN_NOT_SET' | 'NO_LOCATION' | 'OUT_OF_AREA' | null;
  distanceKm: number | null;
  directDistanceKm?: number | null;
  roadDistanceKm?: number | null;
  distanceCalculation?: 'direct' | 'road';
  durationSec: number | null;
  /** no road route was found: the distance is the straight line times a factor */
  estimated: boolean;
  calculatedFee: number | null;
  cost: number;
  isFree: boolean;
  freeDeliveryThreshold: number | null;
  amountForFreeDelivery: number | null;
  straightKm: number | null;
  radiusKm: number;
}

// Where an order is delivered (checkout form)
export interface CheckoutAddress {
  fullName: string;
  phone: string;
  email: string; // guests: for the order emails
  /** house, lane, area: what the rider reads */
  address: string;
  /** "beside the green gate" */
  landmark: string;
  /** the pin: set in the location step */
  location: PickedLocation | null;
}

// Only Cash on Delivery and manual bKash are supported — no payment gateway.
export type PaymentMethod = 'Cash on Delivery' | 'bKash' | 'Nagad' | 'Rocket';
/** the mobile-banking methods (send money + transaction ID) */
export const MOBILE_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Rocket'];

export interface Order {
  id: string;
  /** the number customers quote, e.g. GB-20260101-0001 */
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  // Present only when paymentMethod is 'bKash' — submitted by the customer,
  // confirmed by an admin against the merchant account.
  bkashTransactionId?: string;
  bkashSenderNumber?: string;
  placedAt: string;
  estimatedDelivery: string;
  statusHistory: { status: OrderStatus; timestamp: string }[];
  rawStatus?: string;
  paymentStatus?: string;
  discountAmount?: number;
  couponCode?: string | null;
  paidAmount?: number;
  dueAmount?: number;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  /** road distance from the shop to the delivery pin */
  deliveryDistanceKm?: number | null;
  deliveryPlaceName?: string | null;
  deliveryLandmark?: string | null;
  /** the rider, once the parcel is with them */
  rider?: { name: string; phone: string; status: "PICKED_UP" | "ON_THE_WAY" } | null;
  canCancel?: boolean;
  deliveryNote?: string | null;
  paymentVerifiedAt?: string | null;
  /** when each status was reached, by the server's own timestamps */
  confirmedAt?: string | null;
  processingAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

export interface User {
  /** the language the customer chose (bn or en) */
  language?: 'bn' | 'en';
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  orderIds: string[];
  createdAt: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface CartResult {
  ok: boolean;
  error?: string;
}

export interface CartContextValue {
  cart: Cart;
  /** true until the first cart load finishes */
  loading: boolean;
  addToCart: (product: Omit<CartItem, 'id'>) => Promise<CartResult>;
  removeFromCart: (itemId: string) => Promise<CartResult>;
  updateQuantity: (itemId: string, quantity: number) => Promise<CartResult>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export interface WishlistContextValue {
  items: WishlistItem[];
  addToVault: (item: Omit<WishlistItem, 'addedAt'>) => Promise<void>;
  removeFromVault: (productId: string) => Promise<void>;
  isInVault: (productId: string) => boolean;
  vaultCount: number;
}

export interface SignupData {
  name: string;
  /** required: customers sign in with it */
  phone: string;
  /** optional, for receipts and password reset links */
  email?: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** true until we know whether a saved login is still valid */
  isLoading: boolean;
  /** `identifier` is a mobile number, or the email when the account has one */
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

export interface ProductFilters {
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'popular';
}
