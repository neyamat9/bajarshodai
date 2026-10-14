"use client";

import { useTranslations } from "next-intl";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { notifyWhenBackInStock } from "@/lib/services/support.service";
import { useState } from "react";
import { toast } from "sonner";

// Shown when an item is sold out: we email the customer when it returns.
export default function BackInStockForm({ productId, variantId }: { productId: string; variantId?: string }) {
  const t = useTranslations("Product");
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await notifyWhenBackInStock({ productId, variantId, ...(user ? {} : { email: email.trim() }) });
      setDone(true);
      toast.success(t("bis.saved"));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">You&apos;re on the list. We&apos;ll email you when it is back.</p>;
  }
  return (
    <form onSubmit={submit} className="rounded border border-brand-fresh/30 bg-brand-fresh/5 p-4">
      <p className="mb-3 text-sm font-bold text-foreground">Sold out — get an email when it returns</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {!user && (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("bis.placeholder")}
            className="h-11 flex-1 rounded border border-border bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-brand-fresh focus:outline-none"
          />
        )}
        <button type="submit" disabled={busy} className="h-11 rounded bg-brand-fresh px-6 text-sm font-black uppercase tracking-wide text-foreground hover:bg-brand-fresh/90 disabled:opacity-60">
          {busy ? t("bis.saving") : t("bis.notify")}
        </button>
      </div>
    </form>
  );
}
