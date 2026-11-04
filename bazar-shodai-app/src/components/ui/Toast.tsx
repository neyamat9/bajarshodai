import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, ToastType } from '@/store/useToastStore';
import { Radius, Shadows } from '@/constants/layout';

export function ToastContainer() {
  const { toast, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, toast.durationMs ?? 3500);

    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const bgStyles: Record<ToastType, string> = {
    success: 'bg-brand-deep border-brand-fresh',
    error: 'bg-destructive border-destructive',
    warning: 'bg-carrot border-carrot',
    info: 'bg-brand-charcoal border-border',
  };

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const type = toast.type ?? 'info';

  return (
    <View style={[styles.wrapper, { top: Math.max(insets.top, 12) + 8 }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[styles.toast, Shadows.md]}
        className={`border ${bgStyles[type]}`}
      >
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>{icons[type]}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          )}
        </View>

        {toast.action && (
          <TouchableOpacity
            onPress={() => {
              hideToast();
              toast.action?.onPress();
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.brand,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    marginTop: 1,
  },
  actionButton: {
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
