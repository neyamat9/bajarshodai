import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useSubmitContact } from '@/features/support/api/supportApi';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

const HOTLINE_PHONE = '+8801700000000';
const WHATSAPP_NUMBER = '8801700000000';

export default function ContactUsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: submitContact, isPending } = useSubmitContact();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleCall = () => {
    haptics.selection();
    Linking.openURL(`tel:${HOTLINE_PHONE}`).catch(() => {
      toast.error('Error', 'Unable to initiate phone call');
    });
  };

  const handleWhatsApp = () => {
    haptics.selection();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Hello Bazar Shodai Support, I need help with...',
    )}`;
    Linking.openURL(url).catch(() => {
      toast.error('Error', 'WhatsApp is not installed on this device');
    });
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Validation Error', 'Please enter your name');
      return;
    }
    if (!subject.trim()) {
      toast.error('Validation Error', 'Please enter a message subject');
      return;
    }
    if (message.trim().length < 10) {
      toast.error('Validation Error', 'Message must be at least 10 characters long');
      return;
    }

    submitContact(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      },
      {
        onSuccess: () => {
          haptics.success();
          toast.success('Message Sent', 'Thank you! We will get back to you shortly.');
          setSubject('');
          setMessage('');
        },
        onError: () => {
          haptics.error();
          toast.error('Error', 'Failed to send contact message. Please call our hotline.');
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
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
          <Text style={styles.headerTitle}>Contact Customer Care</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Direct Channels */}
          <View style={styles.channelsRow}>
            <TouchableOpacity onPress={handleCall} style={styles.channelCard} activeOpacity={0.8}>
              <View style={[styles.channelIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Icon name="PhoneCall" size={24} color="#0b6234" />
              </View>
              <Text style={styles.channelTitle}>Call Hotline</Text>
              <Text style={styles.channelSub}>+880 1700-000000</Text>
              <Text style={styles.channelTime}>8:00 AM - 10:00 PM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsApp}
              style={styles.channelCard}
              activeOpacity={0.8}
            >
              <View style={[styles.channelIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Icon name="MessageSquare" size={24} color="#16a34a" />
              </View>
              <Text style={styles.channelTitle}>WhatsApp Chat</Text>
              <Text style={styles.channelSub}>Instant Support</Text>
              <Text style={styles.channelTime}>Typical reply: 5 mins</Text>
            </TouchableOpacity>
          </View>

          {/* Location & Operating Hours */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="MapPin" size={18} color="#0b6234" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Shahrasti Storefront & Warehouse</Text>
                <Text style={styles.infoDesc}>
                  Main Road, Shahrasti Bazar, Chandpur, Bangladesh
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Icon name="Clock" size={18} color="#0b6234" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Delivery Hours</Text>
                <Text style={styles.infoDesc}>
                  7 Days a Week • Morning 7:30 AM to Night 10:30 PM
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Message Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send Us a Message</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="017XXXXXXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Order query or delivery feedback"
                placeholderTextColor="#9ca3af"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="How can we help you?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>

            <Button
              title="Send Message"
              variant="primary"
              size="lg"
              loading={isPending}
              onPress={handleSubmit}
              style={{ marginTop: 6 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  channelsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  channelCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  channelIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  channelSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
    marginTop: 2,
  },
  channelTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 90,
  },
});
