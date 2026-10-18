"use client";

import { btnGhost, btnOrange, card, inputBase, Skeleton } from "@/components/account/ui";
import LocationPicker from "@/components/location/LocationPicker";
import { errorMessage } from "@/lib/api/client";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressInput,
  type SavedAddress,
} from "@/lib/services/addresses.service";
import { latinDigits } from "@/lib/format";
import type { PickedLocation } from "@/lib/types";
import { AlertCircle, Briefcase, Home, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface FormState {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  landmark: string;
  postalCode: string;
  isDefault: boolean;
}

const EMPTY: FormState = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  landmark: "",
  postalCode: "",
  isDefault: false,
};

function AddressForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: SavedAddress;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Addresses");
  const [f, setF] = useState<FormState>(
    initial
      ? {
          label: initial.label ?? "",
          fullName: initial.fullName,
          phone: initial.phone,
          line1: initial.line1,
          landmark: initial.landmark ?? "",
          postalCode: initial.postalCode ?? "",
          isDefault: initial.isDefault,
        }
      : EMPTY,
  );

  const [loc, setLoc] = useState<PickedLocation | null>(() =>
    initial?.latitude != null && initial?.longitude != null
      ? {
          lat: initial.latitude,
          lng: initial.longitude,
          placeName: initial.placeName ?? initial.line1,
          landmark: initial.landmark ?? undefined,
          accuracyM: initial.accuracyM ?? undefined,
          source: initial.locationSource ?? "PIN",
        }
      : null,
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = (newLoc: PickedLocation | null) => {
    setLoc(newLoc);
    if (newLoc) {
      if (!f.line1.trim() && newLoc.placeName) {
        setF((prev) => ({ ...prev, line1: newLoc.placeName ?? "" }));
      }
      if (!f.landmark.trim() && newLoc.landmark) {
        setF((prev) => ({ ...prev, landmark: newLoc.landmark ?? "" }));
      }
    }
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.fullName.trim().length < 2) return setError(t("errNameAddress"));
    const normalizedPhone = latinDigits(f.phone).replace(/[\s-]/g, "");
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(normalizedPhone)) return setError(t("errPhone"));
    if (f.line1.trim().length < 3 && !loc?.placeName) return setError(t("errNameAddress"));

    setBusy(true);
    setError(null);

    const body: AddressInput = {
      label: f.label.trim() || undefined,
      fullName: f.fullName.trim(),
      phone: normalizedPhone,
      line1: f.line1.trim() || loc?.placeName || "Shahrasti, Chandpur",
      landmark: f.landmark.trim() || loc?.landmark || undefined,
      postalCode: f.postalCode.trim() || undefined,
      district: "Chandpur",
      upazila: "Shahrasti",
      city: "Shahrasti",
      division: "Chittagong",
      isDefault: f.isDefault,
      latitude: loc?.lat ?? undefined,
      longitude: loc?.lng ?? undefined,
      placeName: loc?.placeName ?? undefined,
      accuracyM: loc?.accuracyM ?? undefined,
      locationSource: loc?.source ?? undefined,
    };

    try {
      if (initial) await updateAddress(initial.id, body);
      else await createAddress(body);
      toast.success(t("saved"));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const lbl = "mb-1.5 block text-xs font-bold text-muted-foreground";

  return (
    <form onSubmit={save} noValidate className="animate-fade-slide-up space-y-5 rounded border-2 border-brand-fresh/40 bg-background p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-outfit text-base font-black text-foreground">
          {initial ? t("editTitle") : t("newTitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>{t("label")}</label>
          <input
            aria-label={t("label")}
            placeholder={t("labelPh")}
            value={f.label}
            onChange={(e) => setF({ ...f, label: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={lbl}>{t("fullName")} *</label>
          <input
            aria-label={t("fullName")}
            placeholder={t("fullNamePh")}
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={lbl}>{t("phone")} *</label>
          <input
            aria-label={t("phone")}
            inputMode="tel"
            placeholder="01XXXXXXXXX"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={lbl}>{t("postalCode")}</label>
          <input
            aria-label={t("postalCode")}
            inputMode="numeric"
            placeholder={t("postalPh")}
            maxLength={4}
            value={f.postalCode}
            onChange={(e) => setF({ ...f, postalCode: e.target.value })}
            className={inputBase}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>{t("address")} *</label>
          <input
            aria-label={t("address")}
            placeholder={t("addressPh")}
            value={f.line1}
            onChange={(e) => setF({ ...f, line1: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={lbl}>{t("landmark")}</label>
          <input
            aria-label={t("landmark")}
            placeholder={t("landmarkPh")}
            value={f.landmark}
            onChange={(e) => setF({ ...f, landmark: e.target.value })}
            className={inputBase}
          />
        </div>
      </div>

      {/* Interactive Map & GPS Location Picker */}
      <div className="rounded border border-border/80 bg-muted/30 p-3.5 sm:p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-fresh shrink-0" />
          <span className="text-xs font-bold text-foreground">{t("mapLocation")}</span>
        </div>
        <LocationPicker value={loc} onChange={handleLocationChange} />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={!!f.isDefault}
          onChange={(e) => setF({ ...f, isDefault: e.target.checked })}
          className="h-4 w-4 accent-(--brand-fresh)"
        />
        {t("makeDefaultCheck")}
      </label>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={busy} className={btnOrange}>
          {busy ? t("saving") : t("save")}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

const iconFor = (label: string | null) =>
  /office|work|দোকান|অফিস/i.test(label ?? "")
    ? Briefcase
    : /home|house|বাসা|বাড়ি/i.test(label ?? "")
      ? Home
      : MapPin;

export default function AddressBook() {
  const t = useTranslations("Addresses");
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    getAddresses().then(setList).catch(() => setList([]));
  }, []);
  useEffect(load, [load]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <section id="addresses" className={`${card} scroll-mt-40 p-5 sm:p-6`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-outfit text-lg font-black text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("lead")}</p>
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={`${btnGhost} h-10 shrink-0 px-4`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("addNew")}
          </button>
        )}
      </div>

      {editing !== null && (
        <div className="mb-5">
          <AddressForm
            initial={editing === "new" ? undefined : editing}
            onDone={() => {
              setEditing(null);
              load();
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {list === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : list.length === 0 && editing === null ? (
        <div className="flex flex-col items-center rounded border border-dashed border-border py-10 text-center">
          <MapPin className="h-9 w-9 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">{t("none")}</p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="mt-3 text-sm font-bold text-accent-text hover:underline"
          >
            {t("addFirst")}
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => {
            const Icon = iconFor(a.label);
            const hasCoords = a.latitude != null && a.longitude != null;
            return (
              <li
                key={a.id}
                className={`relative flex flex-col justify-between rounded border-2 p-4 transition-colors ${
                  a.isDefault ? "border-brand-fresh/60 bg-brand-fresh/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary dark:text-brand-fresh">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-bold text-foreground">
                      {a.label || a.fullName}
                      {a.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded bg-brand-fresh px-1.5 py-0.5 text-[10px] font-black text-on-fresh">
                          <Star className="h-3 w-3" aria-hidden="true" />
                          {t("default")}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-foreground/80">
                      {a.fullName} · {a.phone}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[a.line1, a.landmark ? `(${a.landmark})` : null].filter(Boolean).join(" ")}
                    </p>
                    {a.placeName && a.placeName !== a.line1 && (
                      <p className="text-xs text-muted-foreground/75 truncate mt-0.5">
                        {a.placeName}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      {hasCoords ? (
                        <span className="inline-flex items-center gap-1 rounded bg-brand-fresh/15 px-2 py-0.5 text-[11px] font-semibold text-brand-fresh">
                          <MapPin className="h-3 w-3" />
                          {t("pinSaved")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                          <MapPin className="h-3 w-3" />
                          {t("noPin")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEditing(a)}
                    className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-foreground transition-colors hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("edit")}
                  </button>
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => run(() => setDefaultAddress(a.id), t("defaultSet"))}
                      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-foreground transition-colors hover:bg-secondary"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("makeDefault")}
                    </button>
                  )}
                  {confirmDelete === a.id ? (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(null);
                          void run(() => deleteAddress(a.id), t("removed"));
                        }}
                        className="rounded bg-red-600 px-2.5 py-1.5 text-white"
                      >
                        {t("delete")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2.5 py-1.5 text-muted-foreground hover:bg-secondary"
                      >
                        {t("keep")}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(a.id)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("delete")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
