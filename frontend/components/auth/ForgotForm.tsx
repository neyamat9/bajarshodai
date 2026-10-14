"use client";

import { AuthSubmit, useMascotStatus } from "@/components/auth/AuthBits";
import AuthField from "@/components/auth/AuthField";
import { errorMessage } from "@/lib/api/client";
import { forgotPassword } from "@/lib/services/auth.service";
import { AlertCircle, ArrowLeft, Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** "Forgot your password?" inside the login modal (onBack switches back to sign-in). */
export default function ForgotForm({ onBack, initialEmail = "", onEmailChange }: { onBack: () => void; initialEmail?: string; onEmailChange?: (email: string) => void }) {
  const t = useTranslations("Auth");
  // the shared field may hold a mobile number from the sign-in form: a reset link needs an email
  const [email, setEmailState] = useState(initialEmail.includes("@") ? initialEmail : "");
  const setEmail = (v: string) => {
    setEmailState(v);
    onEmailChange?.(v);
  };
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useMascotStatus(busy, error, sent);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const backClass = "inline-flex items-center gap-1.5 font-bold text-accent-text hover:underline";

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="font-outfit text-2xl font-black tracking-tight text-primary dark:text-foreground">{t("forgotTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("forgotLead")}</p>
      </div>

      {sent ? (
        <p role="status" className="flex items-start gap-3 rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            {t.rich("forgotSent", { email, b: (c) => <b className="break-all">{c}</b> })}
          </span>
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField id="email" label={t("emailLabel")} icon={Mail} type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" disabled={busy} />
          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <AuthSubmit busy={busy} busyText={t("sending")} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())}>
            {t("sendLink")}
          </AuthSubmit>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t.rich("forgotNoEmail", { link: (c) => <Link href="/contact" className="font-bold text-accent-text hover:underline">{c}</Link> })}
      </p>

      <p className="mt-6 text-center text-sm">
        <button type="button" onClick={onBack} className={backClass}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("backToSignIn")}
        </button>
      </p>
    </div>
  );
}
