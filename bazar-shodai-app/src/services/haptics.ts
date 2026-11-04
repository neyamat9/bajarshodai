import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Universal tactile feedback service
 */
export const haptics = {
  /**
   * Light pulse for button taps and subtle selections
   */
  light: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore unsupported devices
    }
  },

  /**
   * Medium pulse for primary CTAs and toggles
   */
  medium: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore unsupported devices
    }
  },

  /**
   * Heavy pulse for destructive actions or important confirmations
   */
  heavy: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignore unsupported devices
    }
  },

  /**
   * Selection tick for wheels, sliders, and picker changes
   */
  selection: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore unsupported devices
    }
  },

  /**
   * Success pulse (double pulse) for added to cart, order placed
   */
  success: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore unsupported devices
    }
  },

  /**
   * Warning pulse for stock limits or minor alerts
   */
  warning: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore unsupported devices
    }
  },

  /**
   * Error pulse for form validation failures or payment failure
   */
  error: async (): Promise<void> => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignore unsupported devices
    }
  },
};

