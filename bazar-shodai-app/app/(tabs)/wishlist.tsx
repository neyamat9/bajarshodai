import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Radius } from '@/constants/layout';
import { useWishlist, useToggleWishlist } from '@/features/account/api/accountApi';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { WishlistItem } from '@/features/account/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

export default function WishlistScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: wishlist = [], isLoading, refetch, isRefetching } = useWishlist();
  const { mutate: toggleWishlist } = useToggleWishlist();
  const addItem = useCartStore((s) => s.addItem);

  const handleRemove = (productId: string) => {
    haptics.light();
    toggleWishlist(
      { productId, inWishlist: true },
      {
        onSuccess: () => {
          toast.info('Removed', 'Item removed from your wishlist');
        },
      },
    );
  };

  const handleMoveToCart = (item: WishlistItem) => {
    haptics.success();
    const p = item.product;
    addItem({
      id: p.id,
      productId: p.id,
      name: p.name,
      banglaName: p.nameBn,
      price: p.salePrice ?? p.price,
      originalPrice: p.salePrice ? p.price : undefined,
      imageUrl: p.primaryImage || (p.images && p.images[0]),
      unit: p.unit,
      stock: p.stock,
    });
    toast.success('Added to Bag', `${p.name} is now in your cart.`);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Sign in to View Wishlist"
            description="Your saved wishlist items will appear here once you sign in to your account."
            actionLabel="Sign In / Register"
            onAction={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist ({wishlist.length})</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Your Wishlist is Empty"
            description="Tap the heart icon on any product in our store to save it to your wishlist for later."
            actionLabel="Explore Groceries"
            onAction={() => router.push('/')}
          />
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          renderItem={({ item }) => {
            const p = item.product;
            const imgUri = p.primaryImage || (p.images && p.images[0]) || '';
            const isOutOfStock = p.stock <= 0;

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() => router.push(`/product/${p.slug}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageContainer}>
                    {imgUri ? (
                      <Image
                        source={{ uri: imgUri }}
                        style={styles.productImg}
                        contentFit="contain"
                      />
                    ) : (
                      <View style={styles.placeholderImg}>
                        <Icon name="Package" size={32} color="#94a3b8" />
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => handleRemove(p.id)}
                      style={styles.heartBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Remove from wishlist"
                    >
                      <Icon name="Heart" size={16} color="#ef4444" fill="#ef4444" />
                    </TouchableOpacity>

                    {p.isFresh && (
                      <View style={styles.freshBadge}>
                        <Badge label="Fresh" variant="fresh" size="sm" />
                      </View>
                    )}
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    {p.unit ? <Text style={styles.unitText}>{p.unit}</Text> : null}

                    <View style={styles.priceRow}>
                      <Price
                        amount={p.salePrice ?? p.price}
                        originalAmount={p.salePrice ? p.price : undefined}
                        size="sm"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.actionSection}>
                  <Button
                    title={isOutOfStock ? 'Out of Stock' : 'Move to Bag'}
                    variant={isOutOfStock ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={isOutOfStock}
                    onPress={() => handleMoveToCart(item)}
                  />
                </View>
              </View>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    padding: 10,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8fafc',
    borderRadius: Radius.md,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImg: {
    width: '90%',
    height: '90%',
  },
  placeholderImg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  freshBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  infoBox: {
    marginTop: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    minHeight: 34,
  },
  unitText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  priceRow: {
    marginTop: 4,
    marginBottom: 6,
  },
  actionSection: {
    marginTop: 4,
  },
});
