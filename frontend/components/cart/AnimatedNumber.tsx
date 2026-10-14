"use client";

import { gsap } from "@/components/motion/gsap";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** how to write the number on screen (money, count…) */
  format: (n: number) => string;
  className?: string;
  /** seconds */
  duration?: number;
}

/**
 * A number that counts from its old value to its new one whenever it changes (the cart total).
 * With "reduce motion" on, it just shows the new value. The real value is always what a screen reader gets.
 */
export default function AnimatedNumber({ value, format, className, duration = 0.6 }: Props) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const tween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (from.current === value) return;
    tween.current?.kill();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const state = { n: from.current };
    tween.current = gsap.to(state, {
      n: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        from.current = state.n;
        setShown(state.n);
      },
      onComplete: () => {
        from.current = value;
        setShown(value);
      },
    });
    return () => {
      tween.current?.kill();
    };
  }, [value, duration]);

  return (
    <span className={className} aria-label={format(value)}>
      <span aria-hidden="true">{format(shown)}</span>
    </span>
  );
}
