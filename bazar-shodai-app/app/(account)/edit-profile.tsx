import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useAuthStore } from '@/store/useAuthStore';
import { useUpdateProfile } from '@/features/account/api/accountApi';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [language, setLanguage] = useState<'bn' | 'en'>('en');

  const handlePickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri;
        if (uri) {
          haptics.selection();
          setAvatarUri(uri);
        }
      }
    } catch {
      toast.error('Error', 'Could not open image gallery');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Validation Error', 'Full name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Validation Error', 'Phone number is required');
      return;
    }

    updateProfile(
      {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        language,
      },
      {
        onSuccess: () => {
          haptics.success();
          toast.success('Profile Updated', 'Your profile details have been saved successfully.');
          router.back();
        },
        onError: (err: unknown) => {
          haptics.error();
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to update profile. Please try again.';
          toast.error('Update Failed', msg);
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickAvatar}
                style={styles.cameraBtn}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
              >
                <Icon name="Camera" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tap camera to update avatar picture</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="017XXXXXXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Preferred Language</Text>
              <View style={styles.langRow}>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    setLanguage('en');
                  }}
                  style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                >
                  <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                    English
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    setLanguage('bn');
                  }}
                  style={[styles.langBtn, language === 'bn' && styles.langBtnActive]}
                >
                  <Text style={[styles.langText, language === 'bn' && styles.langTextActive]}>
                    বাংলা (Bengali)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <Button
              title="Save Changes"
              variant="primary"
              size="lg"
              loading={isPending}
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
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
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  langBtnActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  langTextActive: {
    color: '#0b6234',
  },
  saveSection: {
    marginTop: 8,
  },
});
