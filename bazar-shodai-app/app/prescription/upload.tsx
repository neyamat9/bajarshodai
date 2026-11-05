import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { useUploadPrescription } from '@/features/pharmacy/api/pharmacyApi';

export default function PrescriptionUploadScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useUploadPrescription();

  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.warning('Permission required', 'Camera access is needed to capture prescriptions');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri;
        if (uri) {
          setImageUri(uri);
          haptics.selection();
        }
      }
    } catch {
      toast.error('Error', 'Could not open camera');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri;
        if (uri) {
          setImageUri(uri);
          haptics.selection();
        }
      }
    } catch {
      toast.error('Error', 'Could not open photo gallery');
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      toast.warning(
        'Photo required',
        'Please take a photo or select an image of your prescription',
      );
      return;
    }

    if (!phone.trim() || phone.length < 11) {
      toast.warning(
        'Valid phone required',
        'Please enter a valid 11-digit Bangladeshi mobile number',
      );
      return;
    }

    try {
      setUploadProgress(0);
      await uploadMutation.mutateAsync({
        fileUri: imageUri,
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        onProgress: (pct) => setUploadProgress(pct),
      });

      haptics.success();
      toast.success(
        'Prescription Uploaded',
        'Our pharmacist is reviewing your prescription now. We will call you shortly!',
      );
      router.replace('/(account)/prescriptions');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not upload prescription. Please check connection.';
      toast.error('Upload Failed', msg);
    }
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
        <Text style={styles.headerTitle}>Upload Prescription</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Guidelines Card */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guidelineHeader}>
            <Icon name="HelpCircle" size={18} color="#0b6234" />
            <Text style={styles.guidelineTitle}>Valid Prescription Guidelines</Text>
          </View>
          <Text style={styles.guidelineItem}>
            • Ensure doctor&apos;s name and seal are clearly visible
          </Text>
          <Text style={styles.guidelineItem}>• Ensure medicine names & dosages are readable</Text>
          <Text style={styles.guidelineItem}>• Avoid glare, blurred photos, or extreme angles</Text>
        </View>

        {/* Photo Capture Area */}
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
            <TouchableOpacity
              onPress={() => setImageUri(null)}
              style={styles.removeImageBtn}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Icon name="Trash2" size={16} color="#ffffff" />
              <Text style={styles.removeImageText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptionsBox}>
            <TouchableOpacity
              onPress={handleCapturePhoto}
              style={styles.optionBtnPrimary}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Icon name="Camera" size={28} color="#ffffff" />
              </View>
              <Text style={styles.optionTitle}>Capture with Camera</Text>
              <Text style={styles.optionSubtitle}>Take a photo of physical prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={styles.optionBtnSecondary}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircleSec}>
                <Icon name="Image" size={24} color="#0b6234" />
              </View>
              <Text style={styles.optionTitleSec}>Upload from Gallery</Text>
              <Text style={styles.optionSubtitleSec}>Choose existing photo or document</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Contact Phone Number *</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefixText}>+880</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="17XXXXXXXX"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={
                phone.startsWith('+880')
                  ? phone.slice(4)
                  : phone.startsWith('0')
                    ? phone.slice(1)
                    : phone
              }
              onChangeText={(txt) => setPhone(`0${txt.replace(/\D/g, '')}`)}
              maxLength={11}
            />
          </View>
          <Text style={styles.helperText}>
            Our pharmacist will call this number to confirm dosage and brand preferences.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Additional Notes / Instructions (Optional)</Text>
          <TextInput
            style={[styles.phoneInput, styles.notesInput]}
            placeholder="e.g. Please dispense 10 days of Napa and 1 bottle of cough syrup."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Upload Progress Bar (0% - 100%) */}
        {uploadMutation.isPending && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressStatusText}>
                {uploadProgress < 100
                  ? 'প্রেসক্রিপশন আপলোড হচ্ছে...'
                  : 'যাচাই সম্পন্ন হচ্ছে...'}
              </Text>
              <Text style={styles.progressPercentText}>{uploadProgress}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(5, uploadProgress)}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title="Submit Prescription for Review"
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            loading={uploadMutation.isPending}
            disabled={uploadMutation.isPending || !imageUri}
            leftIcon={
              !uploadMutation.isPending ? (
                <Icon name="Check" size={18} color="#ffffff" />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  guidelinesCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    padding: 14,
    gap: 4,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guidelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  guidelineItem: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  uploadOptionsBox: {
    gap: 12,
  },
  optionBtnPrimary: {
    backgroundColor: '#0b6234',
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#dcfce7',
  },
  optionBtnSecondary: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  iconCircleSec: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  optionTitleSec: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  optionSubtitleSec: {
    fontSize: 12,
    color: '#6b7280',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    width: '100%',
    paddingVertical: 12,
  },
  removeImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 12,
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    minHeight: 80,
  },
  helperText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  progressBarTrack: {
    height: 8,
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0b6234',
    borderRadius: 4,
  },
  submitContainer: {
    marginTop: 8,
  },
});
