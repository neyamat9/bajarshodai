"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { latinDigits } from "@/lib/format";
import type { SavedAddress } from "@/lib/services/addresses.service";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PickedLocation } from "@/lib/types";

/** What step 1 collects: who and which house. The pin comes in step 2. */
export interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  landmark: string;
}

interface ShippingFormProps {
  initialData?: Partial<DeliveryDetails>;
  /** the customer's saved addresses (already loaded by the checkout page) */
  saved: SavedAddress[];
  /** a saved address was picked: its pin (if it has one) is used in step 2 */
  onPickSaved?: (location: PickedLocation | null) => void;
  onSubmit: (data: DeliveryDetails) => void;
}

type Errors = Partial<Record<keyof DeliveryDetails, string>>;

const input = (bad: boolean) =>
  [
    "w-full px-4 py-3 rounded bg-muted border text-foreground placeholder:text-muted-foreground/70 text-sm transition-all duration-200 outline-none focus:bg-secondary",
    bad ? "border-red-500/60 focus:border-red-500" : "border-border focus:border-brand-fresh focus:shadow-[0_0_0_3px_rgba(69,162,44,0.15)]",
  ].join(" ");

function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground/80 mb-1.5">
        {label}
        {required && <span className="text-accent-text ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const asPin = (a: SavedAddress): PickedLocation | null =>
  a.latitude != null && a.longitude != null ? { lat: a.latitude, lng: a.longitude, accuracyM: a.accuracyM, source: a.locationSource ?? "PIN", placeName: a.placeName, landmark: a.landmark } : null;

/** Step 1 — who and which house. The map comes next. */
export default function ShippingForm({ initialData, saved, onPickSaved, onSubmit }: ShippingFormProps) {
  const t = useTranslations("Checkout");
  const { user } = useAuth();
  const [f, setF] = useState<DeliveryDetails>({
    fullName: initialData?.fullName ?? user?.name ?? "",
    phone: initialData?.phone ?? user?.phone ?? "",
    address: initialData?.address ?? "",
    landmark: initialData?.landmark ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});

  function set<K extends keyof DeliveryDetails>(k: K, v: DeliveryDetails[K]) {
    setF((p) => ({ ...p, [k]: k === "phone" ? latinDigits(v) : v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function fillFrom(a: SavedAddress) {
    setF({ fullName: a.fullName, phone: a.phone, address: a.line1, landmark: a.landmark ?? "" });
    setErrors({});
    onPickSaved?.(asPin(a));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (f.fullName.trim().length < 2) e.fullName = t("errName");
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(latinDigits(f.phone).replace(/[\s-]/g, ""))) e.phone = t("errPhone");
    if (f.address.trim().length < 5) e.address = t("errAddress");
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSubmit({ fullName: f.fullName.trim(), phone: latinDigits(f.phone).replace(/[\s-]/g, ""), address: f.address.trim(), landmark: f.landmark.trim() });
  }

  const isPicked = (a: SavedAddress) => f.address === a.line1 && f.phone === a.phone;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground font-outfit">{t("detailsTitle")}</h2>
        <p className="text-sm text-muted-foreground/70 mt-1">{t("detailsLead")}</p>
        {saved.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{t("prefilled")}</p>}
      </div>

      {saved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {saved.map((a) => (
            <button key={a.id} type="button" onClick={() => fillFrom(a)} aria-pressed={isPicked(a)} className={`rounded border-2 px-3 py-2 text-left text-xs text-foreground/80 transition-colors hover:border-brand-fresh/60 ${isPicked(a) ? "border-brand-fresh bg-brand-fresh/10" : "border-border bg-card"}`}>
              <b className="block text-foreground">{a.label || a.fullName}</b>
              {a.line1}
              {a.placeName ? ` · ${a.placeName}` : ""}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={t("fullName")} required error={errors.fullName}>
          <input id="fullName" autoComplete="name" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder={t("fullNamePh")} className={input(!!errors.fullName)} aria-invalid={!!errors.fullName} />
        </Field>
        <Field id="phone" label={t("phone")} required error={errors.phone}>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("phonePh")} className={input(!!errors.phone)} aria-invalid={!!errors.phone} />
        </Field>
      </div>

      <Field id="address" label={t("address")} required error={errors.address} hint={t("addressHint")}>
        <input id="address" autoComplete="street-address" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder={t("addressPh")} className={input(!!errors.address)} aria-invalid={!!errors.address} />
      </Field>

      <Field id="landmark" label={t("landmark")} hint={t("landmarkHint")}>
        <input id="landmark" value={f.landmark} maxLength={200} onChange={(e) => set("landmark", e.target.value)} placeholder={t("landmarkPh")} className={input(false)} />
      </Field>

      <button type="submit" className="w-full py-4 rounded bg-brand-fresh text-foreground font-black text-base hover:bg-brand-fresh/90 active:scale-[0.97] transition-all shadow-[0_8px_24px_rgba(69,162,44,0.3)]">
        {t("continueLocation")}
      </button>
    </form>
  );
}
