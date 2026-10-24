import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, ShieldCheck, UserRound, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { errorMessage } from "@/api/client";
import { useAuth } from "@/store/auth";
import { AuthInput, AuthShell, authButton } from "./AuthShell";
import { tr } from "@/i18n";

const schema = z.object({
  identifier: z.string().min(1, "Enter your phone number or email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const login = useAuth((s) => s.login);
  const verify2FA = useAuth((s) => s.verify2FA);
  const navigate = useNavigate();
  const loc = useLocation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caps, setCaps] = useState(false);

  // 2FA state
  const [twoFactorData, setTwoFactorData] = useState<{ tempToken: string; maskedEmail?: string; remember?: boolean } | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async (v) => {
    setError(null);
    try {
      const res = await login(v.identifier, v.password, !!v.remember);
      if (res.requires2FA && res.tempToken) {
        setTwoFactorData({ tempToken: res.tempToken, maskedEmail: res.maskedEmail, remember: !!v.remember });
        return;
      }
      toast.success(tr("Welcome back"));
      navigate((loc.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (e) {
      setError(errorMessage(e, "Could not sign in"));
    }
  });

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFactorData || otp.trim().length !== 6) return;
    setError(null);
    setIsVerifying(true);
    try {
      await verify2FA(twoFactorData.tempToken, otp.trim(), twoFactorData.remember);
      toast.success(tr("Welcome back"));
      navigate((loc.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (e) {
      setError(errorMessage(e, "Invalid or expired verification code"));
    } finally {
      setIsVerifying(false);
    }
  }

  if (twoFactorData) {
    return (
      <AuthShell
        title={tr("Two-Factor Verification")}
        subtitle={twoFactorData.maskedEmail ? `Enter the 6-digit code sent to ${twoFactorData.maskedEmail}` : "Enter the 6-digit code sent to your email."}
      >
        <form onSubmit={submitOtp} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded border border-destructive/30 bg-red-50 px-3 py-2.5 text-sm text-destructive dark:bg-red-500/10">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Field>
            <AuthInput
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              label={tr("6-Digit Code")}
              icon={<ShieldCheck />}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center font-mono text-xl tracking-widest"
            />
          </Field>
          <Button type="submit" className={`group w-full ${authButton}`} loading={isVerifying} disabled={otp.length !== 6}>
            Verify and sign in <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Button>
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setTwoFactorData(null);
                setOtp("");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to sign in
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={tr("Welcome back")} subtitle={tr("Sign in to manage your store.")}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded border border-destructive/30 bg-red-50 px-3 py-2.5 text-sm text-destructive dark:bg-red-500/10">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Field error={errors.identifier?.message}>
          <AuthInput id="identifier" type="text" inputMode="email" autoComplete="username" autoFocus label={tr("Phone number or email")} icon={<UserRound />} aria-invalid={!!errors.identifier} {...register("identifier")} />
        </Field>
        <Field error={errors.password?.message}>
          <AuthInput
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            label={tr("Password")}
            icon={<KeyRound />}
            aria-invalid={!!errors.password}
            onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
            {...register("password", { onBlur: () => setCaps(false) })}
            right={
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="flex size-9 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={show ? tr("Hide password") : tr("Show password")}
              >
                {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            }
          />
          {caps && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              <TriangleAlert className="size-3" />{" "}{tr("Caps Lock is on")}
            </p>
          )}
        </Field>
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-muted-foreground">
            <input type="checkbox" className="peer sr-only" {...register("remember")} />
            <span className="flex size-[18px] items-center justify-center rounded border border-input bg-card text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-ring/20 dark:peer-checked:border-fresh-500 dark:peer-checked:bg-fresh-500 dark:peer-checked:text-fresh-950">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {tr("Remember me")}
          </label>
          <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline dark:text-fresh-400">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className={`group w-full ${authButton}`} loading={isSubmitting}>
          Sign in <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>
    </AuthShell>
  );
}
