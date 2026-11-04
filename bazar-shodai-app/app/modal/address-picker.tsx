import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

const SHAHRASHTI_AREAS = [
  { id: '1', name: 'Shahrasti Sadar / Bazar', union: 'Municipality', fee: 0 },
  { id: '2', name: 'Meher Kalibari', union: 'Meher North', fee: 20 },
  { id: '3', name: 'Thakurbazar & Railway Station', union: 'Meher South', fee: 20 },
  { id: '4', name: 'Suchipara Bazar', union: 'Suchipara North', fee: 30 },
  { id: '5', name: 'Chitoshi Bazar', union: 'Chitoshi East', fee: 30 },
  { id: '6', name: 'Tamta & Waruk', union: 'Tamta South', fee: 30 },
  { id: '7', name: 'Rayshree Bazar', union: 'Rayshree South', fee: 40 },
];

export default function AddressPickerModal() {
  const router = useRouter();
  const [selectedAreaId, setSelectedAreaId] = useState('1');

  const handleSelect = (area: (typeof SHAHRASHTI_AREAS)[number]) => {
    haptics.selection();
    setSelectedAreaId(area.id);
  };

  const handleConfirm = () => {
    const chosen = SHAHRASHTI_AREAS.find((a) => a.id === selectedAreaId);
    toast.success('Location Selected', `Delivery zone set to ${chosen?.name ?? 'Shahrasti'}`);
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Modal Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Text className="text-base font-bold text-foreground">Select Delivery Location</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Close location modal"
        >
          <Icon name="X" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xs text-muted-foreground mb-3">
          Choose your local area in Shahrasti for accurate delivery timing and charges:
        </Text>

        <View className="bg-card rounded-brand border border-border overflow-hidden mb-6">
          {SHAHRASHTI_AREAS.map((area, index) => {
            const isSelected = area.id === selectedAreaId;
            return (
              <TouchableOpacity
                key={area.id}
                onPress={() => handleSelect(area)}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between p-4 ${
                  index !== SHAHRASHTI_AREAS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center ${
                      isSelected ? 'border-brand-fresh bg-brand-fresh' : 'border-muted-foreground'
                    }`}
                  >
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-foreground">{area.name}</Text>
                    <Text className="text-xs text-muted-foreground">{area.union}</Text>
                  </View>
                </View>

                <Text className="text-xs font-semibold text-brand-fresh">
                  {area.fee === 0 ? 'FREE' : `৳${area.fee}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button title="Confirm Delivery Zone" variant="primary" size="lg" onPress={handleConfirm} />
      </ScrollView>
    </SafeAreaView>
  );
}
