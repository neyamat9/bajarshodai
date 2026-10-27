"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";
import Image from "next/image";
import { Leaf, Sprout, Tractor, HeartPulse, Sparkles, ShieldCheck } from "lucide-react";

interface BadgeItem {
  id: string;
  en: { title: string; subtitle: string };
  bn: { title: string; subtitle: string };
  icon: typeof Leaf;
  position: {
    top: string;
    left?: string;
    right?: string;
  };
  lineCoords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

const BADGES: BadgeItem[] = [
  // Left side badges
  {
    id: "organic",
    en: { title: "100% Organic", subtitle: "Chemical Free" },
    bn: { title: "১০০% অর্গানিক", subtitle: "সম্পূর্ণ নিরাপদ" },
    icon: Leaf,
    position: { top: "22%", left: "12%" },
    lineCoords: { x1: 18, y1: 24, x2: 43, y2: 45 },
  },
  {
    id: "farm-fresh",
    en: { title: "Farm Fresh Daily", subtitle: "Harvested Today" },
    bn: { title: "প্রতিদিন তাজা খামার", subtitle: "সকালে সংগৃহীত" },
    icon: Tractor,
    position: { top: "45%", left: "5%" },
    lineCoords: { x1: 14, y1: 48, x2: 38, y2: 56 },
  },
  {
    id: "green-lifestyle",
    en: { title: "Green Life Style", subtitle: "Healthy Eating" },
    bn: { title: "স্বাস্থ্যকর জীবনযাত্রা", subtitle: "পুষ্টিকর খাবার" },
    icon: Sprout,
    position: { top: "68%", left: "11%" },
    lineCoords: { x1: 18, y1: 70, x2: 40, y2: 68 },
  },

  // Right side badges
  {
    id: "healthy-natural",
    en: { title: "Healthy & Natural", subtitle: "Pure Nutrition" },
    bn: { title: "স্বাস্থ্যকর ও প্রাকৃতিক", subtitle: "বিশুদ্ধ পুষ্টি" },
    icon: HeartPulse,
    position: { top: "22%", right: "12%" },
    lineCoords: { x1: 82, y1: 24, x2: 57, y2: 45 },
  },
  {
    id: "direct-farms",
    en: { title: "Fresh From Farms", subtitle: "Direct Sourced" },
    bn: { title: "সরাসরি খামার থেকে", subtitle: "কৃষকের হাতের ছোঁয়া" },
    icon: ShieldCheck,
    position: { top: "45%", right: "5%" },
    lineCoords: { x1: 86, y1: 48, x2: 62, y2: 56 },
  },
  {
    id: "pure-goodness",
    en: { title: "Pure Green Goodness", subtitle: "Top Quality" },
    bn: { title: "বিশুদ্ধ সবুজ সতেজতা", subtitle: "সেরা মান নিশ্চিত" },
    icon: Sparkles,
    position: { top: "68%", right: "11%" },
    lineCoords: { x1: 82, y1: 70, x2: 60, y2: 68 },
  },
];

export default function FarmFreshShowcase() {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";

  return (
    <section
      aria-label="Farm Fresh Showcase"
      className="relative w-full overflow-hidden select-none border-none bg-secondary"
    >
      {/* ── Main Meadow Banner Container ────────────────────────── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/8.5] md:min-h-[520px] lg:min-h-[600px] flex items-center justify-center">
        {/* Background Meadow with Generous Headroom for Bag Handles */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/footer/farm_fresh_meadow.jpg"
            alt="Farm fresh vegetables background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_15%] sm:object-[center_top]"
          />

          {/* Super smooth color gradient at the top: matches the preceding section (bg-secondary) with zero visible seam */}
          <div className="absolute inset-x-0 top-0 h-20 sm:h-32 bg-gradient-to-b from-secondary via-secondary/60 to-transparent dark:from-secondary dark:via-secondary/80 pointer-events-none z-10" />

          {/* Bottom organic green ground plane that seamlessly merges into the attached footer */}
          <div className="absolute inset-x-0 bottom-0 h-36 sm:h-48 md:h-56 bg-gradient-to-b from-transparent via-[#0b6234]/80 to-[#0b6234] dark:to-[#0a2e18] pointer-events-none z-10" />
        </div>

        {/* ── Desktop-Only Floating Constellation & Badges ────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center">
          
          {/* SVG Dotted Connector Lines (Desktop Only) */}
          <svg
            className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#45a22c" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {BADGES.map((b) => (
              <g key={`line-${b.id}`}>
                <line
                  x1={`${b.lineCoords.x1}%`}
                  y1={`${b.lineCoords.y1}%`}
                  x2={`${b.lineCoords.x2}%`}
                  y2={`${b.lineCoords.y2}%`}
                  stroke="url(#lineGrad)"
                  strokeWidth="0.4"
                  strokeDasharray="1.5,1.5"
                  className="animate-pulse"
                />
                <circle
                  cx={`${b.lineCoords.x1}%`}
                  cy={`${b.lineCoords.y1}%`}
                  r="0.7"
                  fill="#45a22c"
                  className="opacity-80"
                />
              </g>
            ))}
          </svg>

          {/* 6 Orbital Badges (Desktop Only - completely hidden on small devices) */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-20">
            {BADGES.map((badge, idx) => {
              const Icon = badge.icon;
              const text = isBn ? badge.bn : badge.en;
              const isLeft = !!badge.position.left;
              const animationDelay = `${idx * 0.4}s`;

              return (
                <div
                  key={badge.id}
                  style={{
                    top: badge.position.top,
                    left: badge.position.left,
                    right: badge.position.right,
                  }}
                  className={`pointer-events-auto absolute -translate-y-1/2 flex items-center gap-3 transition-transform duration-300 hover:scale-105 ${
                    isLeft ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  {/* Circular Badge Button */}
                  <div
                    style={{ animationDelay }}
                    className="relative group cursor-pointer animate-badge-float"
                  >
                    {/* Glowing pulse ring */}
                    <div className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="relative flex flex-col items-center justify-center size-24 xl:size-28 rounded-full border-2 border-white/80 bg-gradient-to-b from-[#52af36] to-[#3a9122] text-white shadow-[0_10px_25px_-5px_rgba(43,122,48,0.5)] p-2 text-center backdrop-blur-xs">
                      <Icon className="size-5 mb-0.5 text-lime-100 drop-shadow-xs" />
                      <span className="font-outfit font-black text-[11px] xl:text-xs leading-tight tracking-tight drop-shadow-xs">
                        {text.title}
                      </span>
                      <span className="text-[9px] text-lime-100/90 font-medium leading-none mt-0.5">
                        {text.subtitle}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spacer so the tote bag has breathing room before the footer text */}
          <div className="h-16 sm:h-24 md:h-36 lg:h-48 w-full pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
