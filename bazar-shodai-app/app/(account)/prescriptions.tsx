import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import {
  useCustomerPrescriptions,
  useDeletePrescription,
} from '@/features/pharmacy/api/pharmacyApi';
import { PrescriptionRecord } from '@/features/pharmacy/types';
import { PrescriptionViewerModal } from '@/features/pharmacy/components/PrescriptionViewerModal';
import { PrescriptionOrderButton } from '@/features/pharmacy/components/PrescriptionOrderButton';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function CustomerPrescriptionsScreen() {
  const router = useRouter();
  const [selectedRx, setSelectedRx] = useState<PrescriptionRecord | null>(null);

  const { data: prescriptions = [], isLoading, refetch, isRefetching } = useCustomerPrescriptions();
  const deleteMutation = useDeletePrescription();

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              toast.info('Deleted', 'Prescription removed');
              haptics.selection();
            } catch {
              toast.error('Error', 'Could not delete prescription');
            }
          },
        },
      ],
    );
  };

  const getStatusVariant = (status: PrescriptionRecord['status']) => {
    switch (status) {
      case 'REVIEWED':
      case 'ORDER_CREATED':
        return 'fresh';
      case 'REJECTED':
        return 'tomato';
      case 'PENDING':
      default:
        return 'carrot';
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
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <TouchableOpacity
          onPress={() => router.push('/prescription/upload')}
          style={styles.uploadBtn}
          accessibilityRole="button"
          accessibilityLabel="Upload prescription"
        >
          <Icon name="Plus" size={22} color="#0b6234" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            colors={['#0b6234']}
            tintColor="#0b6234"
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.rxCard}>
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                setSelectedRx(item);
              }}
              style={styles.cardHeader}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.rxThumb} contentFit="cover" />
              <View style={styles.rxMetaCol}>
                <View style={styles.topRow}>
                  <Text style={styles.rxId}>RX #{item.id.slice(0, 8).toUpperCase()}</Text>
                  <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
                </View>
                <Text style={styles.rxDate}>
                  Uploaded: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.notes ? (
                  <Text style={styles.rxNotes} numberOfLines={2}>
                    Note: {item.notes}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>

            {/* Admin notes if reviewed */}
            {item.adminNotes ? (
              <View style={styles.adminNoteBox}>
                <Text style={styles.adminNoteLabel}>Pharmacist Feedback:</Text>
                <Text style={styles.adminNoteText}>{item.adminNotes}</Text>
              </View>
            ) : null}

            {/* Action Bar */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setSelectedRx(item);
                }}
                style={styles.viewBtn}
              >
                <Icon name="Eye" size={14} color="#0b6234" />
                <Text style={styles.viewBtnText}>View Full Scan</Text>
              </TouchableOpacity>

              <View style={styles.rightActions}>
                {item.status === 'PENDING' && (
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Delete"
                  >
                    <Icon name="Trash2" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}

                <PrescriptionOrderButton prescription={item} />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#0b6234" size="small" />
              <Text style={styles.emptyText}>Loading your prescriptions...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="FileText" size={44} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Prescriptions Uploaded</Text>
              <Text style={styles.emptyText}>
                Upload a doctor&apos;s prescription to order verified pharmaceuticals safely.
              </Text>
              <Button
                title="Upload Prescription"
                variant="primary"
                size="md"
                onPress={() => router.push('/prescription/upload')}
                leftIcon={<Icon name="Camera" size={16} color="#ffffff" />}
                className="mt-4"
              />
            </View>
          )
        }
      />

      {/* Fullscreen Viewer Modal */}
      <PrescriptionViewerModal
        visible={Boolean(selectedRx)}
        prescription={selectedRx}
        onClose={() => setSelectedRx(null)}
      />
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
  uploadBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  rxCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  rxThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: '#f3f4f6',
  },
  rxMetaCol: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rxId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  rxDate: {
    fontSize: 11,
    color: '#6b7280',
  },
  rxNotes: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  adminNoteBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: Radius.sm,
    padding: 10,
  },
  adminNoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  adminNoteText: {
    fontSize: 12,
    color: '#047857',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
