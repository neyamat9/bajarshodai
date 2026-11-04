import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function PrescriptionModal() {
  const router = useRouter();

  const handleUploadPlaceholder = () => {
    haptics.selection();
    toast.info('Prescription Upload', 'Camera / Gallery picker triggered');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Modal Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Text className="text-base font-bold text-foreground">
          Upload Doctor&apos;s Prescription
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Close prescription modal"
        >
          <Icon name="X" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Need prescribed OTC or regular medicine? Upload a clear picture of your doctor&apos;s
          prescription and our licensed pharmacist in Shahrasti will verify and prepare your order.
        </Text>

        <TouchableOpacity
          onPress={handleUploadPlaceholder}
          activeOpacity={0.8}
          className="border-2 border-dashed border-brand-fresh/40 bg-card rounded-brand p-8 items-center justify-center mb-6"
        >
          <View className="w-14 h-14 rounded-full bg-brand-fresh/15 items-center justify-center mb-3">
            <Icon name="UploadCloud" size={28} color="#0b6234" />
          </View>
          <Text className="text-sm font-bold text-foreground mb-1">
            Tap to upload prescription image
          </Text>
          <Text className="text-xs text-muted-foreground text-center">
            Supports JPG, PNG or PDF (Max 10MB)
          </Text>
        </TouchableOpacity>

        <View className="bg-card rounded-brand p-4 border border-border mb-6">
          <Text className="text-xs font-bold text-foreground mb-2">Prescription Guidelines:</Text>
          <Text className="text-xs text-muted-foreground mb-1">
            • Doctor&apos;s name, degree, and BMDC number should be visible
          </Text>
          <Text className="text-xs text-muted-foreground mb-1">
            • Patient name and date must be readable
          </Text>
          <Text className="text-xs text-muted-foreground">• Avoid blurry or cropped photos</Text>
        </View>

        <Button
          title="Submit for Verification"
          variant="primary"
          size="lg"
          onPress={() => {
            toast.success('Received', 'Prescription submitted for review');
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
