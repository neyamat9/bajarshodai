import React from 'react';
import { ProductGridItem } from './ProductGridCard';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { useQuickViewStore } from '@/store/useQuickViewStore';

export interface ProductQuickViewSheetProps {
  product: ProductGridItem | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart?: (quantity: number) => void;
  onViewFullDetails?: (slug: string) => void;
}

export function ProductQuickViewSheet({
  product,
  visible,
}: ProductQuickViewSheetProps) {
  const { openQuickView, closeQuickView } = useQuickViewStore();

  React.useEffect(() => {
    if (visible && product) {
      openQuickView(product as any);
    } else if (!visible) {
      closeQuickView();
    }
  }, [visible, product, openQuickView, closeQuickView]);

  return <ProductQuickViewModal />;
}

export { ProductQuickViewModal };
