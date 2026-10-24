"use client";

import { AuthSubmit, useMascotStatus } from "@/components/auth/AuthBits";
import AuthField from "@/components/auth/AuthField";
import { errorMessage } from "@/lib/api/client";
import { forgotPassword } from "@/lib/services/auth.service";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, MailCheck, Phone } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** "Forgot your password?" inside the login modal (onBack switches back to sign-in). */
export default function ForgotForm({ onBack, initialEmail = "", onEmailChange }: { onBack: () => void; initialEmail?: string; onEmailChange?: (email: string) => void }) {
  const t = useTranslations("Auth");
  const [identifier, setIdentifierState] = useState(initialEmail);
  const setIdentifier = (v: string) => {
    setIdentifierState(v);
    onEmailChange?.(v);
  };
  const [busy, setBusy] = useState(false);
  const [submittedType, setSubmittedType] = useState<"email" | "phone" | null>(null);
  const [submittedValue, setSubmittedValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clean = identifier.trim();
  const isEmail = /^\S+@\S+\.\S+$/.test(clean);
  const isPhone = /^(\+?88)?01[3-9]\d{8}$/.test(clean.replace(/[\s-]/g, ""));
  const isValid = isEmail || isPhone;

  useMascotStatus(busy, error, !!submittedType);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(clean);
      setSubmittedType(isEmail ? "email" : "phone");
      setSubmittedValue(clean);
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

      {submittedType ? (
        <div role="status" className="flex items-start gap-3 rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-800 dark:text-emerald-200">
          {submittedType === "email" ? (
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          )}
          <span>
            {submittedType === "email"
              ? t.rich("forgotSent", { email: submittedValue, b: (c) => <b className="break-all">{c}</b> })
              : t.rich("forgotPhoneSent", { phone: submittedValue, b: (c) => <b className="break-all">{c}</b> })}
          </span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField
            id="identifier"
            label={t("forgotInputLabel")}
            icon={isPhone ? Phone : Mail}
            type="text"
            value={identifier}
            onChange={setIdentifier}
            placeholder={t("forgotInputPh")}
            autoComplete="username"
            disabled={busy}
          />
          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <AuthSubmit busy={busy} busyText={t("sending")} disabled={!isValid}>
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
