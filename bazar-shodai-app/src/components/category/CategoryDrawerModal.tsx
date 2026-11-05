import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { AppImage } from '@/components/ui/AppImage';
import { useHomeCategories } from '@/features/home/api/useHomeData';
import { HomeCategoryData } from '@/features/home/types';
import { haptics } from '@/services/haptics';

export interface CategoryDrawerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CategoryDrawerModal({ visible, onClose }: CategoryDrawerModalProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.85, 360);

  const [slideAnim] = useState(() => new Animated.Value(-drawerWidth));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  const { data: rawCategories = [] } = useHomeCategories();
  const categories: HomeCategoryData[] = Array.isArray(rawCategories) ? rawCategories : [];

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-drawerWidth);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth, slideAnim, opacityAnim]);

  const handleDismiss = () => {
    haptics.light();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const toggleExpand = (catId: string) => {
    haptics.selection();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleNavigateCategory = (slug: string) => {
    haptics.light();
    handleDismiss();
    router.push({
      pathname: '/(tabs)/categories',
      params: { category: slug },
    });
  };

  const handleQuickNav = (path: string) => {
    haptics.light();
    handleDismiss();
    router.push(path as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { width: drawerWidth, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconBadge}>
                  <Icon name="LayoutGrid" size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>ক্যাটাগরি সমূহ</Text>
                  <Text style={styles.headerSubtitle}>
                    {categories.length > 0 ? `${categories.length} টি ক্যাটাগরি` : 'All Categories'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon name="X" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Quick Links: Popular, Offers, New Arrivals */}
            <View style={styles.quickLinksRow}>
              <TouchableOpacity
                onPress={() => handleQuickNav('/search?sortBy=popular')}
                style={styles.quickLinkItem}
                activeOpacity={0.7}
              >
                <Icon name="Flame" size={18} color="#ea580c" />
                <Text style={styles.quickLinkLabel}>জনপ্রিয়</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickNav('/search?onSale=true')}
                style={styles.quickLinkItem}
                activeOpacity={0.7}
              >
                <Icon name="Tag" size={18} color="#dc2626" />
                <Text style={styles.quickLinkLabel}>অফার সমূহ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickNav('/search?sortBy=newest')}
                style={styles.quickLinkItem}
                activeOpacity={0.7}
              >
                <Icon name="Sparkles" size={18} color="#0b6234" />
                <Text style={styles.quickLinkLabel}>নতুন পণ্য</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Categories List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {categories.map((cat) => {
                const hasChildren =
                  (cat.children && cat.children.length > 0) ||
                  (cat.subCategories && cat.subCategories.length > 0);
                const subItems = cat.children || cat.subCategories || [];
                const isExpanded = !!expandedCategories[cat.id];

                return (
                  <View key={cat.id} style={styles.categoryItemWrapper}>
                    <TouchableOpacity
                      onPress={() => handleNavigateCategory(cat.slug)}
                      style={styles.categoryRow}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryImgSlot}>
                        <AppImage
                          source={cat.image || cat.icon}
                          aspectRatio={1}
                          borderRadius={18}
                        />
                      </View>

                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{cat.nameBn || cat.name}</Text>
                        {cat.productCount !== undefined && (
                          <Text style={styles.productCountText}>
                            {cat.productCount} টি পণ্য
                          </Text>
                        )}
                      </View>

                      {hasChildren ? (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleExpand(cat.id);
                          }}
                          style={styles.expandBtn}
                        >
                          <Icon
                            name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                            size={18}
                            color="#6b7280"
                          />
                        </TouchableOpacity>
                      ) : (
                        <Icon name="ChevronRight" size={16} color="#9ca3af" />
                      )}
                    </TouchableOpacity>

                    {/* Expandable Subcategories */}
                    {hasChildren && isExpanded && (
                      <View style={styles.subCategoryContainer}>
                        {subItems.map((sub: any) => (
                          <TouchableOpacity
                            key={sub.id || sub.slug}
                            onPress={() => handleNavigateCategory(sub.slug)}
                            style={styles.subCategoryRow}
                            activeOpacity={0.7}
                          >
                            <View style={styles.subBullet} />
                            <Text style={styles.subCategoryName}>
                              {sub.nameBn || sub.name}
                            </Text>
                            {sub.productCount !== undefined && (
                              <Text style={styles.subCountText}>({sub.productCount})</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => handleQuickNav('/(tabs)/categories')}
                style={styles.browseAllBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.browseAllBtnText}>সব পণ্য দেখুন</Text>
                <Icon name="ArrowRight" size={16} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.footerLinksRow}>
                <TouchableOpacity
                  onPress={() => handleQuickNav('/support')}
                  style={styles.footerLink}
                >
                  <Icon name="LifeBuoy" size={14} color="#6b7280" />
                  <Text style={styles.footerLinkText}>সাহায্য</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickNav('/support')}
                  style={styles.footerLink}
                >
                  <Icon name="Phone" size={14} color="#6b7280" />
                  <Text style={styles.footerLinkText}>যোগাযোগ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#0b6234',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinksRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  quickLinkItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickLinkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  scrollContent: {
    paddingVertical: 6,
  },
  categoryItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  categoryImgSlot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#edf3e8',
    overflow: 'hidden',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1f2937',
  },
  productCountText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  expandBtn: {
    padding: 6,
  },
  subCategoryContainer: {
    backgroundColor: '#f9fafb',
    paddingLeft: 46,
    paddingRight: 14,
    paddingVertical: 4,
  },
  subCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0b6234',
    marginRight: 8,
  },
  subCategoryName: {
    fontSize: 12.5,
    color: '#4b5563',
    flex: 1,
  },
  subCountText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  browseAllBtn: {
    backgroundColor: '#0b6234',
    paddingVertical: 11,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  browseAllBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  footerLinksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 5,
  },
  footerLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4b5563',
  },
});
