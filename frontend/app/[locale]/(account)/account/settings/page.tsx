"use client";

import AddressBook from "@/components/account/AddressBook";
import ChangePassword from "@/components/account/ChangePassword";
import RequireLogin from "@/components/account/RequireLogin";
import { btnPrimary, card, PageHeading } from "@/components/account/ui";
import AuthField from "@/components/auth/AuthField";
import { useAuth } from "@/lib/hooks/use-auth";
import { AlertCircle, Mail, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { latinDigits } from "@/lib/format";

function ProfileCard() {
  const t = useTranslations("Account");
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pick up the saved profile when it arrives / changes
  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.email]);

  const dirty = name.trim() !== (user?.name ?? "") || email.trim() !== (user?.email ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(t("errName"));
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t("errEmail"));
    setBusy(true);
    setError(null);
    const r = await updateProfile({ name: name.trim(), email: email.trim() });
    setBusy(false);
    if (r.success) toast.success(t("updated"));
    else setError(r.error ?? t("updateFailed"));
  }

  return (
    <form onSubmit={save} noValidate className={`${card} p-5 sm:p-6`}>
      <h2 className="font-outfit text-lg font-black text-foreground">{t("personal")}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{t("personalSub")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField id="profile-name" label={t("fullName")} icon={User} value={name} onChange={setName} placeholder={t("fullNamePh")} autoComplete="name" disabled={busy} />
        <AuthField id="profile-phone" label={t("phone")} icon={Phone} type="tel" value={latinDigits(user?.phone ?? "")} onChange={() => {}} disabled />
        <div className="sm:col-span-2">
          <AuthField id="profile-email" label={t("email")} icon={Mail} type="email" value={email} onChange={setEmail} placeholder={t("emailPh")} autoComplete="email" disabled={busy}>
            <p className="mt-1.5 text-xs text-muted-foreground">{t("emailHint")}</p>
          </AuthField>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !dirty} className={`${btnPrimary} mt-5 w-full sm:w-auto`}>
        {busy ? t("saving") : t("save")}
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const t = useTranslations("Account");
  return (
    <RequireLogin>
      <PageHeading title={t("settingsTitleLead")} accent={t("settingsTitleAccent")} subtitle={t("settingsSub")} />
      <div className="space-y-6">
        <ProfileCard />
        <AddressBook />
        <ChangePassword />
      </div>
    </RequireLogin>
  );
}
