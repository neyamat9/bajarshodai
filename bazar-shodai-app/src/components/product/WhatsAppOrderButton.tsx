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
import { openWhatsAppOrder } from '@/utils/whatsappOrder';
import { haptics } from '@/services/haptics';
import { getAppLanguage } from '@/i18n';

export interface WhatsAppOrderButtonProps {
  productName: string;
  productSlug: string;
  productPrice: number;
  variant?: 'full' | 'compact' | 'icon';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  whatsappNumber?: string | null;
  template?: string | null;
}

export function WhatsAppIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.92 9.92 0 1 0 12.04 2zm0 1.8a8.12 8.12 0 0 1 6.9 12.4 8.1 8.1 0 0 1-10.9 2.7l-.3-.18-3.1.82.83-3.03-.2-.31A8.12 8.12 0 0 1 12.04 3.8zM8.6 7.5c-.2 0-.5.07-.75.35-.26.28-1 1-1 2.43s1.03 2.8 1.17 3c.14.2 2 3.2 4.95 4.35 2.45.97 2.95.78 3.48.73.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.28-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.14-.2.28-.74.93-.9 1.12-.17.2-.33.22-.62.07-.28-.14-1.2-.44-2.28-1.4-.85-.76-1.42-1.7-1.58-1.98-.17-.29-.02-.44.12-.58.13-.13.28-.33.43-.5.14-.17.2-.28.28-.47.1-.2.05-.36-.02-.5-.07-.15-.64-1.58-.9-2.16-.23-.5-.47-.5-.65-.5z"
      />
    </Svg>
  );
}

export function WhatsAppOrderButton({
  productName,
  productSlug,
  productPrice,
  variant = 'full',
  style,
  textStyle,
  whatsappNumber: propNumber,
  template: propTemplate,
}: WhatsAppOrderButtonProps) {
  const { data: settings } = useSiteSettings();
  const isBn = getAppLanguage() === 'bn';

  const resolvedNumber =
    propNumber || settings?.site?.whatsapp || settings?.site?.hotline || '8801834529197';
  const resolvedTemplate = propTemplate || settings?.site?.whatsappOrderTemplate || null;

  const handlePress = () => {
    void haptics.selection().catch(() => {});
    void openWhatsAppOrder({
      whatsappNumber: resolvedNumber,
      productName,
      productSlug,
      productPrice,
      isBn,
      template: resolvedTemplate,
    });
  };

  const label = isBn ? 'হোয়াটসঅ্যাপে অর্ডার' : 'Order on WhatsApp';

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.iconBtn, style]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <WhatsAppIcon size={18} color="#ffffff" />
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
        <WhatsAppIcon size={16} color="#ffffff" />
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
      <WhatsAppIcon size={20} color="#ffffff" />
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
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#25D366',
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
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#25D366',
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
    backgroundColor: '#25D366',
    borderRadius: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

