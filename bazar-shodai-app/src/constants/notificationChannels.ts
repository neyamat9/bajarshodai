import { AndroidImportance, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

export interface AppNotificationChannel {
  id: string;
  name: string;
  importance: AndroidImportance;
  vibrationPattern?: number[];
  sound?: string;
  description: string;
}

export const NOTIFICATION_CHANNELS: AppNotificationChannel[] = [
  {
    id: 'orders',
    name: 'Order Updates',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    description: 'Notifications about order placement, packing, dispatch and live delivery.',
  },
  {
    id: 'rider',
    name: 'Rider Assignments',
    importance: AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    description: 'Urgent alerts for delivery riders when orders are assigned or reassigned.',
  },
  {
    id: 'deals',
    name: 'Discounts & Promotions',
    importance: AndroidImportance.DEFAULT,
    description: 'Daily fresh market discounts, flash sales and coupon rewards.',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Medicine',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200, 200],
    description: 'Prescription verification notices and medicine restock alerts.',
  },
];

export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    for (const channel of NOTIFICATION_CHANNELS) {
      await setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: channel.vibrationPattern,
        description: channel.description,
        lightColor: '#0b6234',
        enableLights: true,
        enableVibrate: true,
      });
    }
  } catch (err) {
    // Graceful fallback on emulator or unsupported environment
    console.warn('[NotificationChannels] Could not register Android channels:', err);
  }
}
