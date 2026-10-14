"use client";

import { useRouter } from "@/i18n/navigation";
import { useAuthModal } from "@/components/auth/AuthModal";
import { APIError, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/use-auth";
import type { CheckoutSummary } from "@/lib/services/checkout.service";
import { placeOrder } from "@/lib/services/orders.service";
import { MOBILE_METHODS, type CheckoutAddress, type PaymentMethod } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface Props {
  summary: CheckoutSummary;
  address: CheckoutAddress;
  paymentMethod: PaymentMethod;
  bkashTransactionId?: string;
  bkashSenderNumber?: string;
  couponCode?: string;
  onBack: () => void;
  /** after the order is saved and the cart is gone */
  onOrderPlaced: () => void;
}

const PAYMENT_CODE: Record<PaymentMethod, "CASH_ON_DELIVERY" | "BKASH" | "NAGAD" | "ROCKET"> = { "Cash on Delivery": "CASH_ON_DELIVERY", bKash: "BKASH", Nagad: "NAGAD", Rocket: "ROCKET" };

/** Step 3 — check everything and place the order. */
export default function OrderReview({ summary, address, paymentMethod, bkashTransactionId, bkashSenderNumber, couponCode, onBack, onOrderPlaced }: Props) {
  const t = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function place() {
    if (placing) return;
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder({
        paymentMethod: PAYMENT_CODE[paymentMethod],
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          address: address.address,
          division: address.division || undefined,
          district: address.district || undefined,
          upazila: address.upazila || undefined,
          city: address.district || undefined,
          postalCode: address.postalCode,
        },
        ...(MOBILE_METHODS.includes(paymentMethod) ? { bkashTransactionId, bkashSenderNumber } : {}),
        couponCode: couponCode || undefined,
        deliveryNote: note.trim() || undefined,
        email: !user && address.email ? address.email : undefined,
      });
      onOrderPlaced();
      router.push(`/orders/${order.id}?placed=1`);
    } catch (e) {
      // the login ended while the customer was filling the form: sign in again right here, everything they typed stays
      if (e instanceof APIError && e.status === 401) {
        setError(t("sessionEnded"));
        setPlacing(false);
        openAuth("login", { then: "stay", expired: true });
        return;
      }
      const m = errorMessage(e);
      setError(m);
      toast.error(m);
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground font-outfit">{t("reviewTitle")}</h2>
        <p className="text-sm text-muted-foreground/70 mt-1">{t("reviewLead")}</p>
      </div>

      <section className="rounded bg-muted border border-border p-4 text-sm text-foreground/80 space-y-0.5">
        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{t("deliverTo")}</h3>
        <p className="font-semibold text-foreground">{address.fullName}</p>
        <p>{address.phone}</p>
        <p>{address.address}</p>
        <p>{[address.upazila, address.district, address.division].filter(Boolean).join(", ")}{address.postalCode ? ` ${address.postalCode}` : ""}</p>
      </section>

      <section className="rounded bg-muted border border-border p-4 text-sm text-foreground/80">
        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{t("payment")}</h3>
        <p className="font-semibold text-foreground">{paymentMethod === "Cash on Delivery" ? t("cod") : paymentMethod}</p>
        {MOBILE_METHODS.includes(paymentMethod) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t.rich("trxLine", { trx: bkashTransactionId ?? "", sender: bkashSenderNumber ?? "", method: paymentMethod, b: (c) => <b className="text-foreground">{c}</b> })}
          </p>
        )}
        {paymentMethod === "Cash on Delivery" && <p className="mt-1 text-xs text-muted-foreground">{t("codLine", { amount: formatMoney(summary.total, locale) })}</p>}
      </section>

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-foreground/80">{t("note")}</label>
        <textarea id="note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePh")} className="w-full rounded border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-brand-fresh focus:outline-none" />
      </div>

      {summary.issues.length > 0 && (
        <div role="alert" className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {summary.issues.map((i) => <p key={i}>{i}</p>)}
        </div>
      )}
      {error && <p role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={placing} className="flex-1 py-3.5 rounded border border-border text-foreground/80 font-semibold text-sm hover:border-input hover:text-foreground disabled:opacity-30">
          {t("backArrow")}
        </button>
        <button type="button" onClick={place} disabled={placing || !summary.canPlaceOrder} className="flex-[2] py-3.5 rounded bg-brand-fresh text-foreground font-black text-sm hover:bg-brand-fresh/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_8px_24px_rgba(69,162,44,0.3)]">
          {placing ? t("placing") : t("placeOrder", { amount: formatMoney(summary.total, locale) })}
        </button>
      </div>
    </div>
  );
}
