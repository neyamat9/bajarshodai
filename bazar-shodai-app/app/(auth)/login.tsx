import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { loginApi } from '@/features/auth/api/login';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { Radius, TouchTarget } from '@/constants/layout';
import { getErrorMessage } from '@/api/errorHandler';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const login = useAuthStore((s) => s.login);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your mobile number or email');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.light();

      const guestToken = getOrCreateGuestToken();
      const session = await loginApi({
        identifier: trimmedId,
        password,
        guestToken,
      });

      await login(session);
      haptics.success();
      toast.success(
        'Welcome Back!',
        session.user?.name ? `Logged in as ${session.user.name}` : 'Login successful',
      );

      if (params.redirect) {
        router.replace(params.redirect as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      haptics.error();
      const msg = getErrorMessage(error, 'ফোন নম্বর বা পাসওয়ার্ড ঠিক নয়। আবার চেষ্টা করুন।');
      setErrorMessage(msg);
      toast.error('লগইন ব্যর্থ', msg);
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
        <Text className="text-base font-bold text-foreground">Sign In</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center my-6">
          <View className="w-16 h-16 rounded-full bg-brand-fresh/15 items-center justify-center mb-3">
            <Icon name="ShoppingBag" size={32} color="#0b6234" />
          </View>
          <Text className="text-2xl font-bold text-brand-deep dark:text-brand-fresh">
            বাজার সদাই
          </Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center">
            Log in to manage orders, addresses, and delivery preferences in Shahrasti
          </Text>
        </View>

        {errorMessage ? (
          <View className="p-3 mb-4 rounded-brand bg-destructive/10 border border-destructive/20">
            <Text className="text-xs text-destructive font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Identifier Field */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            Mobile Number or Email
          </Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Phone" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. 01712345678 or user@mail.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        {/* Password Field */}
        <View className="mb-2">
          <Text className="text-xs font-semibold text-foreground mb-1.5">Password</Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Lock" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter your password"
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

        {/* Forgot Password */}
        <View className="items-end mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text className="text-xs font-medium text-brand-deep dark:text-brand-fresh">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <Button
          title="Sign In"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleLogin}
          className="mb-6"
        />

        {/* Sign Up Navigation */}
        <View className="flex-row items-center justify-center gap-1.5">
          <Text className="text-xs text-muted-foreground">Don&apos;t have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
            <Text className="text-xs font-bold text-brand-deep dark:text-brand-fresh">
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
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
