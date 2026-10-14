"use client";

import { useRouter } from "@/i18n/navigation";
import { useCartActions } from "@/lib/hooks/use-cart";
import { useCallback } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";

// One-click "add to cart" from cards and lists. Products with options
// (colour, storage…) send the customer to the product page to choose.
export function useQuickAdd() {
  const { addToCart } = useCartActions();
  const router = useRouter();
  const t = useTranslations("Product.card");
  const locale = useLocale() as Locale;

  return useCallback(
    async (p: { id: string; slug: string; name: string; price: number; stock: number; imageUrl: string; hasVariants?: boolean }, quantity = 1) => {
      if (p.hasVariants) {
        toast.info(t("chooseOptionFirst"), { description: p.name });
        router.push(`/products/${p.slug}`);
        return false;
      }
      if (p.stock <= 0) {
        toast.error(t("outOfStockNamed", { name: p.name }));
        return false;
      }
      const res = await addToCart({ productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity, imageUrl: p.imageUrl, stock: p.stock });
      if (res.ok) {
        toast.success(t("added", { name: p.name }), { description: formatMoney(p.price, locale), duration: 2500 });
      } else if (/variant|option/i.test(res.error ?? "")) {
        toast.info(t("chooseOptionFirst"), { description: p.name });
        router.push(`/products/${p.slug}`);
      } else {
        toast.error(res.error ?? t("couldNotAdd"));
      }
      return res.ok;
    },
    [addToCart, router, t, locale],
  );
}
