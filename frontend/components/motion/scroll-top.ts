/** Jump to the top of the page at once — also stops any smooth-scroll (Lenis) momentum that is still running. */
export function scrollTopNow() {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

/** Smoothly scroll to the top of the page (supports Lenis smooth-scroll if active). */
export function scrollToTopSmooth(duration = 0.6) {
  if (typeof window === "undefined") return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(0, { duration });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
