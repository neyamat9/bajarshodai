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
export default function LanguageSwitcher({ className = "", compact = false }: { className?: string; compact?: boolean }) {
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

  return (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={t("switchAria")}
      lang={next}
      className={
        className ||
        "flex h-11 items-center justify-center gap-1.5 rounded border border-border bg-card px-3 text-sm font-bold text-foreground transition-colors hover:border-brand-fresh hover:text-accent-text"
      }
    >
      <Languages className="h-[18px] w-[18px]" aria-hidden="true" />
      {!compact && <span>{t("switchTo")}</span>}
    </button>
  );
}
