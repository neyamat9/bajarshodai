import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { registerApi } from '@/features/auth/api/register';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { Radius, TouchTarget } from '@/constants/layout';

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters)');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10 or 11-digit Bangladeshi mobile number');
      return;
    }

    const normalizedPhone = cleanPhone.startsWith('0') ? cleanPhone : `0${cleanPhone}`;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.light();

      const guestToken = getOrCreateGuestToken();
      const session = await registerApi({
        name: trimmedName,
        phone: normalizedPhone,
        email: email.trim() ? email.trim() : undefined,
        password,
        language: 'bn',
        guestToken,
      });

      await login(session);
      haptics.success();
      toast.success(
        'Account Created!',
        `Welcome to Bazar Shodai, ${session.user?.name ?? trimmedName}!`,
      );

      router.replace('/(tabs)');
    } catch (error: unknown) {
      haptics.error();
      const msg =
        error instanceof Error
          ? error.message
          : 'Registration failed. A customer with this phone number may already exist.';
      setErrorMessage(msg);
      toast.error('Registration Failed', msg);
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
        <Text className="text-base font-bold text-foreground">Create Account</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center my-4">
          <View className="w-14 h-14 rounded-full bg-brand-fresh/15 items-center justify-center mb-2">
            <Icon name="UserPlus" size={28} color="#0b6234" />
          </View>
          <Text className="text-xl font-bold text-foreground">Register with Bazar Shodai</Text>
          <Text className="text-xs text-muted-foreground mt-0.5 text-center">
            Fresh groceries delivered directly to your home in Shahrasti
          </Text>
        </View>

        {errorMessage ? (
          <View className="p-3 mb-4 rounded-brand bg-destructive/10 border border-destructive/20">
            <Text className="text-xs text-destructive font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Full Name */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">Full Name *</Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="User" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Tareq Hasan"
              placeholderTextColor="#94a3b8"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        {/* Bangladeshi Mobile Phone */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            Mobile Number (Bangladesh) *
          </Text>
          <PhoneInput
            value={phone}
            onChangePhone={(val) => {
              setPhone(val);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="01712345678"
          />
        </View>

        {/* Email Address (Optional) */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            Email Address (Optional)
          </Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Mail" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. tareq@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-foreground mb-1.5">
            Password * (Min 6 characters)
          </Text>
          <View style={styles.inputBox} className="bg-card border border-border">
            <Icon name="Lock" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Create a strong password"
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

        {/* Terms & Conditions */}
        <TouchableOpacity
          onPress={() => setAgreeTerms(!agreeTerms)}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 mb-6"
        >
          <View
            className={`w-5 h-5 rounded border items-center justify-center ${
              agreeTerms ? 'bg-brand-fresh border-brand-fresh' : 'border-muted-foreground'
            }`}
          >
            {agreeTerms && <Icon name="Check" size={12} color="#ffffff" />}
          </View>
          <Text className="text-xs text-muted-foreground flex-1">
            I agree to the Terms of Service & Privacy Policy of Bazar Shodai.
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <Button
          title="Create Account"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleRegister}
          className="mb-6"
        />

        {/* Sign In Link */}
        <View className="flex-row items-center justify-center gap-1.5">
          <Text className="text-xs text-muted-foreground">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text className="text-xs font-bold text-brand-deep dark:text-brand-fresh">Sign In</Text>
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
