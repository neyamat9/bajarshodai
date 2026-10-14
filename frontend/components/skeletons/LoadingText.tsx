"use client";

import { useTranslations } from "next-intl";

/** Screen-reader text for a loading placeholder, in the page language. */
export default function LoadingText() {
  const t = useTranslations("Common");
  return (
    <span className="sr-only" role="status">
      {t("loading")}
    </span>
  );
}
