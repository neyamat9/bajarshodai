import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSiteSettings } from '@/services/siteService';
import { openMessengerOrder, sanitizeMessengerUsername } from '@/utils/messengerOrder';
import { haptics } from '@/services/haptics';
import { getAppLanguage } from '@/i18n';

export interface MessengerOrderButtonProps {
  productName: string;
  productSlug: string;
  productPrice: number;
  variant?: 'full' | 'compact' | 'icon';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  messengerUsername?: string | null;
  template?: string | null;
}

export function MessengerIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 2C6.48 2 2 6.16 2 11.29c0 2.92 1.45 5.53 3.73 7.21v3.5l3.35-1.84c.94.26 1.93.41 2.92.41 5.52 0 10-4.16 10-9.28S17.52 2 12 2zm1.03 12.51-2.58-2.75-5.04 2.75 5.54-5.88 2.66 2.75 4.96-2.75-5.54 5.88z"
      />
    </Svg>
  );
}

export function MessengerOrderButton({
  productName,
  productSlug,
  productPrice,
  variant = 'full',
  style,
  textStyle,
  messengerUsername: propUsername,
  template: propTemplate,
}: MessengerOrderButtonProps) {
  const { data: settings } = useSiteSettings();
  const isBn = getAppLanguage() === 'bn';

  const isEnabled = settings?.site?.messengerEnabled !== false;
  if (!isEnabled) return null;

  const resolvedUsername =
    propUsername ||
    settings?.site?.messenger ||
    (settings?.site?.socialLinks?.facebook
      ? sanitizeMessengerUsername(settings.site.socialLinks.facebook)
      : null) ||
    'bajarshodai2';

  const resolvedTemplate = propTemplate || settings?.site?.messengerOrderTemplate || null;

  const handlePress = () => {
    void haptics.selection().catch(() => {});
    void openMessengerOrder({
      messengerUsername: resolvedUsername,
      productName,
      productSlug,
      productPrice,
      isBn,
      template: resolvedTemplate,
    });
  };

  const label = isBn ? 'মেসেঞ্জারে অর্ডার' : 'Order on Messenger';

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.iconBtn, style]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <MessengerIcon size={18} color="#ffffff" />
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.compactBtn, style]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <MessengerIcon size={16} color="#ffffff" />
        <Text style={[styles.compactText, textStyle]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[styles.fullBtn, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MessengerIcon size={20} color="#ffffff" />
      <Text style={[styles.fullText, textStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  fullText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  compactText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084FF',
    borderRadius: 8,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
