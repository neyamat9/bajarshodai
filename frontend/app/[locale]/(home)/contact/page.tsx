"use client";

import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { sendContactMessage } from "@/lib/services/support.service";
import { getSiteSettings, type SiteSettings } from "@/lib/services/site.service";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { latinDigits } from "@/lib/format";

const input = "w-full rounded border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-brand-fresh";

export default function ContactPage() {
  const t = useTranslations("Contact");
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);
  useEffect(() => {
    if (user) setF((p) => ({ ...p, name: p.name || user.name, email: p.email || user.email, phone: p.phone || user.phone }));
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setError(t("errName"));
    const hasEmail = f.email.trim().length > 0;
    const hasPhone = f.phone.trim().length > 0;
    if (!hasEmail && !hasPhone) return setError(t("errContact"));
    if (hasEmail && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError(t("errEmail"));
    if (hasPhone && !/^(\+?88)?01[3-9]\d{8}$/.test(latinDigits(f.phone).replace(/[\s-]/g, ""))) return setError(t("errPhone"));
    if (f.subject.trim().length < 3) return setError(t("errSubject"));
    if (f.message.trim().length < 10) return setError(t("errMessage"));
    setBusy(true);
    setError(null);
    try {
      await sendContactMessage({
        name: f.name.trim(),
        email: hasEmail ? f.email.trim() : undefined,
        phone: hasPhone ? latinDigits(f.phone).replace(/[\s-]/g, "") : undefined,
        subject: f.subject.trim(),
        message: f.message.trim(),
        website: f.website || undefined,
      });
      setDone(true);
      toast.success(t("sent"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const s = settings?.site;
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent-text">{t("help")}</p>
          <h1 className="font-outfit text-4xl font-black tracking-tight text-foreground">{t.rich("title", { accent: (c) => <span className="text-accent-text">{c}</span> })}</h1>
          <p className="mt-2 text-sm text-muted-foreground/70">{t("lead")}</p>

          {done ? (
            <p role="status" className="mt-8 rounded border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm text-emerald-200">{t.rich("thanks", { contact: f.phone || f.email, b: (c) => <b>{c}</b> })}</p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="c-name" className="sr-only">{t("name")}</label><input id="c-name" placeholder={t("namePh")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} /></div>
                <div><label htmlFor="c-phone" className="sr-only">{t("phone")}</label><input id="c-phone" inputMode="tel" placeholder={t("phonePh")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={input} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="c-email" className="sr-only">{t("email")}</label><input id="c-email" type="email" placeholder={t("emailPh")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} /></div>
                <div><label htmlFor="c-sub" className="sr-only">{t("subject")}</label><input id="c-sub" placeholder={t("subject")} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={input} /></div>
              </div>
              <div><label htmlFor="c-msg" className="sr-only">{t("message")}</label><textarea id="c-msg" rows={6} maxLength={5000} placeholder={t("messagePh")} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={input} /></div>
              {/* honeypot: real visitors never see or fill this */}
              <div aria-hidden="true" className="absolute -left-[9999px]"><label>{t("website")}<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label></div>
              {error && <p role="alert" className="text-sm font-bold text-red-400">{error}</p>}
              <button type="submit" disabled={busy} className="rounded bg-brand-fresh px-8 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-brand-fresh/90 disabled:opacity-60">{busy ? t("sending") : t("send")}</button>
            </form>
          )}
        </div>

        <aside className="space-y-3 rounded border border-border bg-muted p-6 text-sm text-foreground/80 h-fit">
          <h2 className="font-outfit text-lg font-black text-foreground">{s?.storeName ?? "Bazar Shodai"}</h2>
          {s?.hotline && <p>{t("hotline")}<br /><a className="font-bold text-accent-text" href={`tel:${s.hotline.replace(/[^\d+]/g, "")}`}>{s.hotline}</a></p>}
          {s?.whatsapp && <p>{t("whatsapp")}<br /><b className="text-foreground">{s.whatsapp}</b></p>}
          {s?.contactEmail && <p>{t("emailLabel")}<br /><a className="font-bold text-accent-text" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></p>}
          {s?.businessHours && <p>{t("hours")}<br /><b className="text-foreground">{s.businessHours}</b></p>}
          {s?.address && <p>{t("address")}<br /><b className="text-foreground">{s.address}</b></p>}
        </aside>
      </div>
    </div>
  );
}
