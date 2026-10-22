"use client";

import { usePathname } from "@/i18n/navigation";

interface ConditionalFooterProps {
  children: React.ReactNode;
}

/**
 * Hides the footer on catalog listing pages (/products) and category listing pages (/category/*),
 * while preserving it on single product detail pages (/products/[slug]) and other pages.
 */
export default function ConditionalFooter({ children }: ConditionalFooterProps) {
  const pathname = usePathname();
  const cleanPath = pathname?.replace(/\/$/, "") || "";

  const isAllProducts = cleanPath === "/products";
  const isCategoryListing = cleanPath.startsWith("/category");

  if (isAllProducts || isCategoryListing) {
    return null;
  }

  return <>{children}</>;
}
