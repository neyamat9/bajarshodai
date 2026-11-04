export interface BannerItemData {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  linkType?: string | null;
  linkResourceId?: string | null;
  position?: 'HERO_MAIN' | 'HERO_SIDE' | 'POPUP' | string;
  bgColor?: string | null;
  textColor?: string | null;
}

export interface HomeCategoryData {
  id: string;
  name: string;
  nameBn?: string | null;
  slug: string;
  image?: string | null;
  icon?: string | null;
  productCount?: number;
  children?: HomeCategoryData[];
}

export interface HomeBrandData {
  id?: string;
  name: string;
  slug: string;
  logo?: string | null;
}

export interface ProductUnitData {
  code: string;
  shortLabel: string;
  shortLabelBn?: string | null;
  allowDecimal?: boolean;
  step?: number;
  minQty?: number;
}

export interface ProductCardData {
  id: string;
  name: string;
  nameBn?: string | null;
  slug: string;
  price: number;
  regularPrice?: number;
  discountPercent?: number;
  inStock?: boolean;
  stock?: number;
  avgRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  unit?: ProductUnitData | null;
  imageUrl?: string;
  primaryImage?: { url: string; alt?: string | null } | null;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string; logo?: string | null } | null;
}

export interface HomeFeedData {
  featured: ProductCardData[];
  newArrivals: { data: ProductCardData[]; total: number } | ProductCardData[];
  bestSellers: { data: ProductCardData[]; total: number } | ProductCardData[];
  onSale: { data: ProductCardData[]; total: number } | ProductCardData[];
  categories: HomeCategoryData[];
  brands: HomeBrandData[];
}
