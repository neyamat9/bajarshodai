import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { changePasswordApi } from '@/features/auth/api/changePassword';
import { Radius, TouchTarget } from '@/constants/layout';
import { getErrorMessage } from '@/api/errorHandler';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.light();

      await changePasswordApi({
        currentPassword,
        newPassword,
      });

      haptics.success();
      toast.success('Password Changed', 'Your account password has been updated');
      router.back();
    } catch (error: unknown) {
      haptics.error();
      const msg = getErrorMessage(
        error,
        'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে। বর্তমান পাসওয়ার্ড সঠিক আছে কিনা দেখুন।',
      );
      setErrorMessage(msg);
      toast.error('ব্যর্থ', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground">Change Password</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {errorMessage ? (
          <View className="p-3 mb-4 rounded-brand bg-destructive/10 border border-destructive/20">
            <Text className="text-xs text-destructive font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Current Password */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">Current Password</Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Lock" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter current password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            New Password (Min 6 characters)
          </Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="KeyRound" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 text-sm text-foreground"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm New Password */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-foreground mb-1.5">Confirm New Password</Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="KeyRound" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Re-enter new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        <Button
          title="Save New Password"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleChangePassword}
          className="mb-4"
        />

        <Button title="Cancel" variant="outline" size="md" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.brand,
    minHeight: TouchTarget.comfortable,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  eyeButton: {
    padding: 6,
  },
});
