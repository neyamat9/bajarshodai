"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger } from "./gsap";

const R = 21;
const C = 2 * Math.PI * R;

/** Floating back-to-top button with a scroll-progress ring; springs in after the first screen. */
export default function ScrollToTop() {
  const t = useTranslations("Common");
  const btn = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = btn.current;
    if (!el) return;
    gsap.set(el, { autoAlpha: 0, y: 30, scale: 0.5 });
    let shown = false;
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - self.progress));
        const should = window.scrollY > 600;
        if (should !== shown) {
          shown = should;
          gsap.to(
            el,
            should
              ? { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(2)", overwrite: true }
              : { autoAlpha: 0, y: 30, scale: 0.5, duration: 0.35, ease: "power2.in", overwrite: true },
          );
        }
      },
    });
    return () => st.kill();
  }, []);

  function toTop() {
    const w = window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void } };
    if (w.__lenis) w.__lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    const arrow = btn.current?.querySelector(".arrow");
    if (arrow) gsap.fromTo(arrow, { y: 0 }, { y: -6, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" });
  }

  return (
    <button
      ref={btn}
      type="button"
      onClick={toTop}
      aria-label={t("scrollTop")}
      className="scroll-top-btn group fixed right-3.5 sm:right-6 z-[1500] flex h-9.5 w-9.5 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-[bottom,background-color,color] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-brand-fresh hover:text-on-fresh"
      style={{ visibility: "hidden", bottom: "var(--floating-bottom, 1rem)" }}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
        <circle
          ref={ring}
          cx="24"
          cy="24"
          r={R}
          fill="none"
          className="stroke-brand-fresh group-hover:stroke-on-fresh"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
        />
      </svg>
      <ArrowUp className="arrow relative h-4 w-4 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
    </button>
  );
}
