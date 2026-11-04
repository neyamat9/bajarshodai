import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { PrescriptionRecord } from '../types';

export interface PrescriptionViewerModalProps {
  visible: boolean;
  prescription: PrescriptionRecord | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export function PrescriptionViewerModal({
  visible,
  prescription,
  onClose,
}: PrescriptionViewerModalProps) {
  if (!prescription) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.headerTitle}>Prescription Scan</Text>
            <Text style={styles.headerDate}>
              Uploaded {new Date(prescription.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close viewer"
          >
            <Icon name="X" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Center Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: prescription.imageUrl }}
            style={styles.fullImage}
            contentFit="contain"
            transition={300}
          />
        </View>

        {/* Footer info */}
        <View style={styles.bottomBar}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Verification Status:</Text>
            <Badge
              label={prescription.status}
              variant={
                prescription.status === 'REVIEWED' || prescription.status === 'ORDER_CREATED'
                  ? 'fresh'
                  : prescription.status === 'REJECTED'
                    ? 'tomato'
                    : 'carrot'
              }
              size="sm"
            />
          </View>

          {prescription.adminNotes ? (
            <View style={styles.adminNoteBox}>
              <Text style={styles.adminNoteLabel}>Pharmacist Notes:</Text>
              <Text style={styles.adminNoteText}>{prescription.adminNotes}</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>
              Our registered pharmacist reviews uploaded prescriptions within 15-30 minutes.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width,
    height: height * 0.7,
  },
  bottomBar: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '500',
  },
  adminNoteBox: {
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  adminNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 2,
  },
  adminNoteText: {
    fontSize: 13,
    color: '#f9fafb',
    lineHeight: 18,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
});
