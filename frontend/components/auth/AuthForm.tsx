"use client";

import AuthField from "@/components/auth/AuthField";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { useBlockClose } from "@/components/auth/auth-busy";
import { useMascot } from "@/components/auth/RobotMascot";
import { latinDigits } from "@/lib/format";
import { useAuth } from "@/lib/hooks/use-auth";
import { AlertCircle, ArrowRight, Check, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  /** Show the "session ended" notice */
  expired?: boolean;
  /** Called once the success celebration is over (the modal then closes / moves on) */
  onSuccess: () => void;
  /** Start with this phone/email and report edits, so it survives switching between the modal's forms */
  initialEmail?: string;
  onEmailChange?: (value: string) => void;
  /** Switch between login, sign-up and forgot-password inside the modal */
  onSwitchMode: (mode: AuthMode | "forgot") => void;
}

interface FormState {
  name: string;
  /** login: phone or email · sign-up: the optional email */
  email: string;
  identifier: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  identifier?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

const BD_MOBILE = /^(\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AuthForm — handles both login and signup modes.
 *
 * - Customers sign in with their mobile number (an email also works if the account has one) and a password.
 *   Signing up needs a name, a mobile number and a password; the email is optional.
 * - Bright, colourful card contents; the robot mascot (rendered by AuthShell) reacts to what happens here:
 *   it watches text fields, covers its eyes on password fields, thinks while submitting,
 *   cheers on success and looks sad when an attempt fails.
 * - Failure: shake animation + inline error · Success: check mark + page fade-out → redirect.
 */
export default function AuthForm({ mode, expired = false, initialEmail = "", onEmailChange, onSuccess, onSwitchMode }: AuthFormProps) {
  const t = useTranslations("Auth");
  const { login, signup, loginWithGoogle } = useAuth();
  const mascot = useMascot();

  const [form, setForm] = useState<FormState>({ name: "", email: "", identifier: initialEmail, phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const formRef = useRef<HTMLFormElement>(null);

  // the robot mirrors the submit state
  useEffect(() => {
    mascot.setStatus(submitStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitStatus]);

  function setField(field: keyof FormState, value: string) {
    // Bangla digits typed on a phone keyboard become ordinary digits (the server only knows those)
    if (field === "phone") value = latinDigits(value);
    if (field === "identifier") {
      value = /[A-Za-z@]/.test(value) ? value : latinDigits(value);
      onEmailChange?.(value);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (mode === "signup") {
      if (!form.name.trim()) errs.name = t("errName");
      else if (form.name.trim().length < 2) errs.name = t("errNameShort");

      if (!form.phone.trim()) errs.phone = t("errPhoneRequired");
      else if (!BD_MOBILE.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = t("errPhone");

      if (form.email.trim() && !EMAIL.test(form.email.trim())) errs.email = t("errEmail");
    } else {
      const id = form.identifier.trim();
      if (!id) errs.identifier = t("errIdentifier");
      else if (id.includes("@") ? !EMAIL.test(id) : !BD_MOBILE.test(id.replace(/[\s-]/g, ""))) errs.identifier = t("errIdentifier");
    }

    if (!form.password) errs.password = t("errPassword");
    else if (mode === "signup" && form.password.length < 6) errs.password = t("errPasswordShort");

    if (mode === "signup") {
      if (!form.confirmPassword) errs.confirmPassword = t("errConfirm");
      else if (form.password !== form.confirmPassword) errs.confirmPassword = t("errMismatch");
    }

    return errs;
  }

  function triggerShake() {
    const el = formRef.current;
    if (!el) return;
    el.classList.remove("animate-shake");
    void el.offsetWidth; // force reflow
    el.classList.add("animate-shake");
    setTimeout(() => el.classList.remove("animate-shake"), 450);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerShake();
      mascot.setStatus("error");
      return;
    }

    setSubmitStatus("loading");
    setErrors({});

    try {
      const result =
        mode === "login"
          ? await login(form.identifier.trim(), form.password)
          : await signup({ name: form.name.trim(), phone: form.phone.replace(/[\s-]/g, ""), email: form.email.trim() || undefined, password: form.password });

      if (result.success) {
        setSubmitStatus("success");
        if (mode === "signup") toast.success(t("welcomeToast"), { duration: 3000 });
        else toast.success(t("welcomeBackToast"), { duration: 2500 });

        // let the robot celebrate for a moment, then the modal moves on
        setTimeout(onSuccess, 1100);
      } else {
        setSubmitStatus("error");
        setErrors({ general: result.error ?? t("errGeneral") });
        triggerShake();
        setTimeout(() => setSubmitStatus("idle"), 500);
      }
    } catch {
      setSubmitStatus("error");
      setErrors({ general: t("errUnexpected") });
      triggerShake();
      setTimeout(() => setSubmitStatus("idle"), 500);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    setSubmitStatus("loading");
    setErrors({});
    try {
      const result = await loginWithGoogle(idToken);
      if (result.success) {
        setSubmitStatus("success");
        if (mode === "signup") toast.success(t("welcomeToast"), { duration: 3000 });
        else toast.success(t("welcomeBackToast"), { duration: 2500 });
        setTimeout(onSuccess, 1100);
      } else {
        setSubmitStatus("error");
        setErrors({ general: result.error ?? t("errGeneral") });
        triggerShake();
        setTimeout(() => setSubmitStatus("idle"), 500);
      }
    } catch {
      setSubmitStatus("error");
      setErrors({ general: t("errUnexpected") });
      triggerShake();
      setTimeout(() => setSubmitStatus("idle"), 500);
    }
  }

  const isLoading = submitStatus === "loading";
  const isSuccess = submitStatus === "success";
  const off = isLoading || isSuccess;
  useBlockClose(off);

  // "This phone number already has an account" → offer the way out (the message may be in Bangla)
  const alreadyRegistered = mode === "signup" && /already|exist|registered|taken|আগেই|আগে/i.test(errors.general ?? "");

  const accent = (c: React.ReactNode) => <span className="text-brand-fresh">{c}</span>;

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="font-outfit text-3xl font-black tracking-tight text-primary dark:text-foreground">
          {mode === "login" ? t.rich("welcomeBack", { accent }) : t.rich("createAccount", { accent })}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? t("loginLead") : t("signupLead")}</p>
      </div>

      {expired && mode === "login" && (
        <p role="status" className="mb-5 rounded border border-brand-fresh/40 bg-brand-fresh/10 px-4 py-3 text-sm font-medium text-accent-text">
          {t("expired")}
        </p>
      )}

      {errors.general && (
        <div className="mb-5 flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{errors.general}</span>
          {alreadyRegistered && (
            <button type="button" onClick={() => onSwitchMode("login")} className="shrink-0 font-bold underline">
              {t("signInInstead")}
            </button>
          )}
        </div>
      )}

      {/* 1-Click Google Sign-In */}
      {Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) && (
        <div className="mb-5 space-y-3">
          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => {
              setErrors({ general: err });
              triggerShake();
            }}
            disabled={off}
          />
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
              {t("orContinueWith")}
            </span>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        {mode === "signup" && (
          <AuthField id="name" label={t("fullName")} icon={User} value={form.name} onChange={(v) => setField("name", v)} placeholder={t("fullNamePh")} autoComplete="name" error={errors.name} disabled={off} />
        )}

        {mode === "login" ? (
          <AuthField id="identifier" label={t("identifier")} icon={Phone} value={form.identifier} onChange={(v) => setField("identifier", v)} placeholder={t("identifierPh")} autoComplete="username" inputMode="text" error={errors.identifier} disabled={off} />
        ) : (
          <AuthField id="phone" label={t("phone")} icon={Phone} type="tel" inputMode="tel" value={form.phone} onChange={(v) => setField("phone", v)} placeholder={t("phonePh")} autoComplete="tel" error={errors.phone} disabled={off} />
        )}

        {mode === "signup" && (
          <AuthField id="email" label={t("emailOptional")} icon={Mail} type="email" value={form.email} onChange={(v) => setField("email", v)} placeholder="you@example.com" autoComplete="email" error={errors.email} disabled={off}>
            {!errors.email && <p className="mt-1.5 text-xs text-muted-foreground">{t("emailHint")}</p>}
          </AuthField>
        )}

        <AuthField
          id="password"
          label={t("password")}
          icon={Lock}
          password
          value={form.password}
          onChange={(v) => setField("password", v)}
          placeholder={mode === "login" ? t("passwordPhLogin") : t("passwordPhSignup")}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          error={errors.password}
          disabled={off}
        >
          {mode === "signup" && <PasswordStrengthMeter password={form.password} />}
        </AuthField>

        {mode === "signup" && (
          <AuthField id="confirmPassword" label={t("confirm")} icon={Lock} password value={form.confirmPassword} onChange={(v) => setField("confirmPassword", v)} placeholder={t("confirmPh")} autoComplete="new-password" error={errors.confirmPassword} disabled={off} />
        )}

        {mode === "login" && (
          <div className="text-right">
            <button type="button" onClick={() => onSwitchMode("forgot")} className="text-sm font-semibold text-primary transition-colors hover:text-accent-text dark:text-brand-fresh">
              {t("forgot")}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={off}
          className={`group relative mt-1 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded py-3.5 text-base font-bold text-white transition-all duration-300 disabled:cursor-not-allowed ${
            isSuccess
              ? "bg-emerald-600 shadow-[0_10px_28px_-8px_rgba(5,150,105,0.7)]"
              : "bg-linear-to-r from-primary to-brand-deep-light shadow-[0_12px_28px_-10px_rgba(11,98,52,0.8)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-10px_rgba(69,162,44,0.6)]"
          }`}
        >
          {!off && <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-[420%]" aria-hidden="true" />}
          <span className="relative flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {isSuccess && <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />}
            {isLoading ? t("wait") : isSuccess ? (mode === "login" ? t("signedIn") : t("created")) : mode === "login" ? t("signIn") : t("createBtn")}
            {!off && <ArrowRight className="h-5 w-5 text-brand-fresh transition-transform group-hover:translate-x-1" aria-hidden="true" />}
          </span>
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            {t("noAccount")}{" "}
            <button type="button" onClick={() => onSwitchMode("signup")} className="font-bold text-accent-text hover:underline">
              {t("signUpFree")}
            </button>
          </>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <button type="button" onClick={() => onSwitchMode("login")} className="font-bold text-accent-text hover:underline">
              {t("signIn")}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
