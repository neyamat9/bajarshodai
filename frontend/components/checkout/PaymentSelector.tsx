"use client";

import { btnGhost, btnPrimary, inputBase } from "@/components/account/ui";
import type { MobileAccount } from "@/lib/services/site.service";
import { MOBILE_METHODS, type PaymentMethod } from "@/lib/types";
import { ArrowLeft, ArrowRight, Banknote, Check, Copy, Info, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface PaymentSelectorProps {
  /** payment methods the shop accepts */
  methods: PaymentMethod[];
  /** where to send money for each mobile-banking method (set by the admin in the dashboard) */
  accounts: Partial<Record<PaymentMethod, MobileAccount | null>>;
  /** order total, shown as the amount to send */
  total: number | null;
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  senderNumber: string;
  onSenderNumberChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const BRAND: Record<string, { name: string; dot: string; tint: string; border: string; text: string }> = {
  bKash: { name: "bKash", dot: "bg-[#e2136e]", tint: "bg-[#e2136e]/8", border: "border-[#e2136e]/50", text: "text-[#b80f58] dark:text-[#ff7ab5]" },
  Nagad: { name: "Nagad", dot: "bg-[#f6921e]", tint: "bg-[#f6921e]/10", border: "border-[#f6921e]/60", text: "text-[#b05d00] dark:text-[#ffb15c]" },
  Rocket: { name: "Rocket", dot: "bg-[#8c3494]", tint: "bg-[#8c3494]/8", border: "border-[#8c3494]/50", text: "text-[#7a2a82] dark:text-[#d79be0]" },
};
const ACCOUNT_TYPE: Record<string, "accPersonal" | "accMerchant" | "accAgent"> = { personal: "accPersonal", merchant: "accMerchant", agent: "accAgent" };
const SEND_HOW: Record<string, "howPersonal" | "howMerchant" | "howAgent"> = { personal: "howPersonal", merchant: "howMerchant", agent: "howAgent" };

export const TRX_PATTERN = /^[A-Za-z0-9]{6,20}$/;
export const BD_MOBILE = /^(\+?88)?01[3-9]\d{8}$/;

/**
 * Step 2 — how to pay.
 * Cash on delivery needs nothing. bKash / Nagad / Rocket show where to send the money (with a copy button and the amount),
 * then ask for the transaction ID and the number the money was sent from, which the shop checks against its account.
 */
export default function PaymentSelector({ methods, accounts, total, selected, onSelect, transactionId, onTransactionIdChange, senderNumber, onSenderNumberChange, onBack, onContinue }: PaymentSelectorProps) {
  const t = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  const isMobile = !!selected && MOBILE_METHODS.includes(selected);
  const selectedBrand = selected
    ? BRAND[selected] || { name: selected, dot: "bg-brand-fresh", tint: "bg-brand-fresh/10", border: "border-brand-fresh/50", text: "text-brand-fresh" }
    : null;
  const account = selected ? accounts[selected] : null;
  const trxOk = TRX_PATTERN.test(transactionId.trim());
  const senderOk = BD_MOBILE.test(senderNumber.replace(/[\s-]/g, ""));
  const canContinue = !!selected && (!isMobile || (trxOk && senderOk));

  async function copy(n: string) {
    try {
      await navigator.clipboard.writeText(n);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.info(t("numberToast", { n }));
    }
  }

  function next() {
    if (!canContinue) {
      setTouched(true);
      return;
    }
    onContinue();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-outfit text-xl font-black text-foreground">{t("payTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("payLead")}</p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label={t("payGroup")}>
        {methods.map((m) => {
          const on = selected === m;
          const mobile = MOBILE_METHODS.includes(m);
          const brand = BRAND[m] || { name: m, dot: "bg-brand-fresh", tint: "bg-brand-fresh/10", border: "border-brand-fresh/50", text: "text-brand-fresh" };
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(m)}
              className={`flex w-full items-center gap-4 rounded border-2 p-4 text-left transition-all ${on ? "border-brand-fresh bg-brand-fresh/10" : "border-border bg-card hover:border-primary/40"}`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded ${mobile ? `${brand.tint} ${brand.text}` : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
                {mobile ? <Smartphone className="h-6 w-6" aria-hidden="true" /> : <Banknote className="h-6 w-6" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  {mobile && <span className={`h-2.5 w-2.5 rounded-full ${brand.dot}`} aria-hidden="true" />}
                  {mobile ? brand.name : t("cod")}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{mobile ? t("mobileHint", { name: brand.name }) : t("codHint")}</span>
              </span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-brand-fresh bg-brand-fresh text-on-fresh" : "border-border"}`} aria-hidden="true">
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* mobile banking: where to send, then the transaction details */}
      {isMobile && selected && selectedBrand && (
        <div className={`animate-fade-slide-up space-y-4 rounded border-2 p-4 sm:p-5 ${selectedBrand.border} ${selectedBrand.tint}`}>
          {account ? (
            <>
              <div>
                <p className="text-xs font-bold text-muted-foreground">{t.rich("sendStep", { amount: total !== null ? formatMoney(total, locale) : t("sendTotal"), name: selectedBrand.name })}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded border border-border bg-card px-4 py-3">
                  <span className="font-mono text-xl font-black tracking-wide text-foreground">{account.number}</span>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${selectedBrand.tint} ${selectedBrand.text}`}>{ACCOUNT_TYPE[account.accountType] ? t(ACCOUNT_TYPE[account.accountType]) : account.accountType}</span>
                  <button type="button" onClick={() => copy(account.number)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded border border-border px-3 text-xs font-bold text-foreground transition-colors hover:border-brand-fresh hover:text-accent-text">
                    {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copied ? t("copied") : t("copy")}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.rich("inApp", { name: selectedBrand.name, how: SEND_HOW[account.accountType] ? t(SEND_HOW[account.accountType]) : t("howPersonal"), b: (c) => <b className="text-foreground">{c}</b> })}
                </p>
                {account.instructions && (
                  <p className="mt-2 flex items-start gap-2 whitespace-pre-line text-xs text-foreground/85">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                    {account.instructions}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-muted-foreground">{t("detailsStep")}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="trx-id" className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      {t("trxId")} <span className="text-accent-text">*</span>
                    </label>
                    <input id="trx-id" value={transactionId} onChange={(e) => onTransactionIdChange(e.target.value.replace(/\s/g, "").toUpperCase())} placeholder={t("trxPh")} autoComplete="off" maxLength={20} aria-invalid={touched && !trxOk} className={`${inputBase} font-mono uppercase ${touched && !trxOk ? "border-destructive/60" : ""}`} />
                    {touched && !trxOk && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{t("trxErr")}</p>}
                  </div>
                  <div>
                    <label htmlFor="trx-sender" className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      {t("senderLabel", { name: selectedBrand.name })} <span className="text-accent-text">*</span>
                    </label>
                    <input id="trx-sender" type="tel" inputMode="tel" value={senderNumber} onChange={(e) => onSenderNumberChange(e.target.value)} placeholder={t("phonePh")} autoComplete="tel" aria-invalid={touched && !senderOk} className={`${inputBase} ${touched && !senderOk ? "border-destructive/60" : ""}`} />
                    {touched && !senderOk && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{t("senderErr")}</p>}
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t("trxNote", { name: selectedBrand.name })}</p>
              </div>
            </>
          ) : (
            <p role="alert" className="text-sm font-medium text-destructive">{t("unavailable", { name: selectedBrand.name })}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack} className={`${btnGhost} flex-1`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </button>
        <button type="button" onClick={next} disabled={!selected || (isMobile && !account)} className={`${btnPrimary} flex-[2] ${!canContinue && selected ? "opacity-90" : ""}`}>
          {t("review")}
          <ArrowRight className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
