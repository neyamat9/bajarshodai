import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router";
import { io, Socket } from "socket.io-client";
import { ASSET_BASE, tokens } from "@/api/client";
import { useAuth } from "@/store/auth";
import { tr } from "@/i18n";
import type {
  AdminConversation,
  AdminChatMessage,
} from "@/api/chat";
import { chatApi } from "@/api/chat";
import {
  ArrowDown,
  CheckCheck,
  ExternalLink,
  Loader2,
  MessageSquare,
  Paperclip,
  Phone,
  Search,
  Send,
  User as UserIcon,
  X,
  ZoomIn,
} from "lucide-react";

const QUICK_RESPONSES = [
  "আসসালামু আলাইকুম! বাজার সদাই সাপোর্ট থেকে কিভাবে সাহায্য করতে পারি?",
  "আপনার অর্ডারটি প্রসেসিংয়ে রয়েছে, দ্রুত আপনার ঠিকানায় পৌঁছে দেওয়া হবে।",
  "অনুগ্রহ করে আপনার সঠিক ঠিকানা বা কোনো পরিচিত ল্যান্ডমার্ক জানান।",
  "ধন্যবাদ! আমরা এখনই বিষয়টি চেক করে জানাচ্ছি।",
];

export default function LiveChat() {
  const user = useAuth((s) => s.user);

  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play chime for incoming customer message
  const playAlert = () => {
    try {
      if (!audioRef.current) {
        const tone = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzHBya2/DDk1wpFwqP1+7ctm8wFAqFz/Hks3AvEgqAzvPkuHQtEAqAy/PkunkvEQp/y/Pkvn4wEQp9yvTkwYAxEgx6yPTlx4UyFAx2xvXmzIs2GAtswfbq15tAHBJguvXw461RKBcSbK/e6eO5XywTCGiV1fDpu3E5GA9llNbr5L99OBgOZ5fV6ea+gDgaDWWW1OnkwoI6GA5ll9bp5sKCOho";
        audioRef.current = new Audio(tone);
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(() => {});
    } catch {
      // Audio playback restrictions fallback
    }
  };

  // 1. Fetch conversations list
  const loadConversations = async () => {
    try {
      const list = await chatApi.getConversations();
      setConversations(list);
      if (!activeConvId && list.length > 0) {
        setActiveConvId(list[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Connect to Socket.IO and listen for admin notifications
  useEffect(() => {
    const socket = io(`${ASSET_BASE}/chat`, {
      transports: ["websocket", "polling"],
      auth: { token: tokens.access },
    });

    socket.on("connect", () => {
      socket.emit("subscribe_admin");
      if (activeConvId) {
        socket.emit("subscribe", { conversationId: activeConvId });
      }
    });

    // Incoming customer message notification across the store
    socket.on("admin_new_message", (payload: { conversationId: string; message: AdminChatMessage }) => {
      playAlert();
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        if (idx !== -1) {
          const updated = {
            ...prev[idx],
            lastMessageAt: payload.message.createdAt,
            lastMessageText: payload.message.text || "📷 Photo Attachment",
            unreadAdminCount:
              payload.conversationId === activeConvId ? 0 : prev[idx].unreadAdminCount + 1,
          };
          return [updated, ...prev.filter((c) => c.id !== payload.conversationId)];
        }
        // If brand new conversation, reload full list
        loadConversations();
        return prev;
      });

      // If this conversation is currently open, append message directly
      if (payload.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        chatApi.markAsRead(activeConvId).catch(() => {});
      }
    });

    socket.on("new_message", (msg: AdminChatMessage) => {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    socket.on("typing_status", (payload: { conversationId: string; isTyping: boolean; senderType: string }) => {
      if (payload.conversationId === activeConvId && payload.senderType === "CUSTOMER") {
        setIsCustomerTyping(payload.isTyping);
      }
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [activeConvId]);

  // 3. Load active conversation messages
  useEffect(() => {
    if (!activeConvId) return;

    let alive = true;
    setLoadingMessages(true);
    setIsCustomerTyping(false);

    chatApi
      .getMessages(activeConvId, undefined, 20)
      .then((res) => {
        if (!alive) return;
        setMessages(res.messages);
        setHasMore(res.hasMore);
        nextCursorRef.current = res.nextCursor ?? null;
      })
      .finally(() => {
        if (alive) setLoadingMessages(false);
      });

    // Mark as read in DB and reset local unread badge
    chatApi.markAsRead(activeConvId).catch(() => {});
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, unreadAdminCount: 0 } : c)),
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit("subscribe", { conversationId: activeConvId });
      socketRef.current.emit("mark_as_read", { conversationId: activeConvId, readBy: "ADMIN" });
    }

    return () => {
      alive = false;
    };
  }, [activeConvId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (!loadingEarlier) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingEarlier]);

  // Load earlier 20 messages
  const handleLoadEarlier = async () => {
    if (!activeConvId || !nextCursorRef.current || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const res = await chatApi.getMessages(activeConvId, nextCursorRef.current, 20);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = res.messages.filter((m) => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });
      setHasMore(res.hasMore);
      nextCursorRef.current = res.nextCursor ?? null;
    } finally {
      setLoadingEarlier(false);
    }
  };

  // Photo attachment handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removeSelectedPhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeConvId || (!replyText.trim() && !selectedPhoto) || isSending) return;

    setIsSending(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;

      if (selectedPhoto) {
        const uploaded = await chatApi.uploadPhoto(selectedPhoto);
        attachmentUrl = uploaded.url;
        attachmentType = uploaded.type;
      }

      const text = replyText;
      setReplyText("");
      removeSelectedPhoto();

      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          conversationId: activeConvId,
          senderType: "ADMIN",
          senderId: user?.id ?? null,
          senderName: user?.name || "Support Staff",
          text: text.trim() || null,
          attachmentUrl,
          attachmentType,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.customer.name.toLowerCase().includes(q) ||
        c.customer.phone?.includes(q) ||
        c.lastMessageText?.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const getMediaUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${ASSET_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:flex-row">
      {/* ── Left Sidebar: Conversations Feed ── */}
      <div className="flex w-full flex-col border-b border-border bg-card lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r xl:w-96">
        {/* Header & Search */}
        <div className="p-3.5 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="size-4.5 text-primary" />
              {tr("Live Chat")}
            </h1>
            <span className="text-xs font-semibold text-muted-foreground">
              {conversations.length} {tr("conversations")}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr("Search by customer, phone, text...")}
              className="h-8.5 w-full rounded-md border border-input bg-secondary/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loadingList ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {tr("No conversations found")}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === activeConvId;
              const hasUnread = c.unreadAdminCount > 0;
              const time = new Date(c.lastMessageAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  {/* Customer Avatar */}
                  <div className="relative size-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-foreground font-bold text-xs">
                    {c.customer.name.slice(0, 2).toUpperCase()}
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {c.customer.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {time}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate mb-1">
                      {c.customer.phone || (c.customer.isGuest ? tr("Guest Session") : "")}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          hasUnread ? "font-bold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {c.lastMessageText || tr("Chat started")}
                      </p>
                      {hasUnread && (
                        <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center shrink-0 animate-pulse">
                          {c.unreadAdminCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Active Chat Room ── */}
      {activeConv ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-background/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                {activeConv.customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-sm font-bold text-foreground">
                    {activeConv.customer.name}
                  </h2>
                  {activeConv.customer.isGuest ? (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      {tr("Guest")}
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {tr("Customer")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {activeConv.customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {activeConv.customer.phone}
                    </span>
                  )}
                  {activeConv.customer.id && (
                    <Link
                      to={`/customers/${activeConv.customer.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      <UserIcon className="size-3" />
                      {tr("View Profile")}
                      <ExternalLink className="size-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Load Earlier 20 Messages */}
            {hasMore && (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={handleLoadEarlier}
                  disabled={loadingEarlier}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-xs hover:bg-secondary active:scale-95 disabled:opacity-50"
                >
                  {loadingEarlier ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowDown className="size-3.5 rotate-180" />
                  )}
                  {tr("Load earlier 20 messages")}
                </button>
              </div>
            )}

            {loadingMessages ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {tr("No messages in this conversation yet.")}
              </div>
            ) : (
              messages.map((m) => {
                const isStaff = m.senderType === "ADMIN";
                const time = new Date(m.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isStaff ? "items-end" : "items-start"} space-y-1`}
                  >
                    <span className="text-[10px] font-semibold text-muted-foreground px-1">
                      {m.senderName || (isStaff ? "Support Staff" : activeConv.customer.name)}
                    </span>

                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                        isStaff
                          ? "rounded-tr-xs bg-primary text-primary-foreground"
                          : "rounded-tl-xs border border-border bg-card text-foreground"
                      }`}
                    >
                      {/* Photo Attachment */}
                      {m.attachmentUrl && (
                        <div className="mb-2 overflow-hidden rounded-lg border border-black/10 dark:border-white/10 group relative">
                          <img
                            src={getMediaUrl(m.attachmentUrl)}
                            alt="Attachment"
                            className="max-h-56 w-full object-cover rounded cursor-pointer transition-transform duration-200 group-hover:scale-105"
                            onClick={() => setLightboxUrl(getMediaUrl(m.attachmentUrl))}
                          />
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(getMediaUrl(m.attachmentUrl))}
                            className="absolute bottom-1.5 right-1.5 size-6 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ZoomIn className="size-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Text */}
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-1">
                      <span>{time}</span>
                      {isStaff && m.isRead && <CheckCheck className="size-3 text-emerald-500" />}
                    </div>
                  </div>
                );
              })
            )}

            {/* Customer Typing Status */}
            {isCustomerTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <span className="flex gap-1 items-center">
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                </span>
                <span className="text-[11px] font-medium">{tr("Customer is typing...")}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Response Templates Chips */}
          <div className="border-t border-border bg-secondary/30 px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">
              {tr("Quick replies:")}
            </span>
            {QUICK_RESPONSES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReplyText(tmpl)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground whitespace-nowrap hover:bg-secondary active:scale-95 transition-colors cursor-pointer"
              >
                {tmpl.slice(0, 32)}...
              </button>
            ))}
          </div>

          {/* Photo Preview Before Send */}
          {photoPreview && (
            <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={photoPreview}
                  alt="Attachment preview"
                  className="size-12 rounded-lg object-cover border border-border"
                />
                <span className="text-xs text-muted-foreground font-medium truncate max-w-xs">
                  {selectedPhoto?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={removeSelectedPhoto}
                className="size-7 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Reply Box */}
          <form onSubmit={handleSend} className="border-t border-border bg-card p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="size-10 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title={tr("Attach photo")}
              >
                <Paperclip className="size-4.5" />
              </button>

              <textarea
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={tr("Type a reply as Support Staff...")}
                className="max-h-28 flex-1 resize-none rounded-xl border border-input bg-secondary/30 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <button
                type="submit"
                disabled={(!replyText.trim() && !selectedPhoto) || isSending}
                className="size-10 rounded-full bg-primary text-primary-foreground shadow-sm flex items-center justify-center shrink-0 hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer transition-all"
                title={tr("Send reply")}
              >
                {isSending ? (
                  <Loader2 className="size-4.5 animate-spin" />
                ) : (
                  <Send className="size-4.5 ml-0.5" />
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <MessageSquare className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-bold text-foreground">{tr("Select a conversation")}</p>
          <p className="text-xs">{tr("Choose a conversation from the left to start chatting.")}</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
          >
            <X className="size-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Enlarged"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
