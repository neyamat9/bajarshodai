"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import type { Locale } from "@/lib/locale";
import { getSiteSettings } from "@/lib/services/site.service";
import {
  buildMessengerOrderMessage,
  buildMessengerUrl,
  sanitizeMessengerUsername,
} from "@/lib/services/messenger-order";

interface MessengerOrderButtonProps {
  productName: string;
  productSlug: string;
  productPrice: number;
  className?: string;
  variant?: "full" | "compact";
  messengerUsername?: string | null;
  template?: string | null;
}

export function MessengerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.16 2 11.29c0 2.92 1.45 5.53 3.73 7.21v3.5l3.35-1.84c.94.26 1.93.41 2.92.41 5.52 0 10-4.16 10-9.28S17.52 2 12 2zm1.03 12.51-2.58-2.75-5.04 2.75 5.54-5.88 2.66 2.75 4.96-2.75-5.54 5.88z" />
    </svg>
  );
}

export default function MessengerOrderButton({
  productName,
  productSlug,
  productPrice,
  className = "",
  variant = "full",
  messengerUsername: propUsername,
  template: propTemplate,
}: MessengerOrderButtonProps) {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";

  const [activeUsername, setActiveUsername] = useState<string | null>(propUsername ?? null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(propTemplate ?? null);
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (propUsername) return;
    let alive = true;
    getSiteSettings()
      .then((s) => {
        if (!alive) return;
        const username =
          s?.site?.messenger ||
          (s?.site?.socialLinks?.facebook
            ? sanitizeMessengerUsername(s.site.socialLinks.facebook)
            : null) ||
          "bajarshodai2";
        const isEnabled = s?.site?.messengerEnabled !== false;
        const tpl = s?.site?.messengerOrderTemplate || null;

        if (username) setActiveUsername(username);
        if (tpl) setActiveTemplate(tpl);
        setEnabled(isEnabled);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [propUsername]);

  if (!enabled) return null;

  const effectiveUsername = activeUsername || "bajarshodai2";
  const messengerUrl = buildMessengerUrl(effectiveUsername);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const message = buildMessengerOrderMessage({
      messengerUsername: effectiveUsername,
      productName,
      productSlug,
      productPrice,
      locale,
      template: activeTemplate,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        toast.success(
          isBn
            ? "অর্ডার তথ্য কপি হয়েছে! মেসেঞ্জারে পেস্ট করে পাঠিয়ে দিন।"
            : "Order details copied! Paste in Messenger to send.",
        );
      }
    } catch {
      // Gracefully continue to open Messenger even if clipboard API is blocked
    }

    if (messengerUrl) {
      window.open(messengerUrl, "_blank", "noopener,noreferrer");
    }
  };

  const buttonLabel = isBn ? "মেসেঞ্জারে অর্ডার" : "Order on Messenger";

  if (variant === "compact") {
    return (
      <a
        href={messengerUrl}
        onClick={handleClick}
        aria-label={`${buttonLabel}: ${productName}`}
        title={buttonLabel}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0084FF] hover:bg-[#0073E6] active:scale-95 text-white font-bold px-3 py-2 text-xs shadow-sm transition-all ${className}`}
      >
        <MessengerIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{buttonLabel}</span>
      </a>
    );
  }

  return (
    <a
      href={messengerUrl}
      onClick={handleClick}
      aria-label={`${buttonLabel}: ${productName}`}
      className={`group flex items-center justify-center gap-2.5 rounded-xl bg-[#0084FF] hover:bg-[#0073E6] active:scale-[0.98] text-white font-bold text-sm sm:text-base py-3 px-5 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      <MessengerIcon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
      <span>{buttonLabel}</span>
    </a>
  );
}

