"use client";

import type { OrderStatus, PaymentMethod } from "@/lib/types";
import { useTranslations } from "next-intl";

/** Order status → the key of its words in the `Status` messages. */
export const STATUS_KEY: Record<OrderStatus, "pending" | "confirmed" | "processing" | "shipped" | "inTransit" | "outForDelivery" | "delivered" | "cancelled" | "returned" | "refunded" | "onHold"> = {
  "Pending": "pending",
  "Confirmed": "confirmed",
  "Processing": "processing",
  "Shipped": "shipped",
  "In transit": "inTransit",
  "Out for delivery": "outForDelivery",
  "Delivered": "delivered",
  "Cancelled": "cancelled",
  "Returned": "returned",
  "Refunded": "refunded",
  "On hold": "onHold",
};

/** `const label = useStatusLabel(); label(order.status)` → "Delivered" / "ডেলিভারি হয়েছে". */
export function useStatusLabel() {
  const t = useTranslations("Status");
  return (s: OrderStatus) => t(STATUS_KEY[s] ?? "pending");
}

/** The payment method in the page language (bKash and Nagad are brand names and stay as they are). */
export function usePaymentLabel() {
  const t = useTranslations("Checkout");
  return (m: PaymentMethod) => (m === "Cash on Delivery" ? t("cod") : m);
}
