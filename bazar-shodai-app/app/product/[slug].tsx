import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductImageGallery } from '@/features/products/components/ProductImageGallery';
import { ProductSpecs } from '@/features/products/components/ProductSpecs';
import { ProductStickyBottomBar } from '@/features/products/components/ProductStickyBottomBar';
import { RelatedProducts } from '@/features/products/components/RelatedProducts';
import { BackInStockDialog } from '@/features/products/components/BackInStockDialog';
import { ProductReviewsList } from '@/features/reviews/components/ProductReviewsList';
import { WriteReviewSheet } from '@/features/reviews/components/WriteReviewSheet';
import {
  fetchProductDetailApi,
  fetchRelatedProductsApi,
} from '@/features/products/api/productsApi';
import { useProductReviews } from '@/features/reviews/api/reviewsApi';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { assetUrl, toBengaliNumerals } from '@/utils/format';
import { useTranslation } from '@/i18n';
import { getLocalizedDescription } from '@/utils/localizedDescription';
import { isOralSolidMedicine } from '@/services/medicinePricing';
import { MedicinePurchaseSheet } from '@/components/medicine/MedicinePurchaseSheet';
import { WhatsAppOrderButton } from '@/components/product/WhatsAppOrderButton';

function ProductDetailSkeleton() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top Header Placeholder */}
      <View style={styles.header}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={180} height={20} style={{ marginHorizontal: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Image Box */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Skeleton width="100%" height={300} borderRadius={12} />
        </View>

        {/* Product Details Section */}
        <View style={styles.mainInfo}>
          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Skeleton width={80} height={22} borderRadius={4} />
            <Skeleton width={60} height={22} borderRadius={4} />
          </View>

          {/* Titles */}
          <Skeleton width="90%" height={26} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="55%" height={18} borderRadius={6} style={{ marginBottom: 14 }} />

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Skeleton width={100} height={16} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
            <Skeleton width={110} height={32} borderRadius={8} />
            <Skeleton width={70} height={20} borderRadius={6} />
          </View>

          {/* Specs Card */}
          <Skeleton width="100%" height={90} borderRadius={8} style={{ marginBottom: 16 }} />

          {/* Reviews Card */}
          <Skeleton width="100%" height={120} borderRadius={8} style={{ marginBottom: 16 }} />

          {/* Related Products Title & Cards */}
          <Skeleton width={150} height={20} borderRadius={6} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width={150} height={200} borderRadius={8} />
            <Skeleton width={150} height={200} borderRadius={8} />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar Skeleton */}
      <View style={styles.stickyBarSkeleton}>
        <Skeleton width={100} height={32} borderRadius={6} />
        <Skeleton width={140} height={44} borderRadius={8} />
      </View>
    </SafeAreaView>
  );
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { isBn } = useTranslation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const productSlug = typeof slug === 'string' ? slug : '';

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isBackInStockOpen, setIsBackInStockOpen] = useState(false);

  const { addItem } = useCartStore();

  // Fetch product detail from live backend API
  const { data: rawProduct, isLoading } = useQuery({
    queryKey: ['product-detail', productSlug],
    queryFn: () => fetchProductDetailApi(productSlug),
    enabled: Boolean(productSlug),
    staleTime: 1000 * 60 * 5,
  });

  const product = rawProduct as any;

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', productSlug],
    queryFn: () => fetchRelatedProductsApi(productSlug),
    enabled: Boolean(productSlug),
    staleTime: 1000 * 60 * 10,
  });

  const productId = product?.id || productSlug;
  const { data: reviewsData } = useProductReviews(productId);

  const name = product?.name || productSlug.replace(/-/g, ' ');
  const nameBn = product?.nameBn;

  // Real backend price fields
  const price = Number(product?.sellingPrice ?? product?.price ?? 0);
  const regularPrice = product?.regularPrice ? Number(product.regularPrice) : undefined;
  const discountPercent =
    product?.discountPercent ??
    (regularPrice && regularPrice > price
      ? Math.round(((regularPrice - price) / regularPrice) * 100)
      : undefined);

  // Real stock logic: trackStock === false means untracked/unlimited stock
  const isUntracked = product?.trackStock === false;
  const inStock = product
    ? product.inStock !== false &&
      (isUntracked || product.stock === undefined || Number(product.stock) > 0)
    : true;

  const unitCode =
    product?.unit?.shortLabelBn ||
    product?.unit?.shortLabel ||
    product?.unit?.code ||
    'kg';
  const step = Number(product?.unit?.defaultStep ?? product?.unit?.step ?? 1);
  const minQty = Number(product?.unit?.defaultMinQty ?? product?.unit?.minQty ?? 1);
  const maxQty = product?.maxQty
    ? Number(product.maxQty)
    : product?.unit?.maxQty
    ? Number(product.unit.maxQty)
    : undefined;

  // Derive real image URLs from API response
  const images = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(product?.images) && product.images.length > 0) {
      product.images.forEach((img: any) => {
        const raw = typeof img === 'string' ? img : img?.url;
        const resolved = assetUrl(raw);
        if (resolved && !list.includes(resolved)) list.push(resolved);
      });
    }
    if (product?.image) {
      const resolved = assetUrl(product.image);
      if (resolved && !list.includes(resolved)) list.push(resolved);
    }
    if (product?.imageUrl) {
      const resolved = assetUrl(product.imageUrl);
      if (resolved && !list.includes(resolved)) list.push(resolved);
    }
    return list;
  }, [product]);

  // Handle Share
  const handleShare = async () => {
    try {
      await Share.share({
        title: nameBn || name,
        message: `Check out ${nameBn || name} on Bazar Shodai: https://bajarshodai.com/products/${productSlug}`,
      });
      haptics.light();
    } catch {
      // ignore
    }
  };

  // Handle Wishlist
  const handleToggleWishlist = () => {
    haptics.light();
    setIsWishlisted((prev) => {
      const next = !prev;
      if (next) {
        toast.success('Wishlist', `${nameBn || name} saved to wishlist`);
      } else {
        toast.info('Wishlist', `${nameBn || name} removed from wishlist`);
      }
      return next;
    });
  };

  const isOralSolid = isOralSolidMedicine(
    product?.medicineMeta?.dosageForm || (product as any)?.dosageForm,
  );
  const [isPurchaseSheetOpen, setIsPurchaseSheetOpen] = useState(false);

  // Handle Add to Cart from bottom bar
  const handleAddToCart = () => {
    if (isOralSolid) {
      setIsPurchaseSheetOpen(true);
      return;
    }
    addItem(
      {
        id: productId,
        productId,
        name: nameBn || name,
        price,
        originalPrice: regularPrice,
        imageUrl: images[0],
        unit: unitCode,
        stock: product?.stock ? Number(product.stock) : undefined,
        maxQty,
      },
      quantity,
    );
    toast.success('Added to Bag', `${quantity} ${unitCode} ${nameBn || name} added to your bag`);
  };

  // Convert related products to ProductGridItem with real data
  const relatedGridItems = React.useMemo(() => {
    return (Array.isArray(relatedProducts) ? relatedProducts : []).map((p: any) => {
      const pPrice = Number(p.sellingPrice ?? p.price ?? 0);
      const pRegular = p.regularPrice ? Number(p.regularPrice) : undefined;
      const rawImg = p.image || p.imageUrl || p.images?.[0]?.url || p.primaryImage?.url;
      const pUntracked = p.trackStock === false;

      return {
        id: p.id,
        name: p.name,
        banglaName: p.nameBn ?? undefined,
        slug: p.slug,
        price: pPrice,
        originalPrice: pRegular,
        imageUrl: assetUrl(rawImg),
        unit: p.unit?.shortLabelBn || p.unit?.shortLabel || 'kg',
        packSize: p.packSize ?? undefined,
        stock: p.stock ? Number(p.stock) : undefined,
        trackStock: p.trackStock,
        inStock: p.inStock !== false && (pUntracked || Number(p.stock ?? 0) > 0),
        discountPercent:
          p.discountPercent ??
          (pRegular && pRegular > pPrice
            ? Math.round(((pRegular - pPrice) / pRegular) * 100)
            : undefined),
      };
    });
  }, [relatedProducts]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {nameBn || name}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Share product"
          >
            <Icon name="Share2" size={20} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleWishlist}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Icon name="Heart" size={20} color={isWishlisted ? '#ef4444' : '#374151'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Fullscreen Multi-Image Swiper */}
        <ProductImageGallery images={images} />

        <View style={styles.mainInfo}>
          {/* Status Badges */}
          <View style={styles.badgeRow}>
            {inStock ? (
              <Badge
                label={isBn ? 'স্টকে আছে' : 'IN STOCK'}
                variant="fresh"
                size="sm"
              />
            ) : (
              <Badge
                label={isBn ? 'স্টক আউট' : 'OUT OF STOCK'}
                variant="tomato"
                size="sm"
              />
            )}
            {discountPercent ? (
              <Badge
                label={isBn ? `${discountPercent}% ছাড়` : `${discountPercent}% OFF`}
                variant="carrot"
                size="sm"
              />
            ) : null}
          </View>

          {/* Product Title & Bangla Name */}
          <Text style={styles.productName}>{isBn ? nameBn || name : name}</Text>
          {nameBn && product?.name && nameBn !== product.name ? (
            <Text style={styles.productNameBn}>{isBn ? product.name : nameBn}</Text>
          ) : null}

          {/* Ratings & Reviews summary */}
          <View style={styles.ratingRow}>
            <StarRating
              rating={Number(product?.avgRating ?? reviewsData?.averageRating ?? 4.8)}
              size={15}
            />
            <Text style={styles.reviewCountText}>
              {isBn
                ? `(${product?.reviewCount ?? reviewsData?.total ?? 0} টি রিভিউ)`
                : `(${product?.reviewCount ?? reviewsData?.total ?? 0} reviews)`}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Price amount={price} originalAmount={regularPrice} unit={unitCode} size="lg" />
          </View>

          {/* ── WhatsApp Direct Order Button ── */}
          <WhatsAppOrderButton
            productName={isBn ? nameBn || name : name}
            productSlug={product?.slug || (slug as string)}
            productPrice={price}
            style={styles.whatsAppBtn}
          />

          {/* Specifications Accordion with Localized Description */}
          <ProductSpecs
            description={getLocalizedDescription(product, isBn)}
            origin="Bangladesh"
            unit={unitCode}
            weight={product?.packSize || undefined}
            isBn={isBn}
          />

          {/* Out of stock alert button */}
          {!inStock && (
            <TouchableOpacity
              onPress={() => setIsBackInStockOpen(true)}
              style={styles.notifyBtn}
              activeOpacity={0.8}
            >
              <Icon name="Bell" size={16} color="#0b6234" />
              <Text style={styles.notifyBtnText}>
                {isBn ? 'পণ্যটি স্টকে আসলে আমাকে জানান' : 'Notify Me When Available'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Customer Reviews Section */}
          <ProductReviewsList
            productId={productId}
            reviews={reviewsData?.data}
            averageRating={reviewsData?.averageRating}
            totalReviews={reviewsData?.total}
            ratingBreakdown={reviewsData?.ratingBreakdown}
            onOpenWriteReview={() => setIsWriteReviewOpen(true)}
          />

          {/* Related Products Carousel */}
          {relatedGridItems.length > 0 && <RelatedProducts products={relatedGridItems} />}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <ProductStickyBottomBar
        unitPrice={price}
        quantity={quantity}
        unit={unitCode}
        step={step}
        minQty={minQty}
        maxQty={maxQty}
        inStock={inStock}
        productName={isBn ? nameBn || name : name}
        productSlug={product?.slug || (slug as string)}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />

      {/* Write Review Sheet Modal */}
      <WriteReviewSheet
        visible={isWriteReviewOpen}
        productId={productId}
        productName={nameBn || name}
        onClose={() => setIsWriteReviewOpen(false)}
      />

      {/* Back In Stock Subscription Dialog */}
      <BackInStockDialog
        visible={isBackInStockOpen}
        productId={productId}
        productName={nameBn || name}
        onClose={() => setIsBackInStockOpen(false)}
      />

      {/* Oral Solid Pata & Loose Tablet Purchase Sheet */}
      {isOralSolid && (
        <MedicinePurchaseSheet
          visible={isPurchaseSheetOpen}
          product={{
            id: productId,
            name,
            nameBn,
            slug: productSlug,
            price,
            originalPrice: regularPrice,
            dosageForm: product?.medicineMeta?.dosageForm || (product as any)?.dosageForm,
            strength: product?.medicineMeta?.strength || (product as any)?.strength,
            manufacturer: product?.medicineMeta?.manufacturer || product?.brand?.name,
            genericName: product?.medicineMeta?.genericName || (product as any)?.genericName,
            imageUrl: images[0],
            stock: product?.stock ? Number(product.stock) : undefined,
            unitsPerStrip: product?.medicineMeta?.unitsPerStrip,
            mrpUnit: product?.medicineMeta?.mrpUnit ? Number(product.medicineMeta.mrpUnit) : undefined,
            mrpStrip: product?.medicineMeta?.mrpStrip ? Number(product.medicineMeta.mrpStrip) : undefined,
            packSizeInfo: product?.medicineMeta?.packSizeInfo ?? product?.packSize,
            discountPercent,
            discountEligibility: product?.medicineMeta?.discountEligibility,
            meta: product?.medicineMeta,
          }}
          onClose={() => setIsPurchaseSheetOpen(false)}
          onConfirm={(breakdown) => {
            const displayName = nameBn || name;
            if (breakdown.totalStrips > 0 && breakdown.looseTabs === 0) {
              addItem(
                {
                  id: `${productId}-strip`,
                  productId,
                  name: `${name} (${breakdown.totalStrips} strips)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.totalStrips)} পাতা)`,
                  price: breakdown.effectiveStripPrice,
                  originalPrice: breakdown.stripPrice,
                  unit: 'পাতা',
                  imageUrl: images[0],
                  stock: product?.stock ? Number(product.stock) : undefined,
                },
                breakdown.totalStrips,
              );
            } else if (breakdown.totalStrips === 0 && breakdown.looseTabs > 0) {
              addItem(
                {
                  id: `${productId}-loose`,
                  productId,
                  name: `${name} (${breakdown.looseTabs} tabs)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট)`,
                  price: breakdown.effectiveTabPrice,
                  originalPrice: breakdown.tabPrice,
                  unit: 'ট্যাবলেট',
                  imageUrl: images[0],
                  stock: product?.stock ? Number(product.stock) : undefined,
                },
                breakdown.looseTabs,
              );
            } else {
              addItem(
                {
                  id: `${productId}-strip`,
                  productId,
                  name: `${name} (${breakdown.totalStrips} strips)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.totalStrips)} পাতা)`,
                  price: breakdown.effectiveStripPrice,
                  originalPrice: breakdown.stripPrice,
                  unit: 'পাতা',
                  imageUrl: images[0],
                  stock: product?.stock ? Number(product.stock) : undefined,
                },
                breakdown.totalStrips,
              );
              addItem(
                {
                  id: `${productId}-loose`,
                  productId,
                  name: `${name} (${breakdown.looseTabs} tabs)`,
                  banglaName: `${displayName} (${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট)`,
                  price: breakdown.effectiveTabPrice,
                  originalPrice: breakdown.tabPrice,
                  unit: 'ট্যাবলেট',
                  imageUrl: images[0],
                  stock: product?.stock ? Number(product.stock) : undefined,
                },
                breakdown.looseTabs,
              );
            }
            toast.success(
              'Added to Bag',
              `${displayName} (${toBengaliNumerals(breakdown.totalStrips)} পাতা + ${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট) added to your bag`,
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  mainInfo: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  productNameBn: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  reviewCountText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  priceRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  whatsAppBtn: {
    marginTop: 8,
    marginBottom: 14,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  notifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  stickyBarSkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
