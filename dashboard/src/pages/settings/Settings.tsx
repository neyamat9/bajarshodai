import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { settingsApi, type Settings as S, type SettingsGroup, type HeroLayoutMode } from "@/api/system";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Field, Section } from "@/components/shared/Field";
import { ImageField } from "@/components/shared/ImageField";
import { ErrorState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAct } from "@/hooks/useAct";
import { useUrlState } from "@/hooks/useUrlState";
import { SettingsSkeleton } from "@/components/shared/pageSkeletons";
import { DeliveryForm, MapsForm } from "./DeliveryMaps";
import { saveProductNameLang, type ProductNameLanguage } from "@/lib/productName";
import { tr } from "@/i18n";

const nz = (v: string) => (v.trim() === "" ? null : v.trim());
const Toggle = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
    <span><span className="block text-[13px] font-medium">{label}</span>{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

function useSave(group: SettingsGroup) {
  return useAct((body: Record<string, unknown>) => settingsApi.save(group, body), { success: tr("Settings saved"), invalidate: [["settings"]] });
}

function SiteForm({ v }: { v: S["site"] }) {
  const [f, setF] = useState({
    ...v,
    contactEmail: v.contactEmail ?? "",
    hotline: v.hotline ?? "",
    whatsapp: v.whatsapp ?? "",
    address: v.address ?? "",
    businessHours: v.businessHours ?? "",
    metaTitle: v.metaTitle ?? "",
    metaDescription: v.metaDescription ?? "",
    heroLayout: (v.hero?.layout ?? "SLIDER_AND_SIDE") as HeroLayoutMode,
    heroMaxSlides: v.hero?.maxSlides ?? 5,
    heroAutoplayIntervalSec: v.hero?.autoplayIntervalSec ?? 6,
    productNameLanguage: (v.productNameLanguage ?? "auto") as ProductNameLanguage,
  });
  const [social, setSocial] = useState<Record<string, string>>(v.socialLinks ?? {});
  const save = useSave("site");
  const submit = () => {
    if (!f.storeName.trim()) return toast.error(tr("Store name is required"));
    if (f.contactEmail && !/^\S+@\S+\.\S+$/.test(f.contactEmail)) return toast.error(tr("Enter a valid contact email"));
    save.mutate({
      storeName: f.storeName.trim(),
      tagline: f.tagline,
      logoUrl: f.logoUrl,
      faviconUrl: f.faviconUrl,
      contactEmail: nz(f.contactEmail),
      hotline: nz(f.hotline),
      whatsapp: nz(f.whatsapp),
      address: nz(f.address),
      businessHours: nz(f.businessHours),
      currency: f.currency,
      currencySymbol: f.currencySymbol,
      metaTitle: nz(f.metaTitle),
      metaDescription: nz(f.metaDescription),
      socialLinks: Object.fromEntries(Object.entries(social).filter(([, x]) => x.trim())),
      hero: {
        layout: f.heroLayout,
        maxSlides: Number(f.heroMaxSlides) || 5,
        autoplayIntervalSec: Number(f.heroAutoplayIntervalSec) || 6,
      },
      productNameLanguage: f.productNameLanguage,
    });
    saveProductNameLang(f.productNameLanguage);
  };
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2 [&>button]:justify-self-start xl:[&>button]:col-span-2">
      <Section title={tr("Store")}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2"><Field label={tr("Store name")} required><Input value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} /></Field><Field label={tr("Tagline")}><Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field></div>
          <div className="grid gap-3 sm:grid-cols-2"><ImageField label={tr("Logo")} folder="site" value={f.logoUrl} onChange={(logoUrl) => setF({ ...f, logoUrl })} /><ImageField label={tr("Favicon")} folder="site" value={f.faviconUrl} onChange={(faviconUrl) => setF({ ...f, faviconUrl })} /></div>
          <Field
            label={tr("Product Name Language in Dashboard")}
            hint={tr("Controls whether product names in admin lists appear in English, Bangla, or follow the interface language.")}
          >
            <Select
              value={f.productNameLanguage}
              onChange={(e) => {
                const val = e.target.value as ProductNameLanguage;
                setF({ ...f, productNameLanguage: val });
                saveProductNameLang(val);
              }}
            >
              <option value="auto">{tr("Auto (Follow Dashboard Language)")}</option>
              <option value="bn">{tr("Always Bangla (বাংলা)")}</option>
              <option value="en">{tr("Always English")}</option>
            </Select>
          </Field>
        </div>
      </Section>
      <Section title={tr("Home Hero Section")} description={tr("Display layout and slide rotation settings for the storefront hero section.")}>
        <div className="space-y-3">
          <Field label={tr("Hero Layout")} hint={tr("Choose between slider with side promotional cards or full-width slider only")}>
            <Select value={f.heroLayout} onChange={(e) => setF({ ...f, heroLayout: e.target.value as HeroLayoutMode })}>
              <option value="SLIDER_AND_SIDE">{tr("Slider + 2 Side Cards (Default)")}</option>
              <option value="SLIDER_ONLY">{tr("Full-Width Slider Only")}</option>
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Max Slides")} hint={tr("How many active main slider photos rotate")}>
              <Input type="number" min={1} max={15} value={f.heroMaxSlides} onChange={(e) => setF({ ...f, heroMaxSlides: Number(e.target.value) })} />
            </Field>
            <Field label={tr("Slide Interval (seconds)")} hint={tr("Seconds per slide")}>
              <Input type="number" min={2} max={30} value={f.heroAutoplayIntervalSec} onChange={(e) => setF({ ...f, heroAutoplayIntervalSec: Number(e.target.value) })} />
            </Field>
          </div>
        </div>
      </Section>
      <Section title={tr("Contact")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tr("Contact email")}><Input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          <Field label={tr("Hotline")}><Input value={f.hotline} onChange={(e) => setF({ ...f, hotline: e.target.value })} /></Field>
          <Field label={tr("WhatsApp")}><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
          <Field label={tr("Business hours")}><Input value={f.businessHours} onChange={(e) => setF({ ...f, businessHours: e.target.value })} placeholder={tr("Sat–Thu, 10am–8pm")} /></Field>
          <Field label={tr("Address")} className="sm:col-span-2"><Textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        </div>
      </Section>
      <Section title={tr("Social links")}>
        <div className="grid gap-3 sm:grid-cols-2">{["facebook", "instagram", "youtube", "tiktok", "twitter", "linkedin"].map((k) => <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><Input value={social[k] ?? ""} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} placeholder="https://" /></Field>)}</div>
      </Section>
      <Section title={tr("Search engines")}>
        <div className="space-y-3"><Field label={tr("Meta title")}><Input value={f.metaTitle} onChange={(e) => setF({ ...f, metaTitle: e.target.value })} /></Field><Field label={tr("Meta description")}><Textarea rows={2} value={f.metaDescription} onChange={(e) => setF({ ...f, metaDescription: e.target.value })} /></Field></div>
      </Section>
      <Button loading={save.isPending} onClick={submit}>{tr("Save store settings")}</Button>
    </div>
  );
}

type MobileKey = "bkash" | "nagad" | "rocket";
const MOBILE: { key: MobileKey; label: string; hint: string }[] = [
  { key: "bkash", label: "bKash", hint: tr("Customers send money to your bKash number and enter the transaction ID.") },
  { key: "nagad", label: tr("Nagad"), hint: tr("Customers send money to your Nagad number and enter the transaction ID.") },
  { key: "rocket", label: tr("Rocket"), hint: tr("Customers send money to your Rocket number and enter the transaction ID.") },
];

function PaymentForm({ v }: { v: S["payment"] }) {
  const [f, setF] = useState({
    ...v,
    bkashNumber: v.bkashNumber ?? "", bkashInstructions: v.bkashInstructions ?? "",
    nagadNumber: v.nagadNumber ?? "", nagadInstructions: v.nagadInstructions ?? "",
    rocketNumber: v.rocketNumber ?? "", rocketInstructions: v.rocketInstructions ?? "",
  });

  useEffect(() => {
    setF({
      ...v,
      bkashNumber: v.bkashNumber ?? "", bkashInstructions: v.bkashInstructions ?? "",
      nagadNumber: v.nagadNumber ?? "", nagadInstructions: v.nagadInstructions ?? "",
      rocketNumber: v.rocketNumber ?? "", rocketInstructions: v.rocketInstructions ?? "",
    });
  }, [v]);

  const save = useSave("payment");
  const submit = () => {
    if (!f.codEnabled && !f.bkashEnabled && !f.nagadEnabled && !f.rocketEnabled) return toast.error(tr("Keep at least one payment method on"));
    for (const m of MOBILE) {
      if (f[`${m.key}Enabled`] && !/^(\+?88)?01[3-9]\d{8}$/.test((f[`${m.key}Number`] || "").replace(/[\s-]/g, ""))) return toast.error(`Enter a valid Bangladeshi mobile number (01XXXXXXXXX) for ${m.label}`);
    }
    save.mutate({
      codEnabled: f.codEnabled,
      bkashEnabled: f.bkashEnabled, bkashNumber: nz((f.bkashNumber || "").replace(/[\s-]/g, "")), bkashAccountType: f.bkashAccountType, bkashInstructions: nz(f.bkashInstructions),
      nagadEnabled: f.nagadEnabled, nagadNumber: nz((f.nagadNumber || "").replace(/[\s-]/g, "")), nagadAccountType: f.nagadAccountType, nagadInstructions: nz(f.nagadInstructions),
      rocketEnabled: f.rocketEnabled, rocketNumber: nz((f.rocketNumber || "").replace(/[\s-]/g, "")), rocketAccountType: f.rocketAccountType, rocketInstructions: nz(f.rocketInstructions),
    });
  };
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2 [&>button]:justify-self-start xl:[&>button]:col-span-2">
      <Section title={tr("Payment methods")} description={tr("Customers choose one at checkout. Mobile banking: they send money to your number and type the transaction ID; you verify it on the order.")}>
        <div className="divide-y divide-border">
          <Toggle label={tr("Cash on delivery")} hint={tr("Customers pay the courier.")} checked={f.codEnabled} onChange={(codEnabled) => setF({ ...f, codEnabled })} />
          {MOBILE.map((m) => (
            <div key={m.key}>
              <Toggle
                label={tr("{{method}} (send money)", { method: m.label })}
                hint={m.hint}
                checked={f[`${m.key}Enabled`]}
                onChange={(on) => {
                  const patch: Record<string, unknown> = { [`${m.key}Enabled`]: on };
                  if (on && !f[`${m.key}Number`]) {
                    patch[`${m.key}Number`] = "01834529197";
                  }
                  setF({ ...f, ...patch });
                }}
              />
              {f[`${m.key}Enabled`] && (
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <Field label={`${m.label} number`} required><Input value={f[`${m.key}Number`]} onChange={(e) => setF({ ...f, [`${m.key}Number`]: e.target.value })} placeholder="01XXXXXXXXX" /></Field>
                  <Field label={tr("Account type")}><Select value={f[`${m.key}AccountType`]} onChange={(e) => setF({ ...f, [`${m.key}AccountType`]: e.target.value })}><option value="personal">{tr("Personal")}</option><option value="merchant">{tr("Merchant")}</option><option value="agent">{tr("Agent")}</option></Select></Field>
                  <Field label={tr("Instructions shown to the customer")} className="sm:col-span-2"><Textarea rows={3} value={f[`${m.key}Instructions`]} onChange={(e) => setF({ ...f, [`${m.key}Instructions`]: e.target.value })} /></Field>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
      <Button loading={save.isPending} onClick={submit}>{tr("Save payment settings")}</Button>
    </div>
  );
}

function ReturnsForm({ v }: { v: S["returns"] }) {
  const [f, setF] = useState({ ...v, policyText: v.policyText ?? "" });
  const save = useSave("returns");
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2 [&>button]:justify-self-start xl:[&>button]:col-span-2">
      <Section title={tr("Returns")}>
        <Toggle label={tr("Accept returns")} hint={tr("Turn off to stop new return requests.")} checked={f.returnsEnabled} onChange={(returnsEnabled) => setF({ ...f, returnsEnabled })} />
        <div className="mt-2 space-y-3">
          <Field label={tr("Return window (days after delivery)")}><Input type="number" min={0} max={365} value={f.returnWindowDays} onChange={(e) => setF({ ...f, returnWindowDays: Number(e.target.value) })} className="max-w-[160px]" /></Field>
          <Field label={tr("Policy text shown to customers")}><Textarea rows={5} value={f.policyText} onChange={(e) => setF({ ...f, policyText: e.target.value })} /></Field>
        </div>
      </Section>
      <Button loading={save.isPending} onClick={() => save.mutate({ returnsEnabled: f.returnsEnabled, returnWindowDays: f.returnWindowDays, policyText: nz(f.policyText) })}>{tr("Save return settings")}</Button>
    </div>
  );
}

function EmailForm({ v }: { v: S["email"] }) {
  const [f, setF] = useState({ ...v, replyTo: v.replyTo ?? "", smtpHost: v.smtpHost ?? "", smtpPort: v.smtpPort ? String(v.smtpPort) : "", smtpUser: v.smtpUser ?? "", adminNotificationEmail: v.adminNotificationEmail ?? "" });
  const [smtpPass, setSmtpPass] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [to, setTo] = useState("");
  const body = () => ({
    provider: f.provider, fromName: f.fromName, fromEmail: f.fromEmail, replyTo: nz(f.replyTo),
    smtpHost: nz(f.smtpHost), smtpPort: f.smtpPort ? Number(f.smtpPort) : null, smtpSecure: f.smtpSecure, smtpUser: nz(f.smtpUser),
    ...(smtpPass ? { smtpPass } : {}), ...(resendKey ? { resendApiKey: resendKey } : {}),
    adminNotificationEmail: nz(f.adminNotificationEmail),
    notifyCustomerOrderPlaced: f.notifyCustomerOrderPlaced, notifyCustomerOrderStatus: f.notifyCustomerOrderStatus, notifyAdminNewOrder: f.notifyAdminNewOrder,
    notifyAdminContactMessage: f.notifyAdminContactMessage, notifyAdminSupportTicket: f.notifyAdminSupportTicket, notifyCustomerTicketReply: f.notifyCustomerTicketReply, sendNewsletterWelcome: f.sendNewsletterWelcome,
  });
  const save = useSave("email");
  const test = useAct(() => settingsApi.testEmail(to.trim(), body()), { success: tr("Test email sent — check the inbox") });
  const set = <K extends keyof typeof f>(k: K, val: (typeof f)[K]) => setF({ ...f, [k]: val });
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2 [&>button]:justify-self-start xl:[&>button]:col-span-2">
      <Section title={tr("Sending emails")}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={tr("Provider")}><Select value={f.provider} onChange={(e) => set("provider", e.target.value as S["email"]["provider"])}><option value="none">{tr("Off (no emails)")}</option><option value="smtp">{tr("SMTP")}</option><option value="resend">{tr("Resend")}</option></Select></Field>
            <Field label={tr("From name")}><Input value={f.fromName} onChange={(e) => set("fromName", e.target.value)} /></Field>
            <Field label={tr("From email")}><Input type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} /></Field>
          </div>
          {f.provider === "smtp" && (
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label={tr("SMTP host")}><Input value={f.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} /></Field>
              <Field label={tr("Port")}><Input type="number" value={f.smtpPort} onChange={(e) => set("smtpPort", e.target.value)} /></Field>
              <Field label={tr("User")}><Input value={f.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} autoComplete="off" /></Field>
              <Field label={tr("Password")} hint={v.smtpPassSet ? tr("Saved — leave empty to keep") : undefined}><Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} autoComplete="new-password" /></Field>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] sm:col-span-4"><Switch checked={f.smtpSecure} onCheckedChange={(x) => set("smtpSecure", x)} />{tr("Use SSL/TLS (port 465)")}</label>
            </div>
          )}
          {f.provider === "resend" && <Field label={tr("Resend API key")} hint={v.resendApiKeySet ? tr("Saved — leave empty to keep") : undefined}><Input type="password" value={resendKey} onChange={(e) => setResendKey(e.target.value)} autoComplete="new-password" /></Field>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Reply-to email")}><Input type="email" value={f.replyTo} onChange={(e) => set("replyTo", e.target.value)} /></Field>
            <Field label={tr("Send admin alerts to")}><Input type="email" value={f.adminNotificationEmail} onChange={(e) => set("adminNotificationEmail", e.target.value)} /></Field>
          </div>
        </div>
      </Section>
      <Section title={tr("Which emails to send")}>
        <div className="divide-y divide-border">
          <Toggle label={tr("Customer: order placed")} checked={f.notifyCustomerOrderPlaced} onChange={(x) => set("notifyCustomerOrderPlaced", x)} />
          <Toggle label={tr("Customer: order status changes")} checked={f.notifyCustomerOrderStatus} onChange={(x) => set("notifyCustomerOrderStatus", x)} />
          <Toggle label={tr("Customer: reply to their support ticket")} checked={f.notifyCustomerTicketReply} onChange={(x) => set("notifyCustomerTicketReply", x)} />
          <Toggle label={tr("Customer: newsletter welcome")} checked={f.sendNewsletterWelcome} onChange={(x) => set("sendNewsletterWelcome", x)} />
          <Toggle label={tr("You: new order")} checked={f.notifyAdminNewOrder} onChange={(x) => set("notifyAdminNewOrder", x)} />
          <Toggle label={tr("You: new contact message")} checked={f.notifyAdminContactMessage} onChange={(x) => set("notifyAdminContactMessage", x)} />
          <Toggle label={tr("You: new support ticket")} checked={f.notifyAdminSupportTicket} onChange={(x) => set("notifyAdminSupportTicket", x)} />
        </div>
      </Section>
      <Section title={tr("Send a test email")} description={tr("Uses the values above, even before you save.")}>
        <div className="flex flex-wrap gap-2"><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" className="max-w-xs" /><Button variant="outline" disabled={!/^\S+@\S+\.\S+$/.test(to)} loading={test.isPending} onClick={() => test.mutate()}><Mail />{" "}{tr("Send test")}</Button></div>
      </Section>
      <Button loading={save.isPending} onClick={() => save.mutate(body())}>{tr("Save email settings")}</Button>
    </div>
  );
}

function LoyaltyForm({ v }: { v: S["loyalty"] }) {
  const [f, setF] = useState<S["loyalty"]>({
    enabled: v?.enabled ?? true,
    pointsPerHundredSpent: v?.pointsPerHundredSpent ?? 5,
    pointsPerCurrencyUnit: v?.pointsPerCurrencyUnit ?? 10,
    minOrderAmountToRedeem: v?.minOrderAmountToRedeem ?? 500,
    minPointsToRedeem: v?.minPointsToRedeem ?? 50,
    maxDiscountPercent: v?.maxDiscountPercent ?? 30,
    freeShippingMilestoneEnabled: v?.freeShippingMilestoneEnabled ?? true,
    freeShippingOrderInterval: v?.freeShippingOrderInterval ?? 5,
    freeShippingMaxWeightKg: v?.freeShippingMaxWeightKg ?? 5,
  });

  const save = useSave("loyalty");

  const submit = () => {
    if (f.pointsPerHundredSpent < 0) return toast.error(tr("Points per 100 spent must be 0 or more"));
    if (f.pointsPerCurrencyUnit <= 0) return toast.error(tr("Points per currency unit must be greater than 0"));
    if (f.minOrderAmountToRedeem < 0) return toast.error(tr("Minimum order amount must be 0 or more"));
    if (f.freeShippingOrderInterval <= 0) return toast.error(tr("Order interval must be at least 1"));
    if (f.freeShippingMaxWeightKg <= 0) return toast.error(tr("Max weight cap must be greater than 0"));

    save.mutate({
      enabled: f.enabled,
      pointsPerHundredSpent: Number(f.pointsPerHundredSpent),
      pointsPerCurrencyUnit: Number(f.pointsPerCurrencyUnit),
      minOrderAmountToRedeem: Number(f.minOrderAmountToRedeem),
      minPointsToRedeem: Number(f.minPointsToRedeem),
      maxDiscountPercent: Number(f.maxDiscountPercent),
      freeShippingMilestoneEnabled: f.freeShippingMilestoneEnabled,
      freeShippingOrderInterval: Number(f.freeShippingOrderInterval),
      freeShippingMaxWeightKg: Number(f.freeShippingMaxWeightKg),
    });
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2 [&>button]:justify-self-start xl:[&>button]:col-span-2">
      <Section
        title={tr("Loyalty Points (Money Discounts)")}
        description={tr("Customers earn points on orders and convert them into monetary discounts at checkout.")}
      >
        <div className="divide-y divide-border">
          <Toggle
            label={tr("Enable loyalty points")}
            hint={tr("Allow customers to earn and redeem points for order discounts.")}
            checked={f.enabled}
            onChange={(enabled) => setF({ ...f, enabled })}
          />
          {f.enabled && (
            <div className="pt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr("Points earned per ৳100 spent")} hint={tr("e.g. 5 points per ৳100")}>
                  <Input
                    type="number"
                    min={0}
                    value={f.pointsPerHundredSpent}
                    onChange={(e) => setF({ ...f, pointsPerHundredSpent: Number(e.target.value) })}
                  />
                </Field>
                <Field label={tr("Points required per ৳1 discount")} hint={tr("e.g. 10 points = ৳1 discount")}>
                  <Input
                    type="number"
                    min={1}
                    value={f.pointsPerCurrencyUnit}
                    onChange={(e) => setF({ ...f, pointsPerCurrencyUnit: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={tr("Minimum order subtotal to redeem (BDT)")}
                  hint={tr("Customer must order at least this amount to apply points")}
                >
                  <Input
                    type="number"
                    min={0}
                    value={f.minOrderAmountToRedeem}
                    onChange={(e) => setF({ ...f, minOrderAmountToRedeem: Number(e.target.value) })}
                  />
                </Field>
                <Field label={tr("Minimum points required to redeem")} hint={tr("e.g. at least 50 points")}>
                  <Input
                    type="number"
                    min={0}
                    value={f.minPointsToRedeem}
                    onChange={(e) => setF({ ...f, minPointsToRedeem: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <Field label={tr("Max discount cap (% of order subtotal)")} hint={tr("Caps points discount to prevent 100% free orders (e.g. 30%)")}>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={f.maxDiscountPercent}
                  onChange={(e) => setF({ ...f, maxDiscountPercent: Number(e.target.value) })}
                  className="max-w-[200px]"
                />
              </Field>
            </div>
          )}
        </div>
      </Section>

      <Section
        title={tr("Milestone Free Shipping")}
        description={tr("Reward repeat customers with 100% Free Shipping after completing a specific number of orders, capped by weight.")}
      >
        <div className="divide-y divide-border">
          <Toggle
            label={tr("Enable milestone free shipping")}
            hint={tr("Every Nth completed order qualifies for 100% free delivery.")}
            checked={f.freeShippingMilestoneEnabled}
            onChange={(freeShippingMilestoneEnabled) => setF({ ...f, freeShippingMilestoneEnabled })}
          />
          {f.freeShippingMilestoneEnabled && (
            <div className="pt-3 space-y-3">
              <Field
                label={tr("Order count milestone")}
                hint={tr("e.g. 5 means the 5th delivered order earns free shipping on the next order (or every 5 orders).")}
              >
                <Input
                  type="number"
                  min={1}
                  value={f.freeShippingOrderInterval}
                  onChange={(e) => setF({ ...f, freeShippingOrderInterval: Number(e.target.value) })}
                  className="max-w-[200px]"
                />
              </Field>
              <Field
                label={tr("Maximum weight limit for free shipping (KG)")}
                hint={tr("Orders weighing more than this cap will not receive milestone free shipping (e.g. 5 kg).")}
              >
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={f.freeShippingMaxWeightKg}
                  onChange={(e) => setF({ ...f, freeShippingMaxWeightKg: Number(e.target.value) })}
                  className="max-w-[200px]"
                />
              </Field>
            </div>
          )}
        </div>
      </Section>

      <Button loading={save.isPending} onClick={submit}>{tr("Save loyalty & rewards settings")}</Button>
    </div>
  );
}

export default function Settings() {
  const [f, setF] = useUrlState({ tab: "site" });
  const q = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  if (q.isLoading) return <SettingsSkeleton />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const s = q.data;
  return (
    <div>
      <PageHeader refresh={false} title={tr("Settings")} description={tr("How your store looks, charges and talks to customers.")} />
      <Tabs value={f.tab} onValueChange={(tab) => setF({ tab })}>
        <TabsList className="mb-4">
          <TabsTrigger value="site">{tr("Store")}</TabsTrigger>
          <TabsTrigger value="payment">{tr("Payment")}</TabsTrigger>
          <TabsTrigger value="delivery">{tr("Delivery")}</TabsTrigger>
          <TabsTrigger value="maps">{tr("Maps")}</TabsTrigger>
          <TabsTrigger value="loyalty">{tr("Loyalty & Rewards")}</TabsTrigger>
          <TabsTrigger value="returns">{tr("Returns")}</TabsTrigger>
          <TabsTrigger value="email">{tr("Email")}</TabsTrigger>
        </TabsList>
        <div>
          <TabsContent value="site"><SiteForm v={s.site} /></TabsContent>
          <TabsContent value="payment"><PaymentForm v={s.payment} /></TabsContent>
          <TabsContent value="delivery"><DeliveryForm v={s.delivery} tileUrl={s.maps.osmTileUrl} /></TabsContent>
          <TabsContent value="maps"><MapsForm v={s.maps} /></TabsContent>
          <TabsContent value="loyalty"><LoyaltyForm v={s.loyalty} /></TabsContent>
          <TabsContent value="returns"><ReturnsForm v={s.returns} /></TabsContent>
          <TabsContent value="email"><EmailForm v={s.email} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
