import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppImage } from '@/components/ui/AppImage';
import { Icon } from '@/components/ui/Icon';
import { formatBdt, toBengaliNumerals, assetUrl } from '@/utils/format';
import { getLocalizedDescription } from '@/utils/localizedDescription';
import { useCartStore } from '@/store/useCartStore';
import { useQuickViewStore, QuickViewProduct } from '@/store/useQuickViewStore';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { useTranslation, getAppLanguage } from '@/i18n';
import { useWishlist, useToggleWishlist } from '@/features/account/api/accountApi';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { Radius, Shadows } from '@/constants/layout';
import { isOralSolidMedicine } from '@/services/medicinePricing';
import { MedicinePurchaseSheet } from '@/components/medicine/MedicinePurchaseSheet';
import { WhatsAppOrderButton } from './WhatsAppOrderButton';
import { MessengerOrderButton } from './MessengerOrderButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickViewSheetContentProps {
  product: QuickViewProduct;
  onClose: () => void;
}

function QuickViewSheetContent({ product, onClose }: QuickViewSheetContentProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBn = getAppLanguage() === 'bn';

  const addItem = useCartStore((s) => s.addItem);
  const { data: wishlist = [] } = useWishlist();
  const { mutate: toggleWishlist } = useToggleWishlist();

  const [quantity, setQuantity] = useState(1);
  const isOralSolid = isOralSolidMedicine(
    product.medicineMeta?.dosageForm || (product as any).dosageForm,
  );
  const [isPurchaseSheetOpen, setIsPurchaseSheetOpen] = useState(false);

  useEffect(() => {
    if (!isPurchaseSheetOpen) return;

    const onBackPress = () => {
      setIsPurchaseSheetOpen(false);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isPurchaseSheetOpen]);

  const rawImage =
    (typeof product.images?.[0] === 'string'
      ? product.images[0]
      : product.images?.[0]?.url) ||
    product.imageUrl ||
    product.image ||
    '';
  const fullImageUrl = assetUrl(rawImage);

  const displayTitle =
    (isBn ? product.banglaName || product.nameBn || product.name : product.name) ||
    product.name;
  const secondaryTitle =
    product.name !== displayTitle ? product.name : product.banglaName || product.nameBn;

  const unitLabel =
    typeof product.unit === 'string'
      ? product.unit
      : product.unit?.shortLabelBn ||
        product.unit?.shortLabel ||
        product.unit?.label ||
        'kg';
  const displayUnit =
    product.packSize || (unitLabel ? (isBn ? `১ ${unitLabel}` : `1 ${unitLabel}`) : '');

  const isUntracked = product.trackStock === false;
  const isOutOfStock =
    !isUntracked &&
    (product.inStock === false ||
      (product.stock !== undefined && product.stock <= 0));

  const regularPrice = product.originalPrice ?? product.regularPrice;
  const discount =
    product.discountPercent ??
    (regularPrice && regularPrice > product.price
      ? Math.round(((regularPrice - product.price) / regularPrice) * 100)
      : 0);
  const saveAmount =
    regularPrice && regularPrice > product.price ? regularPrice - product.price : 0;

  const isWishlisted = wishlist.some(
    (w: any) => w.product?.id === product.id || w.productId === product.id,
  );

  const localizedDesc = getLocalizedDescription(product, isBn);

  const handleDecrease = () => {
    void haptics.selection().catch(() => {});
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    void haptics.selection().catch(() => {});
    const maxStock = isUntracked ? 99 : product.stock ?? 99;
    const maxLimit = product.maxQty ?? (product.unit as any)?.maxQty;
    const effectiveCap = typeof maxLimit === 'number' && maxLimit > 0 ? Math.min(maxStock, maxLimit) : maxStock;
    if (quantity < effectiveCap) {
      setQuantity(quantity + 1);
    } else {
      toast.info(
        isBn ? 'সর্বোচ্চ সীমা' : 'Order Limit',
        isBn
          ? `সর্বোচ্চ ${toBengaliNumerals(effectiveCap)}টি অর্ডার করা যাবে`
          : `Maximum order limit is ${effectiveCap}`,
      );
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    void haptics.selection().catch(() => {});
    if (isOralSolid) {
      setIsPurchaseSheetOpen(true);
      return;
    }

    const maxLimit = product.maxQty ?? (product.unit as any)?.maxQty;
    addItem(
      {
        id: product.id,
        productId: product.id,
        name: displayTitle,
        banglaName: product.banglaName || product.nameBn,
        price: product.price,
        originalPrice: regularPrice,
        imageUrl: fullImageUrl,
        unit: unitLabel,
        stock: product.stock,
        maxQty: typeof maxLimit === 'number' && maxLimit > 0 ? maxLimit : undefined,
      },
      quantity,
    );

    toast.success(
      t('quickView.addedToCart') || (isBn ? 'ব্যাগে যুক্ত করা হয়েছে' : 'Added to bag'),
      `${isBn ? toBengaliNumerals(quantity) : quantity}x ${displayTitle}`,
    );
  };

  const handleToggleWishlist = () => {
    void haptics.selection().catch(() => {});
    toggleWishlist(
      { productId: product.id, inWishlist: isWishlisted },
      {
        onSuccess: () => {
          toast.success(
            isWishlisted
              ? isBn
                ? 'উইশলিস্ট থেকে সরানো হয়েছে'
                : 'Removed from Wishlist'
              : isBn
                ? 'উইশলিস্টে যুক্ত করা হয়েছে'
                : 'Added to Wishlist',
          );
        },
        onError: () => {
          toast.info(
            isBn ? 'লগইন প্রয়োজন' : 'Sign In Required',
            isBn
              ? 'উইশলিস্ট সংরক্ষণ করতে লগইন করুন'
              : 'Please sign in to save items to your wishlist',
          );
        },
      },
    );
  };

  const handleViewFullDetails = () => {
    void haptics.selection().catch(() => {});
    const slug = product.slug;
    onClose();
    router.push(`/product/${slug}`);
  };

  return (
    <View
      style={[
        styles.sheetCard,
        { backgroundColor: isDark ? colors.card : '#ffffff' },
        Shadows.lg,
      ]}
    >
      {/* Top Drag Indicator */}
      <View style={styles.dragHandleContainer}>
        <View
          style={[
            styles.dragHandle,
            { backgroundColor: isDark ? '#475569' : '#cbd5e1' },
          ]}
        />
      </View>

      {/* Modal Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.categoryText,
              { color: isDark ? '#94a3b8' : '#64748b' },
            ]}
            numberOfLines={1}
          >
            {product.categoryName || product.category?.name || (isBn ? 'বাজার সদাই' : 'Bazar Shodai')}
            {product.brandName || product.brand?.name ? ` • ${product.brandName || product.brand?.name}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: isDark ? '#334155' : '#f1f5f9' },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('quickView.close') || 'Close'}
        >
          <Icon name="X" size={18} color={isDark ? '#e2e8f0' : '#475569'} />
        </TouchableOpacity>
      </View>

      {/* Content ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image Box */}
        <View
          style={[
            styles.imageWrapper,
            { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
          ]}
        >
          <AppImage
            source={fullImageUrl}
            aspectRatio={1.35}
            contentFit="contain"
            borderRadius={Radius.brand}
          />

          {/* Discount Tag */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{isBn ? toBengaliNumerals(discount) : discount}%
              </Text>
            </View>
          )}

          {/* In Stock / Out of Stock Pill */}
          <View style={styles.stockBadge}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: isOutOfStock ? '#ef4444' : '#10b981' },
              ]}
            />
            <Text
              style={[
                styles.stockText,
                { color: isOutOfStock ? '#ef4444' : '#059669' },
              ]}
            >
              {isOutOfStock
                ? t('quickView.stockOut') || (isBn ? 'স্টক শেষ' : 'Out of Stock')
                : isUntracked
                  ? t('quickView.dailyFresh') || (isBn ? 'তাজা বাজার' : 'Daily Fresh')
                  : t('quickView.inStock') || (isBn ? 'স্টকে আছে' : 'In Stock')}
            </Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.mainTitle,
                { color: isDark ? '#f8fafc' : '#0f172a' },
              ]}
            >
              {displayTitle}
            </Text>
          </View>

          {secondaryTitle && secondaryTitle !== displayTitle ? (
            <Text
              style={[
                styles.secondaryTitle,
                { color: isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              {secondaryTitle}
            </Text>
          ) : null}

          {displayUnit ? (
            <View style={styles.unitPill}>
              <Text style={styles.unitPillText}>{displayUnit}</Text>
            </View>
          ) : null}
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>{formatBdt(product.price)}</Text>

          {regularPrice && regularPrice > product.price ? (
            <Text style={styles.originalPrice}>{formatBdt(regularPrice)}</Text>
          ) : null}

          {discount > 0 && saveAmount > 0 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                {t('quickView.save') || (isBn ? 'সাশ্রয়' : 'Save')}{' '}
                {formatBdt(saveAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* Localized Short Description */}
        {localizedDesc ? (
          <View
            style={[
              styles.descBox,
              {
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
          >
            <Text
              style={[
                styles.descText,
                { color: isDark ? '#cbd5e1' : '#334155' },
              ]}
              numberOfLines={4}
            >
              {localizedDesc}
            </Text>
          </View>
        ) : null}

        {/* Weighed Item Notice */}
        {product.isWeighed && (
          <View style={styles.weighedNotice}>
            <Icon name="Shield" size={13} color="#0b6234" />
            <Text style={styles.weighedNoticeText}>
              {t('quickView.weighedNotice') ||
                (isBn
                  ? 'ওজন অনুযায়ী মূল্যের সামান্য তারতম্য হতে পারে'
                  : 'Price may slightly vary depending on final scale')}
            </Text>
          </View>
        )}

        {/* Quantity Stepper & Add to Cart Controls */}
        <View style={styles.actionRow}>
          {/* Stepper */}
          <View
            style={[
              styles.stepperContainer,
              {
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDecrease}
              disabled={isOutOfStock || quantity <= 1}
              style={styles.stepperBtn}
              accessibilityLabel="Decrease quantity"
            >
              <Icon
                name="Minus"
                size={16}
                color={quantity <= 1 || isOutOfStock ? '#94a3b8' : '#0b6234'}
              />
            </TouchableOpacity>

            <View style={styles.stepperValueBox}>
              <Text
                style={[
                  styles.stepperValue,
                  { color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
              >
                {isBn ? toBengaliNumerals(quantity) : quantity}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleIncrease}
              disabled={isOutOfStock}
              style={styles.stepperBtn}
              accessibilityLabel="Increase quantity"
            >
              <Icon
                name="Plus"
                size={16}
                color={isOutOfStock ? '#94a3b8' : '#0b6234'}
              />
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            style={[
              styles.addToCartBtn,
              isOutOfStock && styles.addToCartBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add to Cart"
          >
            <Icon
              name="ShoppingCart"
              size={18}
              color={isOutOfStock ? '#94a3b8' : '#ffffff'}
            />
            <Text
              style={[
                styles.addToCartText,
                isOutOfStock && styles.addToCartTextDisabled,
              ]}
              numberOfLines={1}
            >
              {isOutOfStock
                ? t('quickView.stockOut') || (isBn ? 'স্টক শেষ' : 'Out of Stock')
                : `${t('quickView.addToCart') || (isBn ? 'ব্যাগে যোগ করুন' : 'Add to Bag')} • ${formatBdt(product.price * quantity)}`}
            </Text>
          </TouchableOpacity>

          {/* Wishlist Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleWishlist}
            style={[
              styles.wishlistBtn,
              {
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Icon
              name="Heart"
              size={20}
              color={isWishlisted ? '#dc2626' : isDark ? '#94a3b8' : '#64748b'}
              fill={isWishlisted ? '#dc2626' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* ── Direct Chat Order Buttons (WhatsApp & Messenger) ── */}
        <View style={styles.chatOrderRow}>
          <WhatsAppOrderButton
            productName={displayTitle}
            productSlug={product.slug}
            productPrice={product.price}
            style={styles.halfOrderBtn}
          />
          <MessengerOrderButton
            productName={displayTitle}
            productSlug={product.slug}
            productPrice={product.price}
            style={styles.halfOrderBtn}
          />
        </View>

        {/* ── Prominent "View Full Details" Action Card (Click 2) ── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleViewFullDetails}
          style={[
            styles.fullDetailsCard,
            {
              backgroundColor: isDark ? 'rgba(6, 78, 59, 0.25)' : '#f0fdf4',
              borderColor: isDark ? '#059669' : '#86efac',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="View full product details"
        >
          <View style={styles.fullDetailsLeft}>
            <View style={styles.fullDetailsTitleRow}>
              <Text
                style={[
                  styles.fullDetailsTitle,
                  { color: isDark ? '#6ee7b7' : '#0b6234' },
                ]}
              >
                {t('quickView.viewFullDetails') ||
                  (isBn ? 'সম্পূর্ণ বিবরণ দেখুন' : 'View Full Details')}
              </Text>
              <Icon
                name="ChevronRight"
                size={16}
                color={isDark ? '#6ee7b7' : '#0b6234'}
              />
            </View>

            <Text
              style={[
                styles.fullDetailsSubtitle,
                { color: isDark ? '#a7f3d0' : '#15803d' },
              ]}
              numberOfLines={1}
            >
              {t('quickView.viewFullDetailsSubtitle') ||
                (isBn
                  ? 'বিস্তারিত বিবরণ, পুষ্টিগুণ ও গ্রাহকদের রিভিউ দেখুন'
                  : 'Full specifications, nutrition facts & customer reviews')}
            </Text>
          </View>

          <View style={styles.arrowCircle}>
            <Icon name="ArrowRight" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Oral Solid Pata & Loose Tablet Purchase Sheet */}
      {isOralSolid && (
        <MedicinePurchaseSheet
          visible={isPurchaseSheetOpen}
          product={{
            id: product.id,
            name: product.name,
            nameBn: product.banglaName || product.nameBn,
            slug: product.slug,
            price: product.price,
            originalPrice: regularPrice,
            dosageForm: product.medicineMeta?.dosageForm || (product as any).dosageForm,
            strength: product.medicineMeta?.strength || (product as any).strength,
            manufacturer: product.medicineMeta?.manufacturer,
            genericName: product.medicineMeta?.genericName,
            imageUrl: fullImageUrl,
            stock: product.stock,
            unitsPerStrip: product.medicineMeta?.unitsPerStrip,
            mrpUnit: product.medicineMeta?.mrpUnit ? Number(product.medicineMeta.mrpUnit) : undefined,
            mrpStrip: product.medicineMeta?.mrpStrip ? Number(product.medicineMeta.mrpStrip) : undefined,
            packSizeInfo: product.medicineMeta?.packSizeInfo ?? (product as any).packSize,
            discountPercent: discount,
            discountEligibility: product.medicineMeta?.discountEligibility,
            meta: product.medicineMeta,
          }}
          onClose={() => setIsPurchaseSheetOpen(false)}
          onConfirm={(breakdown) => {
            const displayName = displayTitle;
            if (breakdown.totalStrips > 0 && breakdown.looseTabs === 0) {
              addItem(
                {
                  id: `${product.id}-strip`,
                  productId: product.id,
                  name: `${product.name} (${breakdown.totalStrips} strips)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.totalStrips)} পাতা)`,
                  price: breakdown.effectiveStripPrice,
                  originalPrice: breakdown.stripPrice,
                  unit: 'পাতা',
                  imageUrl: fullImageUrl,
                  stock: product.stock,
                },
                breakdown.totalStrips,
              );
            } else if (breakdown.totalStrips === 0 && breakdown.looseTabs > 0) {
              addItem(
                {
                  id: `${product.id}-loose`,
                  productId: product.id,
                  name: `${product.name} (${breakdown.looseTabs} tabs)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট)`,
                  price: breakdown.effectiveTabPrice,
                  originalPrice: breakdown.tabPrice,
                  unit: 'ট্যাবলেট',
                  imageUrl: fullImageUrl,
                  stock: product.stock,
                },
                breakdown.looseTabs,
              );
            } else {
              addItem(
                {
                  id: `${product.id}-strip`,
                  productId: product.id,
                  name: `${product.name} (${breakdown.totalStrips} strips)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.totalStrips)} পাতা)`,
                  price: breakdown.effectiveStripPrice,
                  originalPrice: breakdown.stripPrice,
                  unit: 'পাতা',
                  imageUrl: fullImageUrl,
                  stock: product.stock,
                },
                breakdown.totalStrips,
              );
              addItem(
                {
                  id: `${product.id}-loose`,
                  productId: product.id,
                  name: `${product.name} (${breakdown.looseTabs} tabs)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট)`,
                  price: breakdown.effectiveTabPrice,
                  originalPrice: breakdown.tabPrice,
                  unit: 'ট্যাবলেট',
                  imageUrl: fullImageUrl,
                  stock: product.stock,
                },
                breakdown.looseTabs,
              );
            }
            toast.success(
              t('quickView.addedToCart') || 'Added to bag',
              `${displayName} (${toBengaliNumerals(breakdown.totalStrips)} পাতা + ${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট)`,
            );
            onClose();
          }}
        />
      )}
    </View>
  );
}

export function ProductQuickViewModal() {
  const { t } = useTranslation();
  const { isOpen, product, closeQuickView } = useQuickViewStore();

  // Intercept Android hardware back button and swipe-back gestures when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const onHardwareBackPress = () => {
      closeQuickView();
      return true; // Return true to prevent event from bubbling and navigating back to previous screen
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress,
    );

    return () => subscription.remove();
  }, [isOpen, closeQuickView]);

  if (!isOpen || !product) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={closeQuickView}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeQuickView}
          accessibilityLabel={t('quickView.close') || 'Close'}
        />

        {/* Keying with product.id ensures state resets cleanly without useEffect cascading */}
        <QuickViewSheetContent key={product.id} product={product} onClose={closeQuickView} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    width: '100%',
    maxHeight: Math.min(SCREEN_HEIGHT * 0.88, 720),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: Radius.brand,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    zIndex: 2,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  stockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    gap: 5,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stockDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  titleSection: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    flex: 1,
  },
  secondaryTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  unitPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 6,
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0b6234',
  },
  originalPrice: {
    fontSize: 15,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  descBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  descText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  weighedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  weighedNoticeText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 34,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b6234',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#0b6234',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  addToCartTextDisabled: {
    color: '#94a3b8',
  },
  wishlistBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatOrderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  halfOrderBtn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  fullDetailsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  fullDetailsLeft: {
    flex: 1,
    marginRight: 10,
  },
  fullDetailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fullDetailsTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  fullDetailsSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
