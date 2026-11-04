import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export interface ReturnPhotoUploaderProps {
  images: string[];
  onChangeImages: (images: string[]) => void;
  maxImages?: number;
}

export function ReturnPhotoUploader({
  images,
  onChangeImages,
  maxImages = 4,
}: ReturnPhotoUploaderProps) {
  const handlePickPhoto = async () => {
    if (images.length >= maxImages) {
      toast.warning('Limit Reached', `You can attach up to ${maxImages} evidence photos`);
      return;
    }

    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri;
        if (uri) {
          haptics.selection();
          onChangeImages([...images, uri]);
        }
      }
    } catch {
      toast.error('Error', 'Could not access photo library');
    }
  };

  const handleRemove = (index: number) => {
    haptics.light();
    onChangeImages(images.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Photographic Evidence ({images.length}/{maxImages})
      </Text>
      <Text style={styles.hint}>
        Please attach clear photos showing damaged, expired, or incorrect products.
      </Text>

      <View style={styles.photosRow}>
        {images.map((uri, idx) => (
          <View key={idx} style={styles.thumbWrapper}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            <TouchableOpacity
              onPress={() => handleRemove(idx)}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Icon name="X" size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < maxImages && (
          <TouchableOpacity
            onPress={handlePickPhoto}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Add return photo"
          >
            <Icon name="Camera" size={22} color="#0b6234" />
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  hint: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
  },
  deleteBtn: {
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
  addBtn: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0b6234',
  },
});
