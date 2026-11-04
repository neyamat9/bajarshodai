import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      toast.error('Invalid Phone', 'Please enter a valid 10-digit mobile number');
      return;
    }

    haptics.selection();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('OTP Sent', `Verification code sent to +880 ${phoneNumber}`);
    }, 600);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground">Sign In</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="items-center my-6">
          <View className="w-16 h-16 rounded-full bg-brand-fresh/15 items-center justify-center mb-3">
            <Icon name="ShoppingBag" size={32} color="#0b6234" />
          </View>
          <Text className="text-2xl font-bold text-brand-deep dark:text-brand-fresh">
            বাজার সদাই
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            Sign in to track orders, save addresses, and earn rewards
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold text-foreground mb-2">
            Mobile Number (Bangladesh)
          </Text>
          <PhoneInput
            value={phoneNumber}
            onChangePhone={setPhoneNumber}
            helperText="Enter 10-digit number without country code"
          />
        </View>

        <Button
          title="Send Verification Code"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleSendOtp}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
