import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
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

export default function ProductDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const productSlug = typeof slug === 'string' ? slug : '';

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isBackInStockOpen, setIsBackInStockOpen] = useState(false);

  const { addItem } = useCartStore();

  // Fetch product detail
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', productSlug],
    queryFn: () => fetchProductDetailApi(productSlug),
    enabled: Boolean(productSlug),
    staleTime: 1000 * 60 * 5,
  });

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
  const price = product?.price ?? 120;
  const regularPrice = product?.regularPrice;
  const inStock = product?.inStock ?? (product?.stock ? product.stock > 0 : true);
  const unitCode = product?.unit?.code || 'kg';
  const step = product?.unit?.step || 1;
  const minQty = product?.unit?.minQty || 1;

  // Derive images array
  const images = React.useMemo(() => {
    const list: string[] = [];
    if (product?.primaryImage?.url) list.push(product.primaryImage.url);
    if (product?.imageUrl && !list.includes(product.imageUrl)) list.push(product.imageUrl);
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80');
    }
    return list;
  }, [product]);

  // Handle Share
  const handleShare = async () => {
    try {
      await Share.share({
        title: name,
        message: `Check out ${name} on Bazar Shodai: https://bazarshodai.com/products/${productSlug}`,
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
        toast.success('Wishlist', `${name} saved to wishlist`);
      } else {
        toast.info('Wishlist', `${name} removed from wishlist`);
      }
      return next;
    });
  };

  // Handle Add to Cart from bottom bar
  const handleAddToCart = () => {
    addItem(
      {
        id: productId,
        productId,
        name,
        price,
        originalPrice: regularPrice,
        imageUrl: images[0],
        unit: unitCode,
        stock: product?.stock,
      },
      quantity,
    );
    toast.success('Added to Bag', `${quantity}${unitCode} ${name} added to your bag`);
  };

  // Convert related products to ProductGridItem
  const relatedGridItems = React.useMemo(() => {
    return relatedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      banglaName: p.nameBn ?? undefined,
      slug: p.slug,
      price: p.price,
      originalPrice: p.regularPrice,
      imageUrl: p.imageUrl || p.primaryImage?.url,
      unit: p.unit?.shortLabel || 'kg',
      stock: p.stock,
    }));
  }, [relatedProducts]);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0b6234" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
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
          {name}
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
              <Badge label="IN STOCK" variant="fresh" size="sm" />
            ) : (
              <Badge label="OUT OF STOCK" variant="tomato" size="sm" />
            )}
            <Badge label="100% FRESH" variant="fresh" size="sm" />
            {product?.discountPercent ? (
              <Badge label={`${product.discountPercent}% OFF`} variant="carrot" size="sm" />
            ) : null}
          </View>

          {/* Product Title & Bangla Name */}
          <Text style={styles.productName}>{name}</Text>
          {nameBn && <Text style={styles.productNameBn}>{nameBn}</Text>}

          {/* Ratings & Reviews summary */}
          <View style={styles.ratingRow}>
            <StarRating
              rating={product?.avgRating ?? reviewsData?.averageRating ?? 4.8}
              size={15}
            />
            <Text style={styles.reviewCountText}>
              ({product?.reviewCount ?? reviewsData?.total ?? 0} reviews)
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Price amount={price} originalAmount={regularPrice} unit={unitCode} size="lg" />
          </View>

          {/* Specifications Accordion */}
          <ProductSpecs origin="Bangladesh" unit={unitCode} />

          {/* Out of stock alert button */}
          {!inStock && (
            <TouchableOpacity
              onPress={() => setIsBackInStockOpen(true)}
              style={styles.notifyBtn}
              activeOpacity={0.8}
            >
              <Icon name="Bell" size={16} color="#0b6234" />
              <Text style={styles.notifyBtnText}>Notify Me When Available</Text>
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
          <RelatedProducts products={relatedGridItems} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <ProductStickyBottomBar
        unitPrice={price}
        quantity={quantity}
        unit={unitCode}
        step={step}
        minQty={minQty}
        inStock={inStock}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />

      {/* Write Review Sheet Modal */}
      <WriteReviewSheet
        visible={isWriteReviewOpen}
        productId={productId}
        productName={name}
        onClose={() => setIsWriteReviewOpen(false)}
      />

      {/* Back In Stock Subscription Dialog */}
      <BackInStockDialog
        visible={isBackInStockOpen}
        productId={productId}
        productName={name}
        onClose={() => setIsBackInStockOpen(false)}
      />
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
});
