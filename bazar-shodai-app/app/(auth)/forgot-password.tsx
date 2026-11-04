import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { forgotPasswordApi } from '@/features/auth/api/forgotPassword';
import { Radius, TouchTarget } from '@/constants/layout';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestReset = async () => {
    setErrorMessage(null);
    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your email or registered phone number');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.light();

      await forgotPasswordApi({ email: trimmed });

      haptics.success();
      setIsSubmitted(true);
      toast.success(
        'Recovery Link Sent',
        'If an account exists, a reset link has been dispatched.',
      );
    } catch (error: unknown) {
      haptics.error();
      const msg =
        error instanceof Error
          ? error.message
          : 'Unable to process recovery request. Please try again.';
      setErrorMessage(msg);
      toast.error('Recovery Failed', msg);
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
        <Text className="text-base font-bold text-foreground">Password Recovery</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center my-6">
          <View className="w-16 h-16 rounded-full bg-brand-fresh/15 items-center justify-center mb-3">
            <Icon name="KeyRound" size={32} color="#0b6234" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Forgot Password?</Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center leading-relaxed">
            Enter your registered email address or phone number and we will send you a password
            reset link or token.
          </Text>
        </View>

        {isSubmitted ? (
          <View className="p-5 rounded-brand bg-card border border-brand-fresh/30 mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Icon name="CheckCircle2" size={20} color="#45a22c" />
              <Text className="text-sm font-bold text-foreground">Request Received</Text>
            </View>
            <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
              We have processed your recovery request for{' '}
              <Text className="font-semibold text-foreground">{identifier}</Text>. Please check your
              email inbox or SMS for instructions.
            </Text>

            <Button
              title="Enter Reset Token"
              variant="outline"
              size="md"
              onPress={() => router.push('/(auth)/reset-password')}
              className="mb-2"
            />
            <Button
              title="Back to Sign In"
              variant="primary"
              size="md"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        ) : (
          <>
            {errorMessage ? (
              <View className="p-3 mb-4 rounded-brand bg-destructive/10 border border-destructive/20">
                <Text className="text-xs text-destructive font-medium">{errorMessage}</Text>
              </View>
            ) : null}

            <View className="mb-6">
              <Text className="text-xs font-semibold text-foreground mb-1.5">
                Email or Mobile Number
              </Text>
              <View style={styles.inputBox} className="bg-card border border-border">
                <Icon name="Mail" size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter email or 11-digit phone"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  className="flex-1 text-sm text-foreground"
                />
              </View>
            </View>

            <Button
              title="Send Recovery Instructions"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleRequestReset}
              className="mb-4"
            />

            <Button
              title="Back to Sign In"
              variant="outline"
              size="md"
              onPress={() => router.back()}
            />
          </>
        )}
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
});
