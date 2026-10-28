/** Jump to the top of the page at once — also stops any smooth-scroll (Lenis) momentum that is still running and recalculates bounds. */
export function scrollTopNow() {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void; resize?: () => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.resize?.();
  }
  window.scrollTo(0, 0);
  try {
    const { ScrollTrigger } = require("./gsap");
    ScrollTrigger?.refresh?.();
  } catch {}
}

/** Smoothly scroll to the top of the page (supports Lenis smooth-scroll if active). */
export function scrollToTopSmooth(duration = 0.6) {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void; resize?: () => void } }).__lenis;
  if (lenis) lenis.scrollTo(0, { duration });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Resets the scroll to the top immediately, forces Lenis to recalculate
 * its internal scroll dimensions and limits, and refreshes GSAP ScrollTrigger.
 * Essential when dynamic content shrinks (e.g. from 100 products to 10 products)
 * so that no lingering virtual scroll runway or blank empty spaces remain.
 */
export function resetScrollAndResize() {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void; resize?: () => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.resize?.();
  }
  window.scrollTo(0, 0);
  try {
    const { ScrollTrigger } = require("./gsap");
    ScrollTrigger?.refresh?.();
  } catch {}
}

/**
 * Forces Lenis and GSAP ScrollTrigger to recalculate their height bounds
 * to match the current DOM content without changing the scroll position.
 */
export function recalculateScrollBounds() {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as { __lenis?: { resize?: () => void } }).__lenis;
  lenis?.resize?.();
  try {
    const { ScrollTrigger } = require("./gsap");
    ScrollTrigger?.refresh?.();
  } catch {}
}

