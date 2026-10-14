"use client";

import { useRouter } from "@/i18n/navigation";
import { useCartActions } from "@/lib/hooks/use-cart";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ProductUnit } from "@/lib/types";

// One-click "add to cart" from cards and lists. Products with options
// (colour, storage…) send the customer to the product page to choose.
export function useQuickAdd() {
  const { addToCart } = useCartActions();
  const router = useRouter();
  const t = useTranslations("Product.card");

  return useCallback(
    async (p: { id: string; slug: string; name: string; price: number; stock: number; imageUrl: string; hasVariants?: boolean; unit?: ProductUnit | null }, quantity = p.unit?.minQty ?? 1) => {
      if (p.hasVariants) {
        toast.info(t("chooseOptionFirst"), { description: p.name });
        router.push(`/products/${p.slug}`);
        return false;
      }
      if (p.stock <= 0) {
        toast.error(t("outOfStockNamed", { name: p.name }));
        return false;
      }
      const res = await addToCart({ productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity, imageUrl: p.imageUrl, stock: p.stock, unit: p.unit ?? null });
      // no "added" message: the card turns into a quantity stepper and the floating cart counts up
      if (res.ok) {
        // nothing more to do
      } else if (/variant|option/i.test(res.error ?? "")) {
        toast.info(t("chooseOptionFirst"), { description: p.name });
        router.push(`/products/${p.slug}`);
      } else {
        toast.error(res.error ?? t("couldNotAdd"));
      }
      return res.ok;
    },
    [addToCart, router, t],
  );
}
