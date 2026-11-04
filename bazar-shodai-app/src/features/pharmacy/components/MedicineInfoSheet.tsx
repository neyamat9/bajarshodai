import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { MedicineMetaData } from '../types';

export interface MedicineInfoSheetProps {
  visible: boolean;
  medicineName: string;
  meta?: MedicineMetaData;
  price?: number;
  onClose: () => void;
  onAddToCart?: () => void;
  onUploadPrescription?: () => void;
}

export function MedicineInfoSheet({
  visible,
  medicineName,
  meta,
  price,
  onClose,
  onAddToCart,
  onUploadPrescription,
}: MedicineInfoSheetProps) {
  const isRx = meta?.isPrescriptionRequired ?? false;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.medicineName} numberOfLines={1}>
                {medicineName}
              </Text>
              {meta?.strength && (
                <Text style={styles.medicineStrength}>
                  {meta.strength} • {meta.dosageForm || 'Dosage'}
                </Text>
              )}
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

          {/* Rx Mandatory Banner */}
          {isRx && (
            <View style={styles.rxBanner}>
              <Icon name="AlertTriangle" size={18} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rxBannerTitle}>
                  Prescription Required (প্রেসক্রিপশন আবশ্যক)
                </Text>
                <Text style={styles.rxBannerText}>
                  This is a schedule pharmaceutical product. Please upload a valid doctor
                  prescription.
                </Text>
              </View>
            </View>
          )}

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Meta tags */}
            <View style={styles.tagsRow}>
              {isRx ? (
                <Badge label="Rx REQUIRED" variant="tomato" size="sm" />
              ) : (
                <Badge label="OTC MEDICINE" variant="fresh" size="sm" />
              )}
              {meta?.manufacturer && (
                <Badge label={meta.manufacturer} variant="neutral" size="sm" />
              )}
            </View>

            {/* Generic Name */}
            {meta?.genericName && (
              <View style={styles.infoBox}>
                <Text style={styles.sectionLabel}>Generic Compound</Text>
                <Text style={styles.genericText}>{meta.genericName}</Text>
              </View>
            )}

            {/* Indications */}
            <View style={styles.infoBox}>
              <Text style={styles.sectionLabel}>Indications / ব্যবহারের কারণ</Text>
              <Text style={styles.sectionBody}>
                {meta?.indications ||
                  'Used for rapid relief of mild to moderate fever, headaches, body pain, and influenza symptoms.'}
              </Text>
            </View>

            {/* Precautions */}
            <View style={styles.infoBox}>
              <Text style={styles.sectionLabel}>Precautions / সতর্কতা</Text>
              <Text style={styles.sectionBody}>
                {meta?.precautions ||
                  'Consult your registered doctor before usage if you have pre-existing liver conditions, kidney disorders, or pregnancy.'}
              </Text>
            </View>

            {/* Side effects */}
            <View style={styles.infoBox}>
              <Text style={styles.sectionLabel}>Common Side Effects / পার্শ্বপ্রতিক্রিয়া</Text>
              <Text style={styles.sectionBody}>
                {meta?.sideEffects ||
                  'Generally well-tolerated. Rare mild symptoms may include nausea, slight dizziness, or gastric irritation.'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            {isRx ? (
              <Button
                title="Upload Doctor Prescription"
                variant="primary"
                size="lg"
                onPress={() => {
                  onClose();
                  onUploadPrescription?.();
                }}
                leftIcon={<Icon name="FileText" size={18} color="#ffffff" />}
              />
            ) : (
              <Button
                title={`Add to Bag • ৳${(price ?? 35).toFixed(0)}`}
                variant="primary"
                size="lg"
                onPress={() => {
                  onClose();
                  onAddToCart?.();
                }}
                leftIcon={<Icon name="ShoppingBag" size={18} color="#ffffff" />}
              />
            )}
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
    maxHeight: '85%',
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
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  medicineStrength: {
    fontSize: 13,
    color: '#0b6234',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  rxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rxBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  rxBannerText: {
    fontSize: 11,
    color: '#991b1b',
    marginTop: 2,
  },
  body: {
    maxHeight: 380,
  },
  bodyContent: {
    padding: 16,
    gap: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  genericText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b6234',
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
});
