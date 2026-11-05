import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { resetPasswordApi } from '@/features/auth/api/resetPassword';
import { Radius, TouchTarget } from '@/constants/layout';
import { getErrorMessage } from '@/api/errorHandler';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setErrorMessage(null);

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setErrorMessage('Please enter the reset token received via email or SMS');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.light();

      await resetPasswordApi({
        token: trimmedToken,
        newPassword,
      });

      haptics.success();
      toast.success('Password Updated', 'Your password has been changed. Please sign in.');
      router.replace('/(auth)/login');
    } catch (error: unknown) {
      haptics.error();
      const msg = getErrorMessage(
        error,
        'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে। লিংকটি মেয়াদোত্তীর্ণ বা অকার্যকর হতে পারে।',
      );
      setErrorMessage(msg);
      toast.error('রিসেট ব্যর্থ', msg);
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
        <Text className="text-base font-bold text-foreground">Set New Password</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center my-6">
          <View className="w-16 h-16 rounded-full bg-brand-fresh/15 items-center justify-center mb-3">
            <Icon name="ShieldCheck" size={32} color="#0b6234" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Create New Password</Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center">
            Enter your verification token and choose a secure new password
          </Text>
        </View>

        {errorMessage ? (
          <View className="p-3 mb-4 rounded-brand bg-destructive/10 border border-destructive/20">
            <Text className="text-xs text-destructive font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Verification Token */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">Reset Token *</Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Key" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={token}
              onChangeText={(text) => {
                setToken(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Paste or enter reset token"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            New Password * (Min 6 characters)
          </Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Lock" size={16} color="#64748b" style={styles.inputIcon} />
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

        {/* Confirm Password */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            Confirm New Password *
          </Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Lock" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Confirm new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        <Button
          title="Update Password"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleReset}
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
