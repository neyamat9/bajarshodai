import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { AppImage } from '@/components/ui/AppImage';
import { formatBdt, toBengaliNumerals, assetUrl } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { Radius } from '@/constants/layout';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { useTranslation, getAppLanguage } from '@/i18n';
import { haptics } from '@/services/haptics';
import { fetchProductDetailApi } from '@/features/products/api/productsApi';

export default function QuickViewModalRoute() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBn = getAppLanguage() === 'bn';

  const { slug, name, nameBn, price, originalPrice, imageUrl, unit } = useLocalSearchParams<{
    slug?: string;
    name?: string;
    nameBn?: string;
    price?: string;
    originalPrice?: string;
    imageUrl?: string;
    unit?: string;
  }>();

  const [quantity, setQuantity] = useState(1);
  const [productDetail, setProductDetail] = useState<any>(null);
  const addItem = useCartStore((s) => s.addItem);

  const productSlug = slug || '';
  const initialName = name || (slug ? String(slug).replace(/-/g, ' ') : 'Grocery Item');
  const numericPrice = price ? parseFloat(price) : productDetail?.price ? Number(productDetail.price) : 120;
  const regularPrice = originalPrice ? parseFloat(originalPrice) : productDetail?.regularPrice ? Number(productDetail.regularPrice) : undefined;
  const unitLabel = unit || productDetail?.unit?.shortLabelBn || productDetail?.unit?.shortLabel || 'kg';
  const imgUrl = imageUrl ? assetUrl(String(imageUrl)) : productDetail?.imageUrl ? assetUrl(productDetail.imageUrl) : '';

  const displayTitle = (isBn ? productDetail?.nameBn || nameBn || initialName : initialName) || initialName;

  useEffect(() => {
    if (productSlug) {
      fetchProductDetailApi(productSlug)
        .then((data) => {
          setProductDetail(data);
        })
        .catch(() => {});
    }
  }, [productSlug]);

  const handleDecrease = () => {
    void haptics.selection().catch(() => {});
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    void haptics.selection().catch(() => {});
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    void haptics.selection().catch(() => {});
    addItem(
      {
        productId: productSlug || 'quick-item',
        id: productSlug || 'quick-item',
        name: displayTitle,
        banglaName: nameBn || productDetail?.nameBn,
        price: numericPrice,
        originalPrice: regularPrice,
        unit: unitLabel,
        imageUrl: imgUrl || undefined,
      },
      quantity,
    );
    toast.success(
      t('quickView.addedToCart') || (isBn ? 'ব্যাগে যুক্ত করা হয়েছে' : 'Added to Cart'),
      `${isBn ? toBengaliNumerals(quantity) : quantity}x ${displayTitle}`,
    );
    router.back();
  };

  const handleViewFullDetails = () => {
    void haptics.selection().catch(() => {});
    if (productSlug) {
      router.replace(`/product/${productSlug}`);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: isDark ? colors.background : '#ffffff' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {t('quickView.title') || (isBn ? 'এক নজরে' : 'Quick View')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close quick view"
        >
          <Icon name="X" size={20} color={isDark ? '#cbd5e1' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {imgUrl ? (
          <View style={styles.imageBox}>
            <AppImage source={imgUrl} aspectRatio={1.35} contentFit="contain" borderRadius={Radius.brand} />
          </View>
        ) : null}

        <Text style={[styles.productTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {displayTitle}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatBdt(numericPrice)}</Text>
          {regularPrice && regularPrice > numericPrice ? (
            <Text style={styles.originalPriceText}>{formatBdt(regularPrice)}</Text>
          ) : null}
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{unitLabel}</Text>
          </View>
        </View>

        {/* Stepper */}
        <View style={[styles.stepperRow, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <Text style={[styles.stepperLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {t('quickView.quantity') || (isBn ? 'পরিমাণ:' : 'Quantity:')}
          </Text>
          <View style={[styles.stepper, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <TouchableOpacity onPress={handleDecrease} style={styles.stepperBtn} disabled={quantity <= 1}>
              <Icon name="Minus" size={16} color={quantity <= 1 ? '#94a3b8' : '#0b6234'} />
            </TouchableOpacity>
            <Text style={[styles.stepperCount, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {isBn ? toBengaliNumerals(quantity) : quantity}
            </Text>
            <TouchableOpacity onPress={handleIncrease} style={styles.stepperBtn}>
              <Icon name="Plus" size={16} color="#0b6234" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add to Cart */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAddToCart}
          style={styles.addToCartBtn}
        >
          <Icon name="ShoppingCart" size={18} color="#ffffff" />
          <Text style={styles.addToCartText}>
            {t('quickView.addToCart') || (isBn ? 'ব্যাগে যোগ করুন' : 'Add to Cart')} • {formatBdt(numericPrice * quantity)}
          </Text>
        </TouchableOpacity>

        {/* ── View Full Details Button ── */}
        {productSlug ? (
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
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.fullDetailsTitle, { color: isDark ? '#6ee7b7' : '#0b6234' }]}>
                  {t('quickView.viewFullDetails') || (isBn ? 'সম্পূর্ণ বিবরণ দেখুন' : 'View Full Details')}
                </Text>
                <Icon name="ChevronRight" size={16} color={isDark ? '#6ee7b7' : '#0b6234'} />
              </View>
              <Text style={[styles.fullDetailsSubtitle, { color: isDark ? '#a7f3d0' : '#15803d' }]}>
                {t('quickView.viewFullDetailsSubtitle') || (isBn ? 'বিস্তারিত বিবরণ, পুষ্টিগুণ ও গ্রাহকদের রিভিউ দেখুন' : 'Full specifications, nutrition facts & customer reviews')}
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <Icon name="ArrowRight" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  imageBox: {
    marginBottom: 14,
    borderRadius: Radius.brand,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0b6234',
  },
  originalPriceText: {
    fontSize: 15,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  unitBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCount: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b6234',
    height: 48,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  fullDetailsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
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
