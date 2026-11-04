import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export function handleNotificationPayload(data: Record<string, any> | undefined) {
  if (!data) return;

  if (data.orderId) {
    router.push(`/orders/${data.orderId}` as any);
  } else if (data.deliveryId) {
    router.push(`/(rider)/order/${data.deliveryId}` as any);
  } else if (data.returnId) {
    router.push('/(account)/returns');
  } else if (data.ticketId) {
    router.push(`/support/${data.ticketId}` as any);
  } else if (data.productSlug) {
    router.push(`/product/${data.productSlug}` as any);
  } else if (data.categorySlug) {
    router.push(`/category/${data.categorySlug}` as any);
  } else if (data.url) {
    router.push(data.url as any);
  }
}

export function setupNotificationListeners(): () => void {
  // 1. Foreground notification arrival listener
  const notificationReceivedSub = Notifications.addNotificationReceivedListener((notification) => {
    haptics.success();
    const title = notification.request.content.title || 'Bazar Shodai Update';
    const body = notification.request.content.body || '';

    toast.info(title, body);
  });

  // 2. Notification response / tap listener (user clicks on notification banner)
  const responseReceivedSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handleNotificationPayload(data);
  });

  // Return teardown function
  return () => {
    notificationReceivedSub.remove();
    responseReceivedSub.remove();
  };
}
