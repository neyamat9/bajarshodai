"use client";

import AuthField from "@/components/auth/AuthField";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { btnPrimary, card } from "@/components/account/ui";
import { errorMessage } from "@/lib/api/client";
import { changePassword } from "@/lib/services/auth.service";
import { useAuth } from "@/lib/hooks/use-auth";
import { AlertCircle, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function ChangePassword() {
  const t = useTranslations("Account");
  const { user, updateProfile } = useAuth();
  const hasPassword = Boolean(user?.hasPassword);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword && !cur) return setError(t("pwCurrent"));
    if (next.length < 6) return setError(t("pwShort"));
    if (next !== again) return setError(t("pwMismatch"));
    if (hasPassword && next === cur) return setError(t("pwSame"));
    setBusy(true);
    setError(null);
    try {
      const res = await changePassword(hasPassword ? cur : undefined, next);
      if (res && res.success === false) {
        setError(res.message || t("updateFailed"));
        return;
      }
      toast.success(hasPassword ? t("pwChanged") : t("pwSetSuccess"));
      setCur("");
      setNext("");
      setAgain("");
      if (!hasPassword) {
        void updateProfile({ hasPassword: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !busy && Boolean(next) && Boolean(again) && (!hasPassword || Boolean(cur));

  return (
    <form id="security" onSubmit={submit} noValidate className={`${card} scroll-mt-40 p-5 sm:p-6`}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-outfit text-lg font-black text-foreground">
            {hasPassword ? t("pwTitle") : t("pwSetTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasPassword ? t("pwSub") : t("pwSetSub")}
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {hasPassword && (
          <div className="lg:col-span-2">
            <AuthField
              id="cur-pw"
              label={t("pwCurrent")}
              icon={KeyRound}
              password
              value={cur}
              onChange={setCur}
              autoComplete="current-password"
              disabled={busy}
            />
          </div>
        )}
        <AuthField
          id="new-pw"
          label={t("pwNew")}
          icon={Lock}
          password
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          disabled={busy}
        >
          <PasswordStrengthMeter password={next} />
        </AuthField>
        <AuthField
          id="again-pw"
          label={t("pwAgain")}
          icon={Lock}
          password
          value={again}
          onChange={setAgain}
          autoComplete="new-password"
          disabled={busy}
        />
      </div>
      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <button type="submit" disabled={!canSubmit} className={`${btnPrimary} mt-5 w-full sm:w-auto`}>
        {busy ? t("saving") : hasPassword ? t("pwUpdate") : t("pwSetBtn")}
      </button>
    </form>
  );
}
