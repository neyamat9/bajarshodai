import { lazy, Suspense, type ReactNode } from "react";
import { PageLoader } from "./PageLoader";
import { PageErrorBoundary } from "./PageErrorBoundary";

/** A lazily loaded route. While its code downloads it shows `skeleton` (shaped like the page), protected by PageErrorBoundary. */
export const L = (importer: () => Promise<{ default: React.ComponentType }>, skeleton?: ReactNode) => {
  const C = lazy(importer);
  return (
    <PageErrorBoundary>
      <Suspense fallback={skeleton ?? <PageLoader />}>
        <C />
      </Suspense>
    </PageErrorBoundary>
  );
};
