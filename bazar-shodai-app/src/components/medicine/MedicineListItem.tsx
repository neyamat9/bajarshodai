import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { formatBdt } from '@/utils/format';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface MedicineItemData {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  genericName?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  isPrescriptionRequired?: boolean;
  unit?: string;
  stock?: number;
  trackStock?: boolean;
  inStock?: boolean;
  imageUrl?: string;
}

export interface MedicineListItemProps {
  product: MedicineItemData;
  quantityInCart?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
  onQuantityChange?: (quantity: number) => void;
}

interface DosageVisual {
  icon: IconName;
  bg: string;
  border: string;
  color: string;
}

function getDosageVisual(form?: string): DosageVisual {
  const lower = (form || '').toLowerCase();
  if (lower.includes('syrup') || lower.includes('suspension') || lower.includes('liquid')) {
    return { icon: 'FlaskConical', bg: '#f0f9ff', border: '#bae6fd', color: '#0284c7' };
  }
  if (lower.includes('injection') || lower.includes('infusion')) {
    return { icon: 'Syringe', bg: '#faf5ff', border: '#e9d5ff', color: '#9333ea' };
  }
  if (lower.includes('drop') || lower.includes('solution')) {
    return { icon: 'Droplet', bg: '#fffbeb', border: '#fde68a', color: '#d97706' };
  }
  if (lower.includes('suppository')) {
    return { icon: 'Pill', bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' };
  }
  if (lower.includes('capsule')) {
    return { icon: 'Pill', bg: '#fdf2f8', border: '#fbcfe8', color: '#db2777' };
  }
  // Default Tablet
  return { icon: 'CircleDot', bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' };
}

function MedicineListItemComponent({
  product,
  quantityInCart = 0,
  onPress,
  onAddToCart,
  onQuantityChange,
}: MedicineListItemProps) {
  const isUntracked = product.trackStock === false;
  const isOutOfStock =
    product.inStock === false ||
    (!isUntracked && product.stock !== undefined && Number(product.stock) <= 0);

  const dosageVisual = getDosageVisual(product.dosageForm);
  const dosageLabel = product.dosageForm || 'Tablet';

  const handleAddToCart = (e: any) => {
    e?.stopPropagation?.();
    if (isOutOfStock) return;
    void haptics.selection().catch(() => {});
    onAddToCart?.();
  };

  const handleDecrease = (e: any) => {
    e?.stopPropagation?.();
    void haptics.selection().catch(() => {});
    if (onQuantityChange && quantityInCart > 0) {
      onQuantityChange(quantityInCart - 1);
    }
  };

  const handleIncrease = (e: any) => {
    e?.stopPropagation?.();
    void haptics.selection().catch(() => {});
    if (onQuantityChange) {
      onQuantityChange(quantityInCart + 1);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      delayPressIn={0}
      onPress={onPress}
      style={styles.card}
      className="bg-card border border-border"
    >
      {/* ── Left Side: Dosage Form Avatar ───────────────────────── */}
      <View style={[styles.avatarBox, { backgroundColor: dosageVisual.bg, borderColor: dosageVisual.border }]}>
        <Icon name={dosageVisual.icon} size={22} color={dosageVisual.color} />
        <Text style={[styles.avatarLabel, { color: dosageVisual.color }]} numberOfLines={1}>
          {dosageLabel}
        </Text>
      </View>

      {/* ── Middle Column: Medicine Details ─────────────────────── */}
      <View style={styles.detailsCol}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText} numberOfLines={1}>
            {product.name}
            {product.strength ? ` ${product.strength}` : ''}
          </Text>
          {product.isPrescriptionRequired ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          ) : (
            <View style={styles.otcBadge}>
              <Text style={styles.otcBadgeText}>OTC</Text>
            </View>
          )}
        </View>

        {product.nameBn ? (
          <Text style={styles.banglaName} numberOfLines={1}>
            {product.nameBn}
          </Text>
        ) : null}

        {product.genericName ? (
          <Text style={styles.genericText} numberOfLines={1}>
            {product.genericName}
          </Text>
        ) : null}

        {product.manufacturer ? (
          <Text style={styles.manufacturerText} numberOfLines={1}>
            {product.manufacturer}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatBdt(product.price)}</Text>
          {product.unit ? <Text style={styles.unitText}> / {product.unit}</Text> : null}
          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.originalPriceText}>{formatBdt(product.originalPrice)}</Text>
          ) : null}
        </View>
      </View>

      {/* ── Right Column: Add to Cart Action / Stepper ────────────── */}
      <View style={styles.actionCol}>
        {isOutOfStock ? (
          <View style={styles.outOfStockPill}>
            <Text style={styles.outOfStockText}>স্টক শেষ</Text>
          </View>
        ) : quantityInCart > 0 && onQuantityChange ? (
          <View style={styles.stepperBox}>
            <TouchableOpacity
              activeOpacity={0.7}
              delayPressIn={0}
              onPress={handleDecrease}
              style={styles.stepperBtn}
              accessibilityLabel="Decrease quantity"
            >
              <Icon name="Minus" size={12} color="#0b6234" />
            </TouchableOpacity>
            <Text style={styles.stepperQtyText}>{quantityInCart}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              delayPressIn={0}
              onPress={handleIncrease}
              style={styles.stepperBtn}
              accessibilityLabel="Increase quantity"
            >
              <Icon name="Plus" size={12} color="#0b6234" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            delayPressIn={0}
            onPress={handleAddToCart}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Add medicine to cart"
          >
            <Icon name="Plus" size={14} color="#ffffff" />
            <Text style={styles.addBtnText}>যোগ করুন</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const MedicineListItem = React.memo(
  MedicineListItemComponent,
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.product.price === next.product.price &&
    prev.product.stock === next.product.stock &&
    prev.product.inStock === next.product.inStock &&
    prev.quantityInCart === next.quantityInCart,
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.brand,
    marginBottom: 8,
  },
  avatarBox: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 12,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  detailsCol: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flexShrink: 1,
  },
  rxBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rxBadgeText: {
    color: '#7e22ce',
    fontSize: 10,
    fontWeight: '800',
  },
  otcBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  otcBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  banglaName: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  genericText: {
    fontSize: 11,
    color: '#0b6234',
    fontWeight: '600',
    marginTop: 2,
  },
  manufacturerText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0b6234',
  },
  unitText: {
    fontSize: 10,
    color: '#64748b',
  },
  originalPriceText: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b6234',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.brand,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0b6234',
    borderRadius: Radius.brand,
    backgroundColor: '#f0fdf4',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0b6234',
    paddingHorizontal: 6,
    minWidth: 20,
    textAlign: 'center',
  },
  outOfStockPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
});

