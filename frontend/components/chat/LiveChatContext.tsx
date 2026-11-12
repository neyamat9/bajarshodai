"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, tokens, AUTH_CHANGED_EVENT } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  ChatMessage,
  ChatSession,
  getChatMessages,
  getChatSession,
  linkGuestChat,
  uploadChatPhoto,
} from "@/lib/services/chat.service";

interface LiveChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  session: ChatSession | null;
  messages: ChatMessage[];
  unreadCount: number;
  hasMore: boolean;
  isLoadingEarlier: boolean;
  isSending: boolean;
  isAgentTyping: boolean;
  loadEarlierMessages: () => Promise<void>;
  sendMessage: (text: string, photoFile?: File | null) => Promise<boolean>;
  sendTyping: (isTyping: boolean) => void;
}

const LiveChatContext = createContext<LiveChatContextType | null>(null);

export function LiveChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play subtle notification chime
  const playChime = useCallback(() => {
    try {
      if (!audioRef.current && typeof window !== "undefined") {
        // Simple subtle clean notification tone (Base64 WAV)
        const tone = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzHBya2/DDk1wpFwqP1+7ctm8wFAqFz/Hks3AvEgqAzvPkuHQtEAqAy/PkunkvEQp/y/Pkvn4wEQp9yvTkwYAxEgx6yPTlx4UyFAx2xvXmzIs2GAtswfbq15tAHBJguvXw461RKBcSbK/e6eO5XywTCGiV1fDpu3E5GA9llNbr5L99OBgOZ5fV6ea+gDgaDWWW1OnkwoI6GA5ll9bp5sKCOho";
        audioRef.current = new Audio(tone);
        audioRef.current.volume = 0.4;
      }
      audioRef.current?.play().catch(() => {});
    } catch {
      // Audio playback restrictions fallback
    }
  }, []);

  // Initialize or fetch chat session
  const initSession = useCallback(async () => {
    try {
      if (isAuthenticated) {
        await linkGuestChat();
      }
      const s = await getChatSession();
      setSession(s);
      setUnreadCount(s.unreadCustomerCount || 0);

      // Fetch initial 20 messages
      const paginated = await getChatMessages(s.conversationId, undefined, 20);
      setMessages(paginated.messages);
      setHasMore(paginated.hasMore);
      nextCursorRef.current = paginated.nextCursor ?? null;

      // Connect or join room via Socket.IO
      const assetBase = API_BASE_URL.replace(/\/api$/, "");
      if (!socketRef.current) {
        const socket = io(`${assetBase}/chat`, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
        });

        socket.on("connect", () => {
          socket.emit("subscribe", { conversationId: s.conversationId });
        });

        socket.on("new_message", (msg: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (msg.senderType === "ADMIN") {
            playChime();
            setUnreadCount((c) => (isOpen ? 0 : c + 1));
            if (isOpen) {
              socket.emit("mark_as_read", { conversationId: s.conversationId, readBy: "CUSTOMER" });
            }
          }
        });

        socket.on("typing_status", (payload: { isTyping: boolean; senderType: string }) => {
          if (payload.senderType === "ADMIN") {
            setIsAgentTyping(payload.isTyping);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (payload.isTyping) {
              typingTimeoutRef.current = setTimeout(() => setIsAgentTyping(false), 3000);
            }
          }
        });

        socket.on("conversation_read", (payload: { readBy: string }) => {
          if (payload.readBy === "CUSTOMER") {
            setUnreadCount(0);
          }
        });

        socketRef.current = socket;
      } else {
        socketRef.current.emit("subscribe", { conversationId: s.conversationId });
      }
    } catch {
      // Offline fallback
    }
  }, [isAuthenticated, isOpen, playChime]);

  useEffect(() => {
    initSession();

    const handleAuthChange = () => {
      initSession();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [initSession]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
    if (session?.conversationId && socketRef.current) {
      socketRef.current.emit("mark_as_read", {
        conversationId: session.conversationId,
        readBy: "CUSTOMER",
      });
    }
  }, [session]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    if (isOpen) closeChat();
    else openChat();
  }, [isOpen, openChat, closeChat]);

  // Load previous 20 messages
  const loadEarlierMessages = useCallback(async () => {
    if (!session?.conversationId || !nextCursorRef.current || isLoadingEarlier) return;
    setIsLoadingEarlier(true);
    try {
      const paginated = await getChatMessages(session.conversationId, nextCursorRef.current, 20);
      setMessages((prev) => {
        // Prepend earlier messages without duplicates
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = paginated.messages.filter((m) => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });
      setHasMore(paginated.hasMore);
      nextCursorRef.current = paginated.nextCursor ?? null;
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [session, isLoadingEarlier]);

  // Send message
  const sendMessage = useCallback(
    async (text: string, photoFile?: File | null): Promise<boolean> => {
      if (!session?.conversationId || (!text.trim() && !photoFile)) return false;

      setIsSending(true);
      try {
        let attachmentUrl: string | null = null;
        let attachmentType: string | null = null;

        if (photoFile) {
          const uploaded = await uploadChatPhoto(photoFile);
          attachmentUrl = uploaded.url;
          attachmentType = uploaded.type;
        }

        const senderName = user?.name || "Customer";

        if (socketRef.current?.connected) {
          socketRef.current.emit("send_message", {
            conversationId: session.conversationId,
            senderType: "CUSTOMER",
            senderId: user?.id ?? null,
            senderName,
            text: text.trim() || null,
            attachmentUrl,
            attachmentType,
          });
        }

        // Stop typing indicator
        socketRef.current?.emit("typing", {
          conversationId: session.conversationId,
          isTyping: false,
          senderName,
          senderType: "CUSTOMER",
        });

        return true;
      } catch {
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [session, user],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!session?.conversationId || !socketRef.current?.connected) return;
      socketRef.current.emit("typing", {
        conversationId: session.conversationId,
        isTyping,
        senderName: user?.name || "Customer",
        senderType: "CUSTOMER",
      });
    },
    [session, user],
  );

  return (
    <LiveChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        session,
        messages,
        unreadCount,
        hasMore,
        isLoadingEarlier,
        isSending,
        isAgentTyping,
        loadEarlierMessages,
        sendMessage,
        sendTyping,
      }}
    >
      {children}
    </LiveChatContext.Provider>
  );
}

export function useLiveChat() {
  const ctx = useContext(LiveChatContext);
  if (!ctx) throw new Error("useLiveChat must be used within LiveChatProvider");
  return ctx;
}

