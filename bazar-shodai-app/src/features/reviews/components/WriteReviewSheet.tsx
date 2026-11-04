import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { useCreateReview } from '../api/reviewsApi';

export interface WriteReviewSheetProps {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
}

export function WriteReviewSheet({
  visible,
  productId,
  productName,
  onClose,
}: WriteReviewSheetProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const createReviewMutation = useCreateReview(productId);

  const handlePickImage = async () => {
    if (images.length >= 5) {
      toast.warning('Limit reached', 'You can attach up to 5 photos');
      return;
    }

    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri;
        if (uri) {
          setImages((prev) => [...prev, uri]);
          haptics.selection();
        }
      }
    } catch {
      toast.error('Error', 'Could not open image gallery');
    }
  };

  const handleRemoveImage = (index: number) => {
    haptics.light();
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.warning('Rating required', 'Please select a star rating');
      return;
    }

    if (!comment.trim()) {
      toast.warning('Review required', 'Please write a brief description of your experience');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: images.length > 0 ? images : undefined,
      });

      toast.success('Review Submitted', 'Thank you for your valuable feedback!');
      haptics.success();
      setTitle('');
      setComment('');
      setImages([]);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit review. Please try again.';
      toast.error('Submission failed', msg);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Write a Review</Text>
              <Text style={styles.productSubtitle} numberOfLines={1}>
                {productName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="X" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Star Picker */}
            <View style={styles.ratingSection}>
              <Text style={styles.inputLabel}>Overall Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      haptics.selection();
                      setRating(star);
                    }}
                    style={styles.starTouch}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${star} stars`}
                  >
                    <Icon name="Star" size={32} color={star <= rating ? '#f59e0b' : '#d1d5db'} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingHint}>
                {rating === 5 && 'Outstanding! (৫ তারকা)'}
                {rating === 4 && 'Very Good (৪ তারকা)'}
                {rating === 3 && 'Average (৩ তারকা)'}
                {rating === 2 && 'Below Expectation (২ তারকা)'}
                {rating === 1 && 'Poor (১ তারকা)'}
              </Text>
            </View>

            {/* Headline */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Title (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Super fresh & crisp!"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
            </View>

            {/* Comment */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Detailed Feedback *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tell us what you liked about the freshness, taste, packaging..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              <Text style={styles.charCount}>{comment.length}/500</Text>
            </View>

            {/* Photos */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Add Photos ({images.length}/5)</Text>
              <View style={styles.photosRow}>
                {images.map((uri, idx) => (
                  <View key={idx} style={styles.photoThumbContainer}>
                    <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(idx)}
                      style={styles.removePhotoBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Icon name="X" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 5 && (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.addPhotoBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Upload review image"
                  >
                    <Icon name="Camera" size={20} color="#0b6234" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <Button
              title="Submit Review"
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              loading={createReviewMutation.isPending}
              disabled={createReviewMutation.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  productSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 16,
    gap: 16,
  },
  ratingSection: {
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  starTouch: {
    padding: 4,
  },
  ratingHint: {
    fontSize: 13,
    color: '#0b6234',
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 90,
  },
  charCount: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'right',
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoThumbContainer: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0b6234',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
});
