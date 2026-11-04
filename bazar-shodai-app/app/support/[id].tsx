import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Radius } from '@/constants/layout';
import { useTicketDetail, useReplyTicket, useCloseTicket } from '@/features/support/api/supportApi';
import { TicketStatus } from '@/features/support/types';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function TicketConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);

  const { data: ticket, isLoading } = useTicketDetail(id || '');
  const { mutate: sendReply, isPending: isSending } = useReplyTicket(id || '');
  const { mutate: closeTicket, isPending: isClosing } = useCloseTicket(id || '');

  const [message, setMessage] = useState('');

  const messages = ticket?.messages || [];
  const isClosed = ticket?.status === 'CLOSED';

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;

    haptics.selection();
    const replyText = message.trim();
    setMessage('');

    sendReply(replyText, {
      onSuccess: () => {
        haptics.success();
      },
      onError: () => {
        haptics.error();
        toast.error('Failed to Send', 'Could not deliver your reply. Please try again.');
        setMessage(replyText);
      },
    });
  };

  const handleClose = () => {
    haptics.warning();
    closeTicket(undefined, {
      onSuccess: () => {
        haptics.success();
        toast.info('Ticket Closed', 'This support ticket has been marked as closed.');
      },
    });
  };

  const getStatusBadgeVariant = (status: TicketStatus): BadgeVariant => {
    switch (status) {
      case 'OPEN':
        return 'fresh';
      case 'IN_PROGRESS':
        return 'carrot';
      case 'WAITING_CUSTOMER':
        return 'carrot';
      case 'RESOLVED':
        return 'fresh';
      case 'CLOSED':
      default:
        return 'neutral';
    }
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {ticket?.subject || 'Ticket Conversation'}
            </Text>
            {ticket && (
              <View style={styles.badgeRow}>
                <Badge
                  label={ticket.status.replace('_', ' ')}
                  variant={getStatusBadgeVariant(ticket.status)}
                  size="sm"
                />
              </View>
            )}
          </View>
          {!isClosed && ticket && (
            <TouchableOpacity
              onPress={handleClose}
              disabled={isClosing}
              style={styles.closeActionBtn}
            >
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#0b6234" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const isMe = !item.isStaff;
              return (
                <View
                  style={[
                    styles.messageBubbleWrap,
                    isMe ? styles.messageMeWrap : styles.messageStaffWrap,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.messageBubbleMe : styles.messageBubbleStaff,
                    ]}
                  >
                    {!isMe && (
                      <View style={styles.staffHeader}>
                        <Icon name="ShieldCheck" size={13} color="#0b6234" />
                        <Text style={styles.staffLabel}>
                          {item.sender?.name || 'Support Agent'}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.messageTextMe : styles.messageTextStaff,
                      ]}
                    >
                      {item.message}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isMe ? styles.messageTimeMe : styles.messageTimeStaff,
                      ]}
                    >
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Bar */}
        {!isClosed ? (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your reply here..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending || !message.trim()}
              style={[styles.sendBtn, (!message.trim() || isSending) && styles.sendBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Send reply"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Icon name="Send" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.closedBar}>
            <Icon name="Lock" size={16} color="#64748b" />
            <Text style={styles.closedBarText}>
              This support ticket has been closed. Open a new ticket if you need further help.
            </Text>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  closeActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#f1f5f9',
  },
  closeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: 16,
    gap: 10,
  },
  messageBubbleWrap: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageMeWrap: {
    justifyContent: 'flex-end',
  },
  messageStaffWrap: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  messageBubbleMe: {
    backgroundColor: '#0b6234',
    borderBottomRightRadius: Radius.xs,
  },
  messageBubbleStaff: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: Radius.xs,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  staffLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#ffffff',
  },
  messageTextStaff: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeMe: {
    color: '#bbf7d0',
  },
  messageTimeStaff: {
    color: '#94a3b8',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    maxHeight: 90,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  closedBarText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    flex: 1,
  },
});
