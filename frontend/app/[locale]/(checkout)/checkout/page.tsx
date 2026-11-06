"use client";

import { useRouter } from "@/i18n/navigation";
import RequireLogin from "@/components/account/RequireLogin";
import LocationStep from "@/components/checkout/LocationStep";
import OrderReview from "@/components/checkout/OrderReview";
import OrderSummaryPanel from "@/components/checkout/OrderSummaryPanel";
import { CheckoutBodySkeleton } from "@/components/skeletons/CheckoutSkeletons";
import PaymentSelector from "@/components/checkout/PaymentSelector";
import ShippingForm, { type DeliveryDetails } from "@/components/checkout/ShippingForm";
import StepIndicator from "@/components/checkout/StepIndicator";
import { errorMessage } from "@/lib/api/client";
import { useCart } from "@/lib/hooks/use-cart";
import { useAuth } from "@/lib/hooks/use-auth";
import { loadSavedAddresses, peekSavedAddresses, toDeliveryDetails, toPickedLocation } from "@/lib/checkout-prefill";
import { createAddress, type SavedAddress } from "@/lib/services/addresses.service";
import { clearStoredCoupon, getStoredCoupon, storeCoupon } from "@/lib/coupon-store";
import { applyCoupon, getCheckoutSummary, type CheckoutSummary } from "@/lib/services/checkout.service";
import { getSiteSettings, type SiteSettings } from "@/lib/services/site.service";
import { MOBILE_METHODS, type CheckoutAddress, type DeliveryQuote, type PaymentMethod, type PickedLocation } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const LABEL: Record<string, PaymentMethod> = {
  CASH_ON_DELIVERY: "Cash on Delivery",
  cod: "Cash on Delivery",
  BKASH: "bKash",
  bkash: "bKash",
  NAGAD: "Nagad",
  nagad: "Nagad",
  ROCKET: "Rocket",
  rocket: "Rocket",
  "Cash on Delivery": "Cash on Delivery",
  bKash: "bKash",
  Nagad: "Nagad",
  Rocket: "Rocket",
};

/**
 * Checkout: 1 who and which house → 2 where on the map (the delivery charge comes from the pin) → 3 payment → 4 review & place order.
 * Prices, the delivery charge, the coupon discount and the total all come from the server,
 * so what the customer sees is exactly what the order will say.
 * Only signed-in customers get here; their default saved address (and its pin) fills the steps in advance.
 */
function Checkout() {
  const t = useTranslations("Checkout");
  const { user } = useAuth();
  const { cart, cartCount, loading: cartLoading, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<DeliveryDetails | null>(null);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [slot, setSlot] = useState("");
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [txn, setTxn] = useState("");
  const [sender, setSender] = useState("");
  const [coupon, setCoupon] = useState(() => getStoredCoupon());
  const [usePoints, setUsePoints] = useState(false);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const placed = useRef(false);
  const summarySeq = useRef(0);

  // saved addresses: loaded when the cart button was pressed, otherwise now. The form waits for them (never for long).
  const [saved, setSaved] = useState<SavedAddress[] | null>(() => (user ? peekSavedAddresses(user.id) : null));
  useEffect(() => {
    if (!user || saved !== null) return;
    let alive = true;
    loadSavedAddresses(user.id).then((l) => alive && setSaved(l));
    return () => {
      alive = false;
    };
  }, [user, saved]);
  // the default (else newest) saved address fills in step 1, and its pin step 2
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || saved === null) return;
    prefilled.current = true;
    if (saved.length > 0) {
      setDetails((d) => d ?? toDeliveryDetails(saved[0]));
      setLocation((l) => l ?? toPickedLocation(saved[0]));
    }
  }, [saved]);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  // Empty cart → back to the cart (but not right after placing an order)
  useEffect(() => {
    if (!cartLoading && cartCount === 0 && !placed.current) router.replace("/cart");
  }, [cartLoading, cartCount, router]);

  const lat = location?.lat;
  const lng = location?.lng;
  const phone = details?.phone;
  const refresh = useCallback(async () => {
    const mine = ++summarySeq.current;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const s = await getCheckoutSummary({
        couponCode: coupon || undefined,
        lat,
        lng,
        phone: phone || undefined,
        redeemPoints: usePoints ? 999999 : undefined,
      });
      if (mine === summarySeq.current) setSummary(s);
    } catch (e) {
      if (mine !== summarySeq.current) return;
      setSummaryError(errorMessage(e));
      // a coupon that stopped being valid must not block the checkout
      if (coupon) {
        setCoupon("");
        clearStoredCoupon();
      }
    } finally {
      if (mine === summarySeq.current) setSummaryLoading(false);
    }
  }, [coupon, lat, lng, phone, usePoints]);

  useEffect(() => {
    if (cartLoading || cartCount === 0) return;
    void refresh();
  }, [cartLoading, cartCount, cart.items, refresh]);

  async function handleApply(code: string) {
    const s = await applyCoupon(code, {
      lat,
      lng,
      phone: phone || undefined,
      redeemPoints: usePoints ? 999999 : undefined,
    });
    setSummary(s);
    setCoupon(code);
    storeCoupon(code);
  }

  async function handleTogglePoints(apply: boolean) {
    setUsePoints(apply);
    setSummaryLoading(true);
    try {
      const s = await getCheckoutSummary({
        couponCode: coupon || undefined,
        lat,
        lng,
        phone: phone || undefined,
        redeemPoints: apply ? (summary?.loyalty?.userPoints ?? 999999) : undefined,
      });
      setSummary(s);
    } catch (e) {
      setSummaryError(errorMessage(e));
    } finally {
      setSummaryLoading(false);
    }
  }

  const rawMethods = (settings?.payment?.methods?.length ? settings.payment.methods : (summary?.paymentMethods?.length ? summary.paymentMethods : ["CASH_ON_DELIVERY"]));
  const methods: PaymentMethod[] = Array.from(new Set(rawMethods.map((m) => LABEL[m] || LABEL[m?.toUpperCase?.()] || (m as PaymentMethod)).filter(Boolean)));
  const address: CheckoutAddress | null = details ? { ...details, email: "", location } : null;

  const onQuote = useCallback((q: DeliveryQuote | null, loading: boolean) => {
    setQuote(q);
    setQuoting(loading);
  }, []);

  if (cartLoading || (cartCount === 0 && !placed.current)) return <CheckoutBodySkeleton />;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-foreground font-outfit tracking-tight">{t("title")}</h1>
        <div className="mt-2 h-1 w-16 bg-brand-fresh rounded" />
      </div>

      <div className="mb-8 md:mb-10">
        <StepIndicator currentStep={step} />
      </div>

      {summaryError && (
        <p role="alert" className="mb-6 rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {summaryError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="rounded bg-muted border border-border p-6 md:p-8">
          {step === 1 && saved === null && <div className="h-[26rem] animate-pulse rounded bg-secondary" aria-busy="true" aria-label={t("loadingAddresses")} />}
          {step === 1 && saved !== null && (
            <ShippingForm
              initialData={details ?? (user ? { fullName: user.name, phone: user.phone } : undefined)}
              saved={saved ?? []}
              location={location}
              onLocation={setLocation}
              onPickSaved={(pin) => setLocation(pin)}
              subtotal={summary?.subtotal ?? 0}
              onSubmit={async (d, saveToBook) => {
                setDetails(d);
                if (saveToBook && user && location) {
                  try {
                    const newAddr = await createAddress({
                      fullName: d.fullName,
                      phone: d.phone,
                      line1: d.address,
                      landmark: d.landmark || undefined,
                      latitude: location.lat,
                      longitude: location.lng,
                      placeName: location.placeName || d.address || undefined,
                      accuracyM: location.accuracyM ?? undefined,
                      locationSource: location.source,
                      isDefault: (saved?.length ?? 0) === 0,
                    });
                    setSaved((prev) => (prev ? [newAddr, ...prev] : [newAddr]));
                  } catch {
                    // continues even if saving address to book fails
                  }
                }
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <LocationStep
              location={location}
              onLocation={setLocation}
              quote={quote}
              quoting={quoting}
              onQuote={onQuote}
              subtotal={summary?.subtotal ?? 0}
              slot={slot}
              onSlot={setSlot}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <PaymentSelector
              methods={methods}
              accounts={{
                bKash: settings?.payment?.bkash ?? null,
                Nagad: settings?.payment?.nagad ?? null,
                Rocket: settings?.payment?.rocket ?? null,
              }}
              total={summary?.total ?? null}
              selected={payment}
              onSelect={setPayment}
              transactionId={txn}
              onTransactionIdChange={setTxn}
              senderNumber={sender}
              onSenderNumberChange={setSender}
              onBack={() => setStep(2)}
              onContinue={() => setStep(4)}
            />
          )}

          {step === 4 && address && payment && summary && (
            <OrderReview
              summary={summary}
              address={address}
              paymentMethod={payment}
              deliverySlot={slot}
              bkashTransactionId={MOBILE_METHODS.includes(payment) ? txn.trim() : undefined}
              bkashSenderNumber={MOBILE_METHODS.includes(payment) ? sender.replace(/[\s-]/g, "") : undefined}
              couponCode={summary.coupon?.applied ? summary.coupon.code : undefined}
              redeemPoints={usePoints ? summary.loyalty?.pointsRedeemed : undefined}
              onBack={() => setStep(3)}
              onOrderPlaced={() => {
                placed.current = true;
                clearStoredCoupon();
                void clearCart();
              }}
            />
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummaryPanel
            summary={summary}
            loading={summaryLoading}
            couponCode={coupon}
            onApplyCoupon={handleApply}
            onRemoveCoupon={() => {
              setCoupon("");
              clearStoredCoupon();
            }}
            redeemPointsApplied={usePoints && (summary?.pointsDiscountAmount ?? 0) > 0}
            onTogglePoints={handleTogglePoints}
          />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireLogin fallback={<CheckoutBodySkeleton />}>
      <Checkout />
    </RequireLogin>
  );
}
