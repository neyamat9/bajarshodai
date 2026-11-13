"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLiveChat } from "./LiveChatContext";
import { useLocale } from "next-intl";
import { assetUrl } from "@/lib/api/client";
import {
  ArrowDown,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  X,
  ZoomIn,
} from "lucide-react";

export default function LiveChatModal() {
  const {
    isOpen,
    closeChat,
    messages,
    hasMore,
    isLoadingEarlier,
    isSending,
    isAgentTyping,
    loadEarlierMessages,
    sendMessage,
    sendTyping,
  } = useLiveChat();

  const locale = useLocale();
  const [inputText, setInputText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages (unless viewing earlier history)
  useEffect(() => {
    if (isOpen && !isLoadingEarlier) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoadingEarlier]);

  // Handle photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(locale === "bn" ? "অনুগ্রহ করে একটি ছবি নির্বাচন করুন" : "Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(locale === "bn" ? "ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে" : "Image size must be 5MB or less");
      return;
    }

    setSelectedPhoto(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const removeSelectedPhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedPhoto) || isSending) return;

    const text = inputText;
    const photo = selectedPhoto;

    setInputText("");
    removeSelectedPhoto();

    await sendMessage(text, photo);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      textareaRef.current?.focus();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed right-4 md:right-6 z-[1490] flex h-[520px] max-h-[82vh] w-[calc(100vw-2rem)] sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out animate-scale-in"
        style={{
          bottom: "calc(var(--floating-bottom, 1.25rem) + 2.75rem)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={locale === "bn" ? "লাইভ চ্যাট উইন্ডো" : "Live chat window"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-brand-fresh/15 via-brand-fresh/5 to-transparent px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-fresh text-on-fresh shadow-sm">
              <span className="text-sm font-black">BS</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-foreground">
                {locale === "bn" ? "বাজার সদাই সাপোর্ট" : "Bazar Shodai Support"}
              </h3>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {locale === "bn" ? "অনলাইন" : "Online"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={locale === "bn" ? "চ্যাট বন্ধ করুন" : "Close chat"}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
          {/* Load Earlier 20 Messages Button */}
          {hasMore && (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={loadEarlierMessages}
                disabled={isLoadingEarlier}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 disabled:opacity-50"
              >
                {isLoadingEarlier ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 rotate-180" />
                )}
                {locale === "bn" ? "আগের ২০টি বার্তা দেখুন" : "Load earlier 20 messages"}
              </button>
            </div>
          )}

          {/* Empty Conversation Welcome */}
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-fresh/10 text-brand-fresh">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {locale === "bn" ? "আসসালামু আলাইকুম!" : "Hello! Welcome to Bazar Shodai."}
              </p>
              <p className="text-xs leading-relaxed max-w-xs">
                {locale === "bn"
                  ? "যেকোনো পণ্য, ডেলিভারি বা তথ্য সংক্রান্ত সহায়তার জন্য লিখুন অথবা ছবি পাঠান।"
                  : "How can we assist you today? Send a message or photo and our team will reply instantly."}
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((m) => {
            const isMe = m.senderType === "CUSTOMER";
            const timeStr = new Date(m.createdAt).toLocaleTimeString(locale === "bn" ? "bn-BD" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
              >
                {!isMe && (
                  <span className="text-[10px] font-semibold text-muted-foreground px-1">
                    {m.senderName || "Support Agent"}
                  </span>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm transition-all ${
                    isMe
                      ? "rounded-tr-xs bg-brand-fresh text-on-fresh"
                      : "rounded-tl-xs border border-border bg-secondary/80 text-foreground"
                  }`}
                >
                  {/* Photo Attachment */}
                  {m.attachmentUrl && (
                    <div className="mb-2 overflow-hidden rounded-lg border border-black/10 dark:border-white/10 group relative">
                      <img
                        src={assetUrl(m.attachmentUrl)}
                        alt="Attachment"
                        className="max-h-48 w-full object-cover rounded cursor-pointer transition-transform duration-200 group-hover:scale-105"
                        onClick={() => setLightboxUrl(assetUrl(m.attachmentUrl))}
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(assetUrl(m.attachmentUrl))}
                        className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="View photo"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Text Content */}
                  {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground/80 px-1">{timeStr}</span>
              </div>
            );
          })}

          {/* Agent Typing Indicator */}
          {isAgentTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 py-0.5">
              <span className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-fresh animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-fresh animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-fresh animate-bounce" />
              </span>
              <span className="text-[11px]">
                {locale === "bn" ? "সাপোর্ট এজেন্ট লিখছেন..." : "Support agent is typing..."}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Photo Thumbnail Preview */}
        {photoPreview && (
          <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-2">
            <div className="flex items-center gap-2.5">
              <img
                src={photoPreview}
                alt="Selected thumbnail"
                className="h-11 w-11 rounded-lg object-cover border border-border"
              />
              <span className="text-xs text-muted-foreground font-medium truncate max-w-[180px]">
                {selectedPhoto?.name}
              </span>
            </div>
            <button
              type="button"
              onClick={removeSelectedPhoto}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input Composer Bar */}
        <form onSubmit={handleSend} className="border-t border-border bg-card p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-end gap-2">
            {/* Attach photo icon button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95 cursor-pointer"
              aria-label={locale === "bn" ? "ছবি সংযুক্ত করুন" : "Attach photo"}
              title={locale === "bn" ? "ছবি পাঠান" : "Send photo"}
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Auto-growing multiline input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                sendTyping(e.target.value.length > 0);
              }}
              placeholder={locale === "bn" ? "আপনার বার্তা লিখুন..." : "Type your message..."}
              className="max-h-24 flex-1 resize-none rounded-xl border border-input bg-secondary/40 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-brand-fresh focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand-fresh/20"
            />

            {/* Icon-only modern send button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedPhoto) || isSending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-fresh text-on-fresh shadow-md shadow-brand-fresh/20 transition-all hover:bg-brand-fresh/90 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
              aria-label={locale === "bn" ? "বার্তা পাঠান" : "Send message"}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 ml-0.5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            aria-label="Close photo"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Enlarged photo"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

