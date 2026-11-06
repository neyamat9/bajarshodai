import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { Icon } from '@/components/ui/Icon';
import { formatBdt } from '@/utils/format';
import { Radius, Shadows } from '@/constants/layout';
import { haptics } from '@/services/haptics';
import { useQuickViewStore } from '@/store/useQuickViewStore';

export interface ProductGridItem {
  id: string;
  name: string;
  banglaName?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  unit: string;
  packSize?: string;
  stock?: number;
  trackStock?: boolean;
  inStock?: boolean;
  discountPercent?: number;
  badge?: string;
  isWishlisted?: boolean;
}

export interface ProductGridCardProps {
  product: ProductGridItem;
  quantityInCart?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
  onQuantityChange?: (quantity: number) => void;
  onToggleWishlist?: () => void;
  className?: string;
}

function ProductGridCardComponent({
  product,
  quantityInCart = 0,
  onPress,
  onAddToCart,
  onQuantityChange,
  onToggleWishlist,
  className = '',
}: ProductGridCardProps) {
  const isUntracked = product.trackStock === false;
  const isOutOfStock =
    product.inStock === false ||
    (!isUntracked && product.stock !== undefined && product.stock <= 0);
  const discount =
    product.discountPercent ??
    (product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const handleAddToCart = (e: any) => {
    e?.stopPropagation?.();
    if (isOutOfStock) return;
    void haptics.selection().catch(() => {});
    onAddToCart?.();
  };

  const handleDecrease = (e: any) => {
    e?.stopPropagation?.();
    void haptics.selection().catch(() => {});
    if (onQuantityChange) {
      onQuantityChange(Math.max(0, quantityInCart - 1));
    }
  };

  const handleIncrease = (e: any) => {
    e?.stopPropagation?.();
    void haptics.selection().catch(() => {});
    if (onQuantityChange) {
      onQuantityChange(quantityInCart + 1);
    }
  };

  const handleWishlist = (e: any) => {
    e?.stopPropagation?.();
    void haptics.selection().catch(() => {});
    onToggleWishlist?.();
  };

  const displayTitle = product.banglaName || product.name;
  const displayUnit = product.packSize || (product.unit ? `১ ${product.unit}` : '');
  const openQuickView = useQuickViewStore((s) => s.openQuickView);

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      openQuickView(product as any);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      delayPressIn={0}
      onPress={handleCardPress}
      style={[styles.card, Shadows.sm]}
      className={`bg-card border border-border ${className}`}
    >
      {/* ── Aspect Square Image Container ─────────────────────── */}
      <View style={styles.imageArea}>
        <AppImage
          source={product.imageUrl}
          contentFit="cover"
          aspectRatio={1}
          borderRadius={0}
        />

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>স্টক শেষ</Text>
            </View>
          </View>
        )}

        {/* Badges: Only Discount Percentage Badge (Top-Left) */}
        <View style={styles.badgesTopLeft}>
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          ) : null}
        </View>

        {/* Wishlist Heart Toggle (Top-Right) */}
        <TouchableOpacity
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={handleWishlist}
          style={styles.wishlistBtn}
          accessibilityRole="button"
          accessibilityLabel="Wishlist"
        >
          <Icon
            name="Heart"
            size={13}
            color={product.isWishlisted ? '#dc2626' : '#6b7280'}
            fill={product.isWishlisted ? '#dc2626' : 'none'}
          />
        </TouchableOpacity>

        {/* Floating Price Pill (Bottom-Left inside image) */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{formatBdt(product.price)}</Text>
          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.originalPriceText}>{formatBdt(product.originalPrice)}</Text>
          ) : null}
        </View>

        {/* Floating Cart Button / Stepper (Bottom-Right inside image) */}
        <View style={styles.cartActionArea}>
          {isOutOfStock ? null : quantityInCart > 0 && onQuantityChange ? (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                delayPressIn={0}
                onPress={handleDecrease}
                style={styles.stepperBtn}
                accessibilityLabel="Decrease quantity"
              >
                <Icon name="Minus" size={11} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{quantityInCart}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                delayPressIn={0}
                onPress={handleIncrease}
                style={styles.stepperBtn}
                accessibilityLabel="Increase quantity"
              >
                <Icon name="Plus" size={11} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              delayPressIn={0}
              onPress={handleAddToCart}
              style={styles.cartBtn}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              <Icon name="ShoppingCart" size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Product Info Beneath Image (Strict Uniform Height) ── */}
      <View style={styles.infoArea}>
        <View style={styles.titleContainer}>
          <Text numberOfLines={2} style={styles.titleText} className="text-foreground">
            {displayTitle}
          </Text>
        </View>
        <View style={styles.unitContainer}>
          <Text numberOfLines={1} style={styles.unitText} className="text-muted-foreground">
            {displayUnit || ' '}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const ProductGridCard = React.memo(
  ProductGridCardComponent,
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.product.price === next.product.price &&
    prev.product.originalPrice === next.product.originalPrice &&
    prev.product.stock === next.product.stock &&
    prev.product.inStock === next.product.inStock &&
    prev.product.isWishlisted === next.product.isWishlisted &&
    prev.quantityInCart === next.quantityInCart &&
    prev.className === next.className,
);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.brand,
    overflow: 'hidden',
    width: '100%',
  },
  imageArea: {
    aspectRatio: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f5f7f5',
    overflow: 'hidden',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 98, 52, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  outOfStockBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  badgesTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
    flexDirection: 'column',
    gap: 3,
  },
  discountBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  tagBadge: {
    backgroundColor: '#0b6234',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pricePill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  priceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0b6234',
  },
  originalPriceText: {
    fontSize: 9.5,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  cartActionArea: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    zIndex: 10,
  },
  cartBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b6234',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b6234',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#0b6234',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  stepperBtn: {
    width: 22,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  infoArea: {
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 9,
    height: 66,
    justifyContent: 'space-between',
  },
  titleContainer: {
    height: 32,
    justifyContent: 'flex-start',
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  unitContainer: {
    height: 15,
    justifyContent: 'center',
    marginTop: 3,
  },
  unitText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
});
