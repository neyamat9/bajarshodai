"use client";

import { Link } from "@/i18n/navigation";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import type { Banner, HeroConfig } from "@/lib/services/site.service";
import type { Category, Product } from "@/lib/types";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface HeroSectionProps {
  /** Banners the shop owner set up in the dashboard (HERO_MAIN slider + HERO_SIDE cards) */
  main: Banner[];
  side: Banner[];
  /** Real products whose photos fill the big banner stack */
  spotlight?: Product[];
  /** Categories shown as the two tiles on the right */
  categories?: Category[];
  /** Dynamic hero layout and slide controls configured in dashboard */
  heroConfig?: HeroConfig;
}


/* ─────────────── dashboard-managed banners (when the owner has set some up) ─────────────── */

function BannerSlide({ b, priority, sizes = "(min-width: 1024px) 66vw, 100vw" }: { b: Banner; priority?: boolean; sizes?: string }) {
  const t = useTranslations("Home");
  const showTextOverlay = Boolean((b.title || b.subtitle) && (b.textColor || b.bgColor));
  const inner = (
    <>
      {b.mobileImageUrl ? (
        <>
          {/* Mobile view (< md): Small screen optimized image */}
          <Image
            src={b.mobileImageUrl}
            alt={b.title ?? t("bannerAlt")}
            fill
            priority={priority}
            sizes="100vw"
            className="block md:hidden object-cover object-center"
            unoptimized
          />
          {/* Large devices (>= md): High-resolution desktop image */}
          <Image
            src={b.imageUrl}
            alt={b.title ?? t("bannerAlt")}
            fill
            priority={priority}
            sizes={sizes}
            className="hidden md:block object-cover object-center"
            unoptimized
          />
        </>
      ) : (
        <Image
          src={b.imageUrl}
          alt={b.title ?? t("bannerAlt")}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-center"
          unoptimized
        />
      )}
      {showTextOverlay && (
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-deep/80 to-transparent p-6 md:p-10"
          style={b.textColor ? { color: b.textColor } : undefined}
        >
          {b.title && <h2 className="font-outfit text-2xl font-black tracking-tight text-white md:text-4xl">{b.title}</h2>}
          {b.subtitle && <p className="mt-1 text-sm font-medium text-white/85 md:text-base">{b.subtitle}</p>}
        </div>
      )}
    </>
  );
  return b.href ? (
    <Link href={b.href} className="absolute inset-0 block">
      {inner}
    </Link>
  ) : (
    <div className="absolute inset-0">{inner}</div>
  );
}

function Slider({
  banners,
  intervalSec = 6,
  fullWidth = false,
}: {
  banners: Banner[];
  intervalSec?: number;
  fullWidth?: boolean;
}) {
  const [i, setI] = useState(0);
  const n = banners.length;
  const t = useTranslations("Home");
  const next = useCallback(() => setI((x) => (x + 1) % n), [n]);
  const prev = useCallback(() => setI((x) => (x - 1 + n) % n), [n]);

  // Touch gesture support for mobile finger swiping
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger only if horizontal swipe is dominant and exceeds 40px threshold
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        next();
      } else {
        prev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    if (n < 2) return;
    const ms = Math.max(2, intervalSec) * 1000;
    const timer = setInterval(next, ms);
    return () => clearInterval(timer);
  }, [n, next, intervalSec, i]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative h-full w-full overflow-hidden rounded border border-border bg-secondary touch-pan-y select-none ${
        fullWidth
          ? "aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7.5] min-h-[220px] sm:min-h-[380px] md:min-h-[460px] lg:min-h-[500px]"
          : "aspect-[16/10] sm:aspect-[16/9] min-h-[220px] sm:min-h-[340px] md:min-h-[440px] lg:aspect-auto lg:h-full lg:min-h-0"
      }`}
    >
      {banners.map((b, idx) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={idx !== i}
        >
          <BannerSlide b={b} priority={idx === 0} sizes={fullWidth ? "100vw" : "(min-width: 1024px) 66vw, 100vw"} />
        </div>
      ))}
      {n > 1 && (
        <>
          {/* Side navigation arrows - hidden on mobile/small devices, visible on md+ desktop */}
          <button
            type="button"
            aria-label={t("prevBanner")}
            onClick={prev}
            className="absolute left-2 sm:left-3 top-1/2 z-10 hidden md:flex h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded bg-card/90 text-foreground shadow transition-colors hover:bg-brand-fresh hover:text-on-fresh"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            aria-label={t("nextBanner")}
            onClick={next}
            className="absolute right-2 sm:right-3 top-1/2 z-10 hidden md:flex h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded bg-card/90 text-foreground shadow transition-colors hover:bg-brand-fresh hover:text-on-fresh"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="absolute bottom-4 right-5 z-10 flex gap-2">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                aria-label={t("showBanner", { n: idx + 1 })}
                onClick={() => setI(idx)}
                className={`h-2 rounded transition-all ${idx === i ? "w-8 bg-brand-fresh" : "w-2 bg-card/70 hover:bg-card"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────── big banner: a stack of promo cards driven by the mouse wheel ─────────────── */

interface StackCard {
  key: string;
  src: string;
  alt: string;
  href: string;
  title: string;
  sub: string;
  cta: string;
}

/** position inside [0, n) */
const wrap = (v: number, n: number) => ((v % n) + n) % n;

/**
 * One continuous "position" value drives the stack.
 *  - Idle: it auto-advances every few seconds with a smooth glide.
 *  - Mouse over the banner: auto-play stops and the wheel scrubs through the cards
 *    (the front card lifts up and away while the next rises in). The page only
 *    scrolls again when the stack is at its first/last card.
 */
function CardStack({ cards }: { cards: StackCard[] }) {
  const tr = useTranslations("Home");
  const stack = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const api = useRef<{ goTo: (i: number) => void } | null>(null);
  const n = cards.length;

  useGSAP(
    () => {
      const el = stack.current;
      if (!el || n < 2) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-stack-card]", el);

      const state = { cur: 0, target: 0, hover: false, lastWheel: 0, idleFor: 0 };
      let shown = 0;

      const render = () => {
        items.forEach((card, i) => {
          const d = wrap(i - state.cur + 1, n) - 1;
          if (d < 0) {
            const t = -d; // 0 → 1 while leaving
            gsap.set(card, {
              yPercent: -t * 118,
              y: 0,
              rotate: -t * 7,
              scale: 1 - t * 0.06,
              opacity: 1 - Math.pow(t, 1.6),
              zIndex: 200,
              pointerEvents: "none",
            });
          } else {
            gsap.set(card, {
              // waiting cards sit exactly behind the front one (no peeking edges);
              // only the very next card is present, ready to be revealed
              yPercent: 0,
              y: 0,
              rotate: 0,
              scale: 1,
              opacity: d > 1.001 ? 0 : 1,
              zIndex: 100 - Math.round(d),
              pointerEvents: d < 0.5 ? "auto" : "none",
            });
          }
        });
        const idx = Math.round(wrap(state.cur, n)) % n;
        if (idx !== shown) {
          shown = idx;
          setActive(idx);
        }
      };
      render();

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const ease = (dt: number, k: number) => 1 - Math.pow(1 - k, dt * 60);

        const tick = (_t: number, dtMs: number) => {
          const dt = dtMs / 1000;
          const diff = state.target - state.cur;
          if (Math.abs(diff) > 0.0005) {
            state.cur += diff * ease(dt, 0.09);
            render();
          } else if (state.cur !== state.target) {
            state.cur = state.target;
            render();
          }
          if (!state.hover) {
            state.idleFor += dt;
            if (state.idleFor > 4.8) {
              state.idleFor = 0;
              state.target = Math.round(state.target) + 1;
            }
          }
          if (state.hover && state.lastWheel && performance.now() - state.lastWheel > 160) {
            state.lastWheel = 0;
            state.target = Math.round(state.target);
          }
        };
        gsap.ticker.add(tick);

        const onEnter = () => {
          state.hover = true;
          const w = wrap(state.cur, n);
          state.cur = w;
          state.target = Math.round(w);
          render();
        };
        const onLeave = () => {
          state.hover = false;
          state.idleFor = 2.6;
        };
        const onWheel = (e: WheelEvent) => {
          const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
          if ((state.target <= 0 && dy < 0) || (state.target >= n - 1 && dy > 0)) return; // at an end: page scrolls
          e.preventDefault();
          e.stopPropagation();
          state.target = Math.min(n - 1, Math.max(0, state.target + dy * 0.0021));
          state.lastWheel = performance.now();
        };

        api.current = {
          goTo: (i: number) => {
            state.hover = true;
            state.target = i;
            state.idleFor = 0;
          },
        };
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => {
          gsap.ticker.remove(tick);
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
          el.removeEventListener("wheel", onWheel);
        };
      });
      return () => mm.revert();
    },
    { scope: stack, dependencies: [n] },
  );

  return (
    <div
      ref={stack}
      data-hero-frame
      className="relative aspect-[4/3.6] w-full select-none min-[420px]:aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full"
      aria-roledescription="carousel"
      aria-label={tr("featuredAria")}
    >
      {cards.map((c, i) => (
        <Link
          key={c.key}
          href={c.href}
          data-stack-card
          draggable={false}
          className="group absolute inset-0 block overflow-hidden rounded border border-border bg-brand-deep will-change-transform"
        >
          <Image
            src={c.src}
            alt={c.alt}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
            draggable={false}
          />
          {/* brand-deep wash so the copy always reads */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/95 via-brand-deep/60 to-brand-deep/10 sm:from-brand-deep/90 sm:via-brand-deep/45 sm:to-transparent" />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-[34rem] flex-col justify-center gap-2 overflow-hidden p-4 pb-9 min-[420px]:gap-3 min-[420px]:p-6 sm:p-9 lg:p-12">
            <h2 className="line-clamp-3 break-words font-outfit text-xl font-black leading-[1.1] tracking-tight text-white min-[420px]:text-3xl min-[420px]:leading-[1.05] sm:line-clamp-4 sm:text-4xl lg:text-5xl">
              {c.title}
            </h2>
            <p className="line-clamp-2 max-w-sm text-xs font-medium text-white/85 min-[420px]:text-sm sm:text-base">{c.sub}</p>
            <span className="mt-1 inline-flex w-fit items-center gap-2 rounded bg-brand-fresh px-4 py-2.5 text-xs font-extrabold min-[420px]:mt-2 min-[420px]:px-5 min-[420px]:py-3 min-[420px]:text-sm text-on-fresh shadow-[0_10px_24px_-10px_rgba(69,162,44,0.9)] transition-transform group-hover:translate-x-1">
              {c.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}

      {/* progress dots */}
      <div className="absolute bottom-3 left-1/2 z-[200] flex -translate-x-1/2 gap-2 sm:bottom-4 sm:left-auto sm:right-5 sm:translate-x-0" role="tablist" aria-label={tr("chooseBanner")}>
        {cards.map((c, i) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={tr("showBanner", { n: i + 1 })}
            onClick={() => api.current?.goTo(i)}
            className={`h-1.5 rounded transition-all duration-500 ${i === active ? "w-8 bg-brand-fresh" : "w-3 bg-white/60 hover:bg-white"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── right-hand tiles ─────────────── */

function CategoryTile({ cat, tone }: { cat: Category; tone: "deep" | "fresh" }) {
  const t = useTranslations("Home");
  const locale = useLocale() as Locale;
  const known = t.has(`tiles.${cat.slug}.title`);
  const title = known ? t(`tiles.${cat.slug}.title`) : cat.name;
  const sub = known ? t(`tiles.${cat.slug}.sub`) : t("tileFallbackSub", { count: formatNumber(cat.productCount, locale, 0) });
  const image = (cat as Category & { image?: string | null }).image;
  const deep = tone === "deep";
  return (
    <Link
      href={`/category/${cat.slug}`}
      data-hero-item
      className={`group relative flex min-h-[180px] overflow-hidden rounded border min-[480px]:min-h-[170px] sm:min-h-[200px] lg:min-h-0 ${
        deep ? "border-brand-deep bg-gradient-to-br from-brand-deep to-primary text-white" : "border-brand-fresh bg-brand-fresh text-on-fresh"
      }`}
    >
      {/* photo fades into the tile colour */}
      {image && (
        <div
          className="absolute inset-y-0 right-0 w-[58%]"
          style={{ maskImage: "linear-gradient(to right, transparent, #000 55%)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 55%)" }}
        >
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 22vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
          />
        </div>
      )}
      <span className={`absolute -left-8 -top-8 h-24 w-24 rotate-12 ${deep ? "bg-brand-fresh/25" : "bg-white/25"}`} aria-hidden="true" />
      <div className="relative z-10 flex max-w-[62%] flex-col justify-between p-3.5 sm:p-6">
        <div>
          <h3 className="break-words font-outfit text-xl font-black leading-tight min-[480px]:text-base min-[560px]:text-lg sm:text-2xl">{title}</h3>
          <p className={`mt-1.5 text-xs font-medium min-[480px]:hidden sm:block sm:text-sm ${deep ? "text-white/75" : "text-on-fresh/80"}`}>{sub}</p>
        </div>
        <span
          className={`mt-3 inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-2 text-xs font-extrabold transition-all sm:mt-4 sm:px-3 group-hover:gap-2.5 sm:text-sm ${
            deep ? "bg-brand-fresh text-on-fresh" : "bg-brand-deep text-white"
          }`}
        >
          {t("shopNow")}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/* ─────────────── hero ─────────────── */

function Showcase({ spotlight, categories }: { spotlight: Product[]; categories: Category[] }) {
  const t = useTranslations("Home");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);
  const cards: StackCard[] = [
    {
      key: "intro",
      src: "/hero-welcome.webp",
      alt: t("introAlt"),
      href: "/products",
      title: t("introTitle"),
      sub: t("introSub"),
      cta: t("shopNow"),
    },
    ...spotlight.slice(0, 4).flatMap((p): StackCard[] => {
      const img = p.images[0]?.url;
      return img
        ? [
            {
              key: p.id,
              src: img,
              alt: p.name,
              href: `/products/${p.slug}`,
              title: p.name,
              sub: p.originalPrice && p.originalPrice > p.price ? t("nowWas", { price: money(p.price), was: money(p.originalPrice) }) : t("only", { price: money(p.price) }),
              cta: t("shopNow"),
            },
          ]
        : [];
    }),
  ];
  if (cards.length < 3) {
    cards.push({
      key: "fallback-fresh",
      src: "/hero-welcome.webp",
      alt: t("freshAlt"),
      href: "/products",
      title: t("freshTitle"),
      sub: t("freshSub"),
      cta: t("shopFresh"),
    });
  }

  const pick = (slug: string) => categories.find((c) => c.slug === slug);
  const tiles = [pick("fish"), pick("fruits-and-vegetables")].filter(Boolean) as Category[];
  for (const c of categories) if (tiles.length < 2 && !tiles.includes(c)) tiles.push(c);

  return (
    <div className="grid gap-4 lg:h-[480px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <CardStack cards={cards} />
      {tiles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {tiles.slice(0, 2).map((c, i) => (
            <CategoryTile key={c.slug} cat={c} tone={i === 0 ? "deep" : "fresh"} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroSection({
  main,
  side,
  spotlight = [],
  categories = [],
  heroConfig,
}: HeroSectionProps) {
  const root = useRef<HTMLElement>(null);
  const isSliderOnly = heroConfig?.layout === "SLIDER_ONLY";
  const maxSlides = heroConfig?.maxSlides ?? 5;
  const intervalSec = heroConfig?.autoplayIntervalSec ?? 6;
  const activeMain = main.slice(0, maxSlides);
  const hasSide = !isSliderOnly && side.length > 0;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.fromTo("[data-hero-frame]", { y: 80, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1.4 }, 0.05)
          .fromTo("[data-hero-item]", { y: 70, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.16 }, 0.25);

        // the banner stack drifts upward slightly as the page scrolls away
        gsap.to("[data-hero-frame]", {
          yPercent: -4,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} data-hero className="relative overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(color-mix(in oklab, var(--brand-deep) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, #fff, transparent 85%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-6 md:px-8 lg:pb-20 lg:pt-8">
        {activeMain.length > 0 ? (
          isSliderOnly ? (
            <div className="w-full">
              <Slider banners={activeMain} intervalSec={intervalSec} fullWidth />
            </div>
          ) : (
            <div className="grid gap-4 lg:h-[480px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="min-w-0 h-full">
                <Slider banners={activeMain} intervalSec={intervalSec} fullWidth={isSliderOnly || !hasSide} />
              </div>
              {hasSide && (
                <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
                  {/* Top card: first side banner (e.g. Medicine banner) */}
                  {side[0] && (
                    <div key={side[0].id} className="relative min-h-[180px] overflow-hidden rounded border border-border bg-secondary">
                      <BannerSlide b={side[0]} sizes="(min-width: 1024px) 33vw, 100vw" />
                    </div>
                  )}
                  {/* Bottom card: second side banner or category tile if only 1 side banner */}
                  {side[1] ? (
                    <div key={side[1].id} className="relative min-h-[180px] overflow-hidden rounded border border-border bg-secondary">
                      <BannerSlide b={side[1]} sizes="(min-width: 1024px) 33vw, 100vw" />
                    </div>
                  ) : categories[0] ? (
                    <CategoryTile cat={categories[0]} tone="fresh" />
                  ) : null}
                </div>
              )}
            </div>
          )
        ) : (
          <Showcase spotlight={spotlight} categories={categories} />
        )}
      </div>
    </section>
  );
}
