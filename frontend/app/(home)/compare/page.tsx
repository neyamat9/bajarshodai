import ComparePage from "@/components/compare/ComparePage";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Compare products",
  description: "Compare up to three gadgets side by side: price, ratings and every specification.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ComparePage />
    </Suspense>
  );
}
