"use client";

import { useRouter } from "@/i18n/navigation";
import RequireLogin, { PageShell, inputCls, primaryBtn } from "@/components/account/RequireLogin";
import { errorMessage } from "@/lib/api/client";
import { createTicket } from "@/lib/services/support.service";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const CATEGORIES = ["ORDER", "PAYMENT", "DELIVERY", "RETURN_WARRANTY", "PRODUCT", "ACCOUNT", "OTHER"] as const;

function Form() {
  const t = useTranslations("Support");
  const router = useRouter();
  const orderId = useSearchParams().get("order") ?? undefined;
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState(orderId ? "ORDER" : "OTHER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (subject.trim().length < 3) return setError(t("subjectShort"));
    if (message.trim().length < 10) return setError(t("messageShort"));
    setBusy(true);
    setError(null);
    try {
      const created = await createTicket({ subject: subject.trim(), message: message.trim(), category, orderId });
      toast.success(t("opened"));
      router.push(`/account/support/${created.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <PageShell eyebrow={t("eyebrow")} title={t("newTitle")} accent={t("newAccent")} back={{ href: "/account/support", label: t("tickets") }}>
      <form onSubmit={submit} noValidate className="space-y-5 rounded border border-border bg-muted p-6">
        {orderId && <p className="rounded bg-brand-fresh/10 px-4 py-2 text-xs text-accent-text">{t("linked")}</p>}
        <div>
          <label htmlFor="cat" className="mb-1.5 block text-xs font-black uppercase tracking-widest text-muted-foreground">{t("about")}</label>
          <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.map((v) => <option key={v} value={v}>{t(`cat${v}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sub" className="mb-1.5 block text-xs font-black uppercase tracking-widest text-muted-foreground">{t("subject")}</label>
          <input id="sub" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="msg" className="mb-1.5 block text-xs font-black uppercase tracking-widest text-muted-foreground">{t("help")}</label>
          <textarea id="msg" rows={6} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} />
        </div>
        {error && <p role="alert" className="text-sm font-bold text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? t("sending") : t("open")}</button>
      </form>
    </PageShell>
  );
}

export default function NewTicketPage() {
  return (
    <RequireLogin>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </RequireLogin>
  );
}
