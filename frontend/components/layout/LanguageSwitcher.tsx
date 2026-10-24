"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { api, tokens } from "@/lib/api/client";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Switches the whole site between Bangla and English.
 * The choice is remembered in a cookie (so a bookmarked plain address opens in the chosen language)
 * and, for a signed-in customer, on their account (so emails and invoices follow it too).
 */
export default function LanguageSwitcher({
  className = "",
  compact = false,
  short = false,
  showIcon = true,
}: {
  className?: string;
  compact?: boolean;
  short?: boolean;
  showIcon?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Language");
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "bn" ? "en" : "bn";

  function switchLanguage() {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    if (tokens.access) void api.patch("/customer/auth/profile", { language: next }).catch(() => undefined);
    const search = window.location.search;
    router.replace(`${pathname}${search}`, { locale: next });
  }

  const isSmall = short || className.includes("h-7") || className.includes("h-8");
  const label = short ? (locale === "bn" ? "EN" : "BN") : t("switchTo");
  const renderIcon = showIcon && !short;

  return (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={t("switchAria")}
      title={t("switchAria")}
      lang={next}
      className={
        className ||
        "flex h-7 items-center justify-center rounded border border-border bg-card px-2 text-xs font-bold uppercase text-foreground transition-colors hover:border-brand-fresh hover:text-accent-text"
      }
    >
      {renderIcon && (
        <Languages className={`${isSmall ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} shrink-0`} aria-hidden="true" />
      )}
      {!compact && <span>{label}</span>}
    </button>
  );
}
