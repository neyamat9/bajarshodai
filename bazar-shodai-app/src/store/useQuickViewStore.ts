import { create } from 'zustand';
import { fetchProductDetailApi } from '@/features/products/api/productsApi';

export interface QuickViewProduct {
  id: string;
  slug: string;
  name: string;
  banglaName?: string;
  nameBn?: string;
  price: number;
  originalPrice?: number;
  regularPrice?: number;
  imageUrl?: string;
  image?: string | null;
  images?: (string | { id?: string; url: string; alt?: string | null })[];
  unit: string | { label?: string; shortLabel?: string; shortLabelBn?: string; minQty?: number; maxQty?: number | null };
  packSize?: string;
  stock?: number;
  trackStock?: boolean;
  inStock?: boolean;
  discountPercent?: number;
  badge?: string;
  maxQty?: number | null;
  description?: string;
  descriptionBn?: string;
  categoryName?: string;
  category?: { id?: string; name: string; slug?: string } | null;
  brandName?: string;
  brand?: { id?: string; name: string; slug?: string; logo?: string | null } | null;
  isWeighed?: boolean;
  isWishlisted?: boolean;
  medicineMeta?: any;
}

interface QuickViewStore {
  isOpen: boolean;
  product: QuickViewProduct | null;
  isLoadingDetails: boolean;
  openQuickView: (product: QuickViewProduct) => void;
  closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewStore>((set, get) => ({
  isOpen: false,
  product: null,
  isLoadingDetails: false,

  openQuickView: (product: QuickViewProduct) => {
    // 1. Immediately open with existing product data (0ms instant response)
    set({
      isOpen: true,
      product,
      isLoadingDetails: true,
    });

    // 2. Background fetch richer details (descriptions, brand, full gallery) if available
    if (product.slug) {
      fetchProductDetailApi(product.slug)
        .then((detail: any) => {
          const current = get().product;
          // Only update if user hasn't closed or opened a different product
          if (current && current.slug === product.slug) {
            const rawImages = detail.images && detail.images.length > 0
              ? detail.images.map((img: any) => (typeof img === 'string' ? img : img.url))
              : current.images;

            set({
              product: {
                ...current,
                name: detail.name || current.name,
                banglaName: detail.nameBn || current.banglaName,
                nameBn: detail.nameBn || current.nameBn,
                price: Number(detail.price ?? current.price),
                originalPrice: detail.regularPrice ? Number(detail.regularPrice) : current.originalPrice,
                description: detail.description || current.description,
                descriptionBn: detail.descriptionBn || current.descriptionBn,
                categoryName: detail.category?.name || current.categoryName,
                brandName: detail.brand?.name || current.brandName,
                isWeighed: detail.isWeighed ?? current.isWeighed,
                stock: detail.stock !== undefined ? Number(detail.stock) : current.stock,
                inStock: detail.inStock ?? current.inStock,
                trackStock: detail.trackStock ?? current.trackStock,
                packSize: detail.packSize || current.packSize,
                images: rawImages,
                medicineMeta: detail.medicineMeta || current.medicineMeta,
              },
              isLoadingDetails: false,
            });
          }
        })
        .catch(() => {
          set({ isLoadingDetails: false });
        });
    } else {
      set({ isLoadingDetails: false });
    }
  },

  closeQuickView: () => {
    set({
      isOpen: false,
      product: null,
      isLoadingDetails: false,
    });
  },
}));

