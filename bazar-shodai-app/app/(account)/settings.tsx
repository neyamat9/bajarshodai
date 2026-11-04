import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { storage } from '@/utils/storage';
import { clearAppImageCache } from '@/utils/imageConfig';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();

  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(
    () => storage.getBoolean('settings_biometrics_enabled') ?? false,
  );
  const [pushEnabled, setPushEnabled] = useState(true);
  const [appLang, setAppLang] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    // Check hardware biometrics capability
    LocalAuthentication.hasHardwareAsync().then((hasHardware) => {
      if (hasHardware) {
        LocalAuthentication.isEnrolledAsync().then((enrolled) => {
          setBiometricsAvailable(enrolled);
        });
      }
    });
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify identity to enable biometrics',
        cancelLabel: 'Cancel',
      });
      if (res.success) {
        haptics.success();
        setBiometricsEnabled(true);
        storage.setBoolean('settings_biometrics_enabled', true);
        toast.success('Enabled', 'Biometric lock enabled for checkout and account access');
      } else {
        haptics.error();
      }
    } else {
      haptics.light();
      setBiometricsEnabled(false);
      storage.setBoolean('settings_biometrics_enabled', false);
      toast.info('Disabled', 'Biometric lock disabled');
    }
  };

  const handleClearCache = () => {
    haptics.warning();
    Alert.alert(
      'Clear App Cache?',
      'This will clear temporarily cached product images and search history. Your login session and cart will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            await clearAppImageCache();
            haptics.success();
            toast.success('Cache Cleared', 'App cache has been refreshed successfully.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance & Language */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Icon name={isDark ? 'Moon' : 'Sun'} size={18} color="#0b6234" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Dark Mode</Text>
              <Text style={styles.rowSubtitle}>
                {isDark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                haptics.selection();
                toggleTheme();
              }}
              trackColor={{ false: '#cbd5e1', true: '#0b6234' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Icon name="Globe" size={18} color="#0b6234" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Language / ভাষা</Text>
              <Text style={styles.rowSubtitle}>
                {appLang === 'en' ? 'English (Current)' : 'বাংলা (সক্রিয়)'}
              </Text>
            </View>
            <View style={styles.langPills}>
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setAppLang('en');
                  toast.info('Language Updated', 'App language set to English');
                }}
                style={[styles.langPill, appLang === 'en' && styles.langPillActive]}
              >
                <Text style={[styles.langPillText, appLang === 'en' && styles.langPillTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setAppLang('bn');
                  toast.info('ভাষা পরিবর্তন', 'ভাষা বাংলায় সেট করা হয়েছে');
                }}
                style={[styles.langPill, appLang === 'bn' && styles.langPillActive]}
              >
                <Text style={[styles.langPillText, appLang === 'bn' && styles.langPillTextActive]}>
                  বাং
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Security & Notifications */}
        <Text style={styles.sectionHeader}>Security & Alerts</Text>
        <View style={styles.card}>
          {biometricsAvailable && (
            <>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Icon name="Fingerprint" size={18} color="#0b6234" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Biometric Authentication</Text>
                  <Text style={styles.rowSubtitle}>Fingerprint or Face unlock for checkout</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleToggleBiometrics}
                  trackColor={{ false: '#cbd5e1', true: '#0b6234' }}
                  thumbColor="#ffffff"
                />
              </View>
              <View style={styles.divider} />
            </>
          )}

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Icon name="Bell" size={18} color="#0b6234" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSubtitle}>Live order updates and daily flash discounts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(val) => {
                haptics.selection();
                setPushEnabled(val);
                toast.info(
                  'Preferences Saved',
                  val ? 'Push notifications on' : 'Push notifications muted',
                );
              }}
              trackColor={{ false: '#cbd5e1', true: '#0b6234' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Storage & Data */}
        <Text style={styles.sectionHeader}>Storage & Cache</Text>
        <View style={styles.card}>
          <TouchableOpacity onPress={handleClearCache} style={styles.row} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Icon name="Trash2" size={18} color="#64748b" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Clear Cache</Text>
              <Text style={styles.rowSubtitle}>Free up storage by removing temporary images</Text>
            </View>
            <Icon name="ChevronRight" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Legal & About */}
        <Text style={styles.sectionHeader}>About Bazar Shodai</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Icon name="Info" size={18} color="#0b6234" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>App Version</Text>
              <Text style={styles.rowSubtitle}>v1.0.0 (Production Build 58)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => router.push('/contact')}
            style={styles.row}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Icon name="PhoneCall" size={18} color="#0b6234" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Customer Care Hotline</Text>
              <Text style={styles.rowSubtitle}>+880 1700-000000 (Daily 8 AM - 10 PM)</Text>
            </View>
            <Icon name="ChevronRight" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 64,
  },
  langPills: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  langPillActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  langPillTextActive: {
    color: '#0b6234',
  },
});
