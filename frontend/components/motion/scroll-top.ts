import { ScrollTrigger } from "./gsap";

let isGliding = false;

/** Jump to the top of the page at once — also stops any smooth-scroll (Lenis) momentum that is still running and recalculates bounds. */
export function scrollTopNow() {
  if (typeof window === "undefined") return;
  isGliding = false;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void; resize?: () => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.resize?.();
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  try {
    ScrollTrigger.refresh();
  } catch {}
}

/** Smoothly scroll to the top of the page (supports Lenis smooth-scroll if active). */
export function scrollToTopSmooth(duration = 0.5) {
  scrollToGridTopSmooth(0, duration);
}

/**
 * Smoothly glides the viewport to a specific vertical position (such as the top of product grid results)
 * and then immediately forces Lenis and ScrollTrigger to refresh bounds, eliminating empty scroll runways.
 */
export function scrollToGridTopSmooth(targetY = 0, duration = 0.45) {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as {
    __lenis?: {
      scrollTo: (target: number | HTMLElement, o?: object) => void;
      resize?: () => void;
    };
  }).__lenis;

  isGliding = true;
  if (lenis) {
    lenis.resize?.();
    lenis.scrollTo(targetY, {
      duration,
      onComplete: () => {
        isGliding = false;
        lenis.resize?.();
        try {
          ScrollTrigger.refresh();
        } catch {}
      },
    });
  } else {
    window.scrollTo({ top: targetY, behavior: "smooth" });
    setTimeout(() => {
      isGliding = false;
      try {
        ScrollTrigger.refresh();
      } catch {}
    }, duration * 1000 + 50);
  }
}

/**
 * Resets the scroll to the top immediately, forces Lenis to recalculate
 * its internal scroll dimensions and limits, and refreshes GSAP ScrollTrigger.
 * Essential when dynamic content shrinks (e.g. from 100 products to 10 products)
 * so that no lingering virtual scroll runway or blank empty spaces remain.
 */
export function resetScrollAndResize() {
  if (typeof window === "undefined") return;
  isGliding = false;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void; resize?: () => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.resize?.();
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  try {
    ScrollTrigger.refresh();
  } catch {}
}

/**
 * Forces Lenis and GSAP ScrollTrigger to recalculate their height bounds
 * to match the current DOM content and clamps scroll position within natural content limits.
 */
export function recalculateScrollBounds() {
  if (typeof window === "undefined" || isGliding) return;
  const lenis = (window as unknown as {
    __lenis?: {
      resize?: () => void;
      scrollTo: (n: number, o?: object) => void;
    };
  }).__lenis;

  lenis?.resize?.();
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (window.scrollY > maxScroll) {
    if (lenis) lenis.scrollTo(maxScroll, { immediate: true, force: true });
    else window.scrollTo({ top: maxScroll, behavior: "instant" });
  }
  try {
    ScrollTrigger.refresh();
  } catch {}
}

