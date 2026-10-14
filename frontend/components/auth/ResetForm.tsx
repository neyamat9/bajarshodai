"use client";

import { AuthSubmit, useMascotStatus } from "@/components/auth/AuthBits";
import AuthField from "@/components/auth/AuthField";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { api, errorMessage } from "@/lib/api/client";
import { resetPassword } from "@/lib/services/auth.service";
import { AlertCircle, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * "Choose a new password" for the link in the reset email. Shown in the login modal
 * (the /reset-password page forwards to it). `onDone` runs after the password was changed;
 * `onRequestNew` is the "ask for a new link" action when the link has expired.
 */
export default function ResetForm({ token, onDone, onRequestNew }: { token: string; onDone: () => void; onRequestNew: () => void }) {
  const t = useTranslations("Auth");
  const [state, setState] = useState<"checking" | "ok" | "bad">("checking");
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useMascotStatus(busy, error);

  useEffect(() => {
    if (!token) {
      setState("bad");
      return;
    }
    api
      .get<{ valid: boolean }>(`/customer/auth/reset-password/verify?token=${encodeURIComponent(token)}`)
      .then((r) => setState(r?.valid ? "ok" : "bad"))
      .catch(() => setState("bad"));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return setError(t("resetShort"));
    if (pw !== again) return setError(t("resetMismatch"));
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, pw);
      toast.success(t("resetDone"));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="font-outfit text-2xl font-black tracking-tight text-primary dark:text-foreground">{t("resetTitle")}</h1>
      </div>

      {state === "checking" && <p className="text-center text-sm text-muted-foreground">{t("checkingLink")}</p>}

      {state === "bad" && (
        <p role="alert" className="text-center text-sm font-medium text-destructive">
          {t("linkInvalid")}{" "}
          <button type="button" onClick={onRequestNew} className="font-bold text-accent-text underline">
            {t("askNew")}
          </button>
          .
        </p>
      )}

      {state === "ok" && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField id="pw" label={t("newPassword")} icon={Lock} password value={pw} onChange={setPw} placeholder={t("newPasswordPh")} autoComplete="new-password" disabled={busy}>
            <PasswordStrengthMeter password={pw} />
          </AuthField>
          <AuthField id="pw2" label={t("repeat")} icon={Lock} password value={again} onChange={setAgain} placeholder={t("repeatPh")} autoComplete="new-password" disabled={busy} />
          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <AuthSubmit busy={busy} busyText={t("saving")}>
            {t("setPassword")}
          </AuthSubmit>
        </form>
      )}
    </div>
  );
}
