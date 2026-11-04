import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserProfile } from '@/features/auth/api/getProfile';
import { logoutApi } from '@/features/auth/api/logout';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { haptics } from '@/services/haptics';
import { toast } from '@/store/useToastStore';
import { Radius } from '@/constants/layout';

export default function AccountScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Background sync profile when authenticated
  useUserProfile();

  const guestToken = getOrCreateGuestToken();
  const isStaffOrRider =
    isAuthenticated &&
    user &&
    (user.role === 'STAFF' ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      ((user as any).permissions &&
        Array.isArray((user as any).permissions) &&
        (user as any).permissions.includes('staff')));

  const handleAction = (_title: string, action: () => void) => {
    haptics.light();
    action();
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    try {
      await logoutApi();
      haptics.success();
      toast.info('Logged Out', 'You are now browsing as a guest');
    } catch {
      toast.error('Logout error', 'Session reset locally');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          {isAuthenticated && user ? (
            <View>
              <View style={styles.profileTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {isStaffOrRider && <Badge label="Staff / Rider" variant="fresh" size="sm" />}
                  </View>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                  {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
                </View>
              </View>

              <View style={styles.statsRow}>
                <TouchableOpacity
                  onPress={() => router.push('/(account)/rewards')}
                  style={styles.statCol}
                >
                  <Text style={styles.statNumber}>{user.loyaltyPoints ?? 0}</Text>
                  <Text style={styles.statLabel}>Reward Points</Text>
                </TouchableOpacity>

                <View style={styles.statDivider} />

                <TouchableOpacity onPress={() => router.push('/orders')} style={styles.statCol}>
                  <Text style={styles.statNumber}>{user.totalOrders ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </TouchableOpacity>

                <View style={styles.statDivider} />

                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/wishlist')}
                  style={styles.statCol}
                >
                  <Text style={styles.statNumber}>View</Text>
                  <Text style={styles.statLabel}>Wishlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.profileTopRow}>
                <View style={styles.avatarCircleGuest}>
                  <Icon name="User" size={24} color={isDark ? '#45a22c' : '#0b6234'} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>Guest Customer</Text>
                  <Text style={styles.guestToken} numberOfLines={1}>
                    ID: {guestToken.slice(0, 16)}...
                  </Text>
                </View>
              </View>
              <Button
                title="Sign In / Register"
                variant="primary"
                size="md"
                onPress={() => router.push('/(auth)/login')}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </Card>

        {/* Section: Orders & Returns */}
        <Text style={styles.groupHeader}>Orders & Returns</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            onPress={() => handleAction('Orders', () => router.push('/orders'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="Package" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>My Orders</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => handleAction('Returns', () => router.push('/(account)/returns'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="RotateCcw" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>Returns & Refund Claims</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Section: Personal & Delivery */}
        <Text style={styles.groupHeader}>Personal & Delivery</Text>
        <View style={styles.menuCard}>
          {isAuthenticated && (
            <>
              <TouchableOpacity
                onPress={() =>
                  handleAction('Edit Profile', () => router.push('/(account)/edit-profile'))
                }
                style={styles.menuRow}
              >
                <View style={styles.menuIconBox}>
                  <Icon name="User" size={18} color="#0b6234" />
                </View>
                <Text style={styles.menuTitle}>Edit Profile</Text>
                <Icon name="ChevronRight" size={16} color="#94a3b8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
            </>
          )}

          <TouchableOpacity
            onPress={() => handleAction('Addresses', () => router.push('/(account)/addresses'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="MapPin" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>Saved Delivery Addresses</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => handleAction('Rewards', () => router.push('/(account)/rewards'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="Award" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>Loyalty Reward Points</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => handleAction('Wishlist', () => router.push('/(tabs)/wishlist'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="Heart" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>My Wishlist</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Section: Staff / Rider Portal (Conditionally shown) */}
        {isStaffOrRider && (
          <>
            <Text style={styles.groupHeader}>Staff & Rider Mode</Text>
            <View style={[styles.menuCard, styles.riderCard]}>
              <TouchableOpacity
                onPress={() =>
                  handleAction('Rider Portal', () => router.push('/(rider)/deliveries'))
                }
                style={styles.menuRow}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
                  <Icon name="Bike" size={18} color="#b45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { fontWeight: '700', color: '#92400e' }]}>
                    Delivery Rider Dashboard
                  </Text>
                  <Text style={{ fontSize: 11, color: '#b45309' }}>
                    Active dropoffs, navigation, COD reconciliation
                  </Text>
                </View>
                <Icon name="ChevronRight" size={16} color="#b45309" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Section: Customer Care & Support */}
        <Text style={styles.groupHeader}>Support & Assistance</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            onPress={() => handleAction('Support Tickets', () => router.push('/(account)/support'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="HelpCircle" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>Customer Care Tickets</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => handleAction('Contact', () => router.push('/contact'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="PhoneCall" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>Contact & Hotline</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => handleAction('Notifications', () => router.push('/notifications'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="Bell" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Section: Preferences & Security */}
        <Text style={styles.groupHeader}>Preferences & Security</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            onPress={() => handleAction('Settings', () => router.push('/(account)/settings'))}
            style={styles.menuRow}
          >
            <View style={styles.menuIconBox}>
              <Icon name="Settings" size={18} color="#0b6234" />
            </View>
            <Text style={styles.menuTitle}>App Settings & Biometrics</Text>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {isAuthenticated && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                onPress={() =>
                  handleAction('Change Password', () => router.push('/(account)/change-password'))
                }
                style={styles.menuRow}
              >
                <View style={styles.menuIconBox}>
                  <Icon name="KeyRound" size={18} color="#0b6234" />
                </View>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Icon name="ChevronRight" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <Button
            title="Log Out"
            variant="outline"
            size="md"
            loading={isLoggingOut}
            onPress={() => setShowLogoutConfirm(true)}
            style={{ marginTop: 8 }}
          />
        )}

        {/* App Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerVersion}>Bazar Shodai Mobile • v1.0.0</Text>
          <Text style={styles.footerSub}>Designed for Shahrasti, Chandpur</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log Out?"
        message="Are you sure you want to log out? Your cart items will remain saved."
        confirmLabel="Log Out"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  profileCard: {
    padding: 16,
    borderRadius: Radius.lg,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarCircleGuest: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  guestToken: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b6234',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  riderCard: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 56,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerVersion: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
});
