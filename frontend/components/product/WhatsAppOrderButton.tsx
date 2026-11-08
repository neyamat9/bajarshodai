"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";
import { getSiteSettings } from "@/lib/services/site.service";
import { buildWhatsAppOrderUrl } from "@/lib/services/whatsapp-order";

interface WhatsAppOrderButtonProps {
  productName: string;
  productSlug: string;
  productPrice: number;
  className?: string;
  variant?: "full" | "compact";
  whatsappNumber?: string | null;
  template?: string | null;
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.92 9.92 0 1 0 12.04 2zm0 1.8a8.12 8.12 0 0 1 6.9 12.4 8.1 8.1 0 0 1-10.9 2.7l-.3-.18-3.1.82.83-3.03-.2-.31A8.12 8.12 0 0 1 12.04 3.8zM8.6 7.5c-.2 0-.5.07-.75.35-.26.28-1 1-1 2.43s1.03 2.8 1.17 3c.14.2 2 3.2 4.95 4.35 2.45.97 2.95.78 3.48.73.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.28-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.14-.2.28-.74.93-.9 1.12-.17.2-.33.22-.62.07-.28-.14-1.2-.44-2.28-1.4-.85-.76-1.42-1.7-1.58-1.98-.17-.29-.02-.44.12-.58.13-.13.28-.33.43-.5.14-.17.2-.28.28-.47.1-.2.05-.36-.02-.5-.07-.15-.64-1.58-.9-2.16-.23-.5-.47-.5-.65-.5z" />
    </svg>
  );
}

export default function WhatsAppOrderButton({
  productName,
  productSlug,
  productPrice,
  className = "",
  variant = "full",
  whatsappNumber: propNumber,
  template: propTemplate,
}: WhatsAppOrderButtonProps) {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";

  const [activeNumber, setActiveNumber] = useState<string | null>(propNumber ?? null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(propTemplate ?? null);

  useEffect(() => {
    if (propNumber) return;
    let alive = true;
    getSiteSettings()
      .then((s) => {
        if (!alive) return;
        const num = s?.site?.whatsapp || s?.site?.hotline || null;
        const tpl = s?.site?.whatsappOrderTemplate || null;
        if (num) setActiveNumber(num);
        if (tpl) setActiveTemplate(tpl);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [propNumber]);

  // Fallback default support number if none configured
  const effectiveNumber = activeNumber || "8801700000000";

  const url = buildWhatsAppOrderUrl({
    whatsappNumber: effectiveNumber,
    productName,
    productSlug,
    productPrice,
    locale,
    template: activeTemplate,
  });

  const buttonLabel = isBn ? "হোয়াটসঅ্যাপে অর্ডার" : "Order on WhatsApp";

  if (variant === "compact") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${buttonLabel}: ${productName}`}
        title={buttonLabel}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] hover:bg-[#20BA56] active:scale-95 text-white font-bold px-3 py-2 text-xs shadow-sm transition-all ${className}`}
      >
        <WhatsAppIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{buttonLabel}</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${buttonLabel}: ${productName}`}
      className={`group flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BA56] active:scale-[0.98] text-white font-bold text-sm sm:text-base py-3 px-5 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
      <span>{buttonLabel}</span>
    </a>
  );
}

