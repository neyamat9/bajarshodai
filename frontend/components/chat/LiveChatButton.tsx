"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLiveChat } from "./LiveChatContext";
import { useLocale } from "next-intl";

/**
 * Floating Live Chat Button.
 * When scrollY <= 600 (Go-to-top hidden): Sits at primary bottom-right (bottom-6 right-6).
 * When scrollY > 600 (Go-to-top appears): Smoothly glides left to bottom-6 right-22.
 */
export default function LiveChatButton() {
  const { isOpen, toggleChat, unreadCount } = useLiveChat();
  const locale = useLocale();
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const past = window.scrollY > 600;
      if (past !== scrolledPast) {
        setScrolledPast(past);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolledPast]);

  // Position: shifts from right-3.5 (14px) to right-[54px] smoothly when scroll-to-top appears
  const positionClass = scrolledPast ? "right-[54px] sm:right-[72px]" : "right-3.5 sm:right-6";

  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-label={
        isOpen
          ? locale === "bn" ? "লাইভ চ্যাট বন্ধ করুন" : "Close live chat"
          : locale === "bn" ? "লাইভ চ্যাট সাপোর্ট" : "Live chat support"
      }
      title={locale === "bn" ? "লাইভ চ্যাট সাপোর্ট" : "Live Chat Support"}
      style={{
        bottom: "var(--floating-bottom, 1rem)",
      }}
      className={`fixed ${positionClass} z-[1500] flex h-9.5 w-9.5 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full bg-brand-fresh text-on-fresh shadow-lg shadow-brand-fresh/25 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-fresh/35 cursor-pointer`}
    >
      {isOpen ? (
        <X className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.5]" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current" aria-hidden="true" />
      )}

      {/* Unread badge dot */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-md animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

