import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { CartItem } from '@/store/useCartStore';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface SwipeableCartItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function SwipeableCartItem({ item, onUpdateQuantity, onRemove }: SwipeableCartItemProps) {
  const lineTotal = item.price * item.quantity;

  const handleRemove = () => {
    haptics.warning();
    onRemove();
  };

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        {/* Thumbnail */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={styles.placeholderThumb}>
            <Icon name="ShoppingBag" size={20} color="#9ca3af" />
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.name}
              </Text>
              {item.banglaName && (
                <Text style={styles.banglaTitle} numberOfLines={1}>
                  {item.banglaName}
                </Text>
              )}
            </View>

            {/* Remove Action */}
            <TouchableOpacity
              onPress={handleRemove}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name} from cart`}
            >
              <Icon name="Trash2" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Price & Stepper Row */}
          <View style={styles.bottomRow}>
            <View>
              <Price amount={lineTotal} size="sm" />
              <Text style={styles.unitPrice}>
                ৳{item.price}/{item.unit || 'unit'}
              </Text>
            </View>

            <QuantityStepper
              quantity={item.quantity}
              onQuantityChange={(newQty) => {
                if (newQty <= 0) {
                  handleRemove();
                } else {
                  onUpdateQuantity(newQty);
                }
              }}
              unit={item.unit}
              size="sm"
              min={0}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 8,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: Radius.sm,
    backgroundColor: '#f3f4f6',
  },
  placeholderThumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.sm,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  banglaTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  unitPrice: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
});
