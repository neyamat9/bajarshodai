import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Radius } from '@/constants/layout';
import {
  useCustomerAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '@/features/account/api/accountApi';
import { UserAddress, CreateAddressPayload } from '@/features/account/types';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function AddressesScreen() {
  const router = useRouter();
  const { data: addresses = [], isLoading, refetch, isRefetching } = useCustomerAddresses();
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();
  const { mutate: deleteAddress } = useDeleteAddress();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [isDefault, setIsDefault] = useState(false);

  const openAddModal = () => {
    haptics.selection();
    setEditingId(null);
    setLabel('Home');
    setFullName('');
    setPhone('');
    setLine1('');
    setCity('Dhaka');
    setIsDefault(addresses.length === 0);
    setModalVisible(true);
  };

  const openEditModal = (addr: UserAddress) => {
    haptics.selection();
    setEditingId(addr.id);
    setLabel(addr.label || 'Home');
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setCity(addr.city || 'Dhaka');
    setIsDefault(addr.isDefault);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error('Validation Error', 'Recipient name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Validation Error', 'Phone number is required');
      return;
    }
    if (!line1.trim()) {
      toast.error('Validation Error', 'Street address / line 1 is required');
      return;
    }

    const payload: CreateAddressPayload = {
      label,
      fullName: fullName.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      city: city.trim(),
      isDefault,
    };

    if (editingId) {
      updateAddress(
        { id: editingId, payload },
        {
          onSuccess: () => {
            haptics.success();
            toast.success('Address Updated', 'Saved delivery address has been updated.');
            setModalVisible(false);
          },
          onError: () => {
            haptics.error();
            toast.error('Error', 'Failed to update address');
          },
        },
      );
    } else {
      createAddress(payload, {
        onSuccess: () => {
          haptics.success();
          toast.success('Address Added', 'New delivery address added successfully.');
          setModalVisible(false);
        },
        onError: () => {
          haptics.error();
          toast.error('Error', 'Failed to save address');
        },
      });
    }
  };

  const handleSetDefault = (addr: UserAddress) => {
    haptics.selection();
    updateAddress(
      { id: addr.id, payload: { isDefault: true } },
      {
        onSuccess: () => {
          toast.success(
            'Default Updated',
            `${addr.label || 'Address'} set as default delivery address.`,
          );
        },
      },
    );
  };

  const handleDelete = (addr: UserAddress) => {
    haptics.warning();
    deleteAddress(addr.id, {
      onSuccess: () => {
        haptics.success();
        toast.info('Address Removed', 'The address was removed from your address book.');
      },
      onError: () => {
        toast.error('Error', 'Could not delete address');
      },
    });
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
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
        >
          <Icon name="Plus" size={22} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="MapPin" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Addresses Saved</Text>
              <Text style={styles.emptyDesc}>
                Add your home or office address for fast, 1-tap checkout.
              </Text>
              <Button
                title="Add New Address"
                variant="primary"
                size="md"
                onPress={openAddModal}
                style={{ marginTop: 16 }}
              />
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.addrCard, item.isDefault && styles.addrCardDefault]}>
              <View style={styles.addrCardHeader}>
                <View style={styles.addrTagRow}>
                  <Badge
                    label={item.label || 'Home'}
                    variant={item.isDefault ? 'fresh' : 'neutral'}
                    size="sm"
                  />
                  {item.isDefault && <Text style={styles.defaultBadgeText}>Default Address</Text>}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Edit address"
                  >
                    <Icon name="Edit3" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Delete address"
                  >
                    <Icon name="Trash2" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.recipientName}>{item.fullName}</Text>
              <Text style={styles.recipientPhone}>{item.phone}</Text>
              <Text style={styles.addressLine}>{item.line1}</Text>
              {item.city && <Text style={styles.cityLine}>{item.city}</Text>}

              {!item.isDefault && (
                <TouchableOpacity
                  onPress={() => handleSetDefault(item)}
                  style={styles.setDefaultBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.setDefaultText}>Set as Default</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Icon name="X" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Tag Picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Address Label</Text>
                <View style={styles.tagsRow}>
                  {['Home', 'Office', 'Other'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        haptics.selection();
                        setLabel(t);
                      }}
                      style={[styles.tagPill, label === t && styles.tagPillActive]}
                    >
                      <Text style={[styles.tagText, label === t && styles.tagTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Recipient Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Neyamat Ullah"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number *</Text>
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
                <Text style={styles.fieldLabel}>Street Address / House / Road *</Text>
                <TextInput
                  style={styles.input}
                  value={line1}
                  onChangeText={setLine1}
                  placeholder="House 12, Road 4, Sector 7"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>City / Area</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Uttara, Dhaka"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setIsDefault(!isDefault);
                }}
                style={styles.defaultCheckboxRow}
                activeOpacity={0.7}
              >
                <Icon
                  name={isDefault ? 'CheckSquare' : 'Square'}
                  size={20}
                  color={isDefault ? '#0b6234' : '#9ca3af'}
                />
                <Text style={styles.checkboxLabel}>Make this my default delivery address</Text>
              </TouchableOpacity>

              <View style={styles.modalBtnRow}>
                <Button
                  title={editingId ? 'Update Address' : 'Save Address'}
                  variant="primary"
                  size="lg"
                  loading={isCreating || isUpdating}
                  onPress={handleSave}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: {
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
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  addrCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addrCardDefault: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  addrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addrTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  recipientPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  addressLine: {
    fontSize: 14,
    color: '#334155',
    marginTop: 6,
  },
  cityLine: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  setDefaultBtn: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  setDefaultText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0b6234',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  tagPillActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tagTextActive: {
    color: '#0b6234',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#334155',
  },
  modalBtnRow: {
    marginTop: 10,
    marginBottom: 20,
  },
});
