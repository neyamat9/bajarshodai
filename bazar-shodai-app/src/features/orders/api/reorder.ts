import { reorderApi } from './ordersApi';
import { CustomerOrderRecord } from '../types';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export async function executeReorder(order: CustomerOrderRecord, onNavigateToCart: () => void) {
  haptics.selection();
  const addItem = useCartStore.getState().addItem;

  try {
    // 1. Try server-side cart merge if online
    void reorderApi(order.id).catch(() => {});

    // 2. Add each item to local cart store
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        addItem(
          {
            id: item.productId,
            productId: item.productId,
            name: item.productName,
            banglaName: item.productNameBn,
            price: item.unitPrice,
            unit: item.unit || 'kg',
            imageUrl: item.imageUrl,
          },
          item.quantity,
        );
      }
    }

    haptics.success();
    toast.success(
      'Re-order Added to Bag',
      `${order.items?.length || 0} items from order #${order.orderNumber} added to cart`,
    );
    onNavigateToCart();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not re-order items';
    toast.error('Re-order Failed', msg);
  }
}
