"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Award, CheckCircle2, ChevronRight, Gift, HelpCircle, History, PackageCheck, Sparkles, TrendingUp, Truck } from "lucide-react";
import RequireLogin from "@/components/account/RequireLogin";
import { card, formatBDT, formatDate, Skeleton } from "@/components/account/ui";
import { getLoyaltySummary, type LoyaltySummary } from "@/lib/services/loyalty.service";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/locale";

function RewardsContent() {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";
  const [data, setData] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getLoyaltySummary()
      .then((res) => {
        if (alive) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const points = data?.points ?? 0;
  const pointsValue = data?.pointsValue ?? 0;
  const milestone = data?.milestone;
  const settings = data?.settings;
  const interval = milestone?.interval ?? 5;
  const progressInCycle = milestone?.progressInCycle ?? 0;
  const maxWeightKg = milestone?.maxWeightKg ?? 5;
  const isMilestoneUnlocked = milestone?.isMilestoneUnlocked ?? false;
  const ordersLeft = milestone?.ordersUntilNextMilestone ?? interval;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-600 via-teal-700 to-primary p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
            <Sparkles className="h-4 w-4" />
            <span>{isBn ? "লয়্যালটি ও রিওয়ার্ডস প্রোগ্রাম" : "Loyalty & Rewards Program"}</span>
          </div>
          <h1 className="mt-2 font-outfit text-2xl font-black tracking-tight sm:text-3xl">
            {isBn ? "অর্ডার করুন, পয়েন্ট অর্জন করুন এবং ছাড় নিন" : "Order, Earn Points & Enjoy Savings"}
          </h1>
          <p className="mt-2 text-sm text-emerald-50/90 leading-relaxed">
            {isBn
              ? "প্রতিটি অর্ডারে পয়েন্ট অর্জন করে টাকা হিসেবে ছাড় পান এবং প্রতি ৫টি সফল অর্ডারে পান ১০০% ফ্রি ডেলিভারি!"
              : "Earn points on every purchase to redeem as cash discounts, and unlock 100% Free Delivery on order milestones!"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-emerald-900 shadow transition hover:bg-emerald-50"
            >
              <Gift className="h-4 w-4" />
              {isBn ? "বাজার সদাই করুন" : "Start Shopping"}
            </Link>
          </div>
        </div>
        <Award className="absolute -bottom-6 -right-6 h-48 w-48 text-white/10" aria-hidden="true" />
      </div>

      {/* Hero cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card 1: Points */}
        <div className={`${card} p-5 sm:p-6 border-l-4 border-l-brand-fresh`}>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-fresh/15 text-brand-fresh">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
              {isBn ? "১০ পয়েন্ট = ৳১" : "10 pts = ৳1"}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {isBn ? "আপনার বর্তমান পয়েন্ট ব্যালেন্স" : "Available Points Balance"}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="font-outfit text-3xl font-black text-foreground">{points}</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ≈ {formatBDT(pointsValue)}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground space-y-1">
            <p>
              • {isBn ? `প্রতি ৳১০০ কেনাকাটায় ${settings?.pointsPerHundredSpent ?? 5} পয়েন্ট লাভ` : `Earn ${settings?.pointsPerHundredSpent ?? 5} points per ৳100 spent`}
            </p>
            <p>
              • {isBn ? `পয়েন্ট রিডিম করতে ন্যূনতম ৳${settings?.minOrderAmountToRedeem ?? 500}-এর অর্ডার প্রয়োজন` : `Min order of ৳${settings?.minOrderAmountToRedeem ?? 500} to redeem`}
            </p>
          </div>
        </div>

        {/* Card 2: Milestone Free Shipping */}
        <div className={`${card} p-5 sm:p-6 border-l-4 border-l-emerald-500`}>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Truck className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {isBn ? `সর্বোচ্চ ${maxWeightKg} কেজি পর্যন্ত` : `Up to ${maxWeightKg} kg`}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {isBn ? "মাইলস্টোন ফ্রি ডেলিভারি" : "Milestone Free Delivery"}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              {isMilestoneUnlocked ? (
                <p className="font-outfit text-xl font-black text-emerald-600 dark:text-emerald-400">
                  🎉 {isBn ? "ফ্রি ডেলিভারি আনলক হয়েছে!" : "Free Shipping Unlocked!"}
                </p>
              ) : (
                <p className="font-outfit text-2xl font-black text-foreground">
                  {progressInCycle} / {interval}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {isBn ? "সম্পন্ন অর্ডার" : "completed orders"}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>{isBn ? `পরবর্তী মাইলস্টোন: ${interval}টি অর্ডার` : `Milestone goal: ${interval} orders`}</span>
              <span className="font-bold text-foreground">
                {isMilestoneUnlocked
                  ? (isBn ? "পরবর্তী অর্ডারে সক্রিয়" : "Active on next order")
                  : (isBn ? `আর ${ordersLeft}টি অর্ডার বাকি` : `${ordersLeft} more to go`)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-brand-fresh transition-all duration-500"
                style={{ width: `${Math.min(100, isMilestoneUnlocked ? 100 : (progressInCycle / interval) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules explanation */}
      <div className={`${card} p-5 sm:p-6`}>
        <h2 className="flex items-center gap-2 font-outfit text-base font-black text-foreground">
          <HelpCircle className="h-4 w-4 text-brand-fresh" />
          <span>{isBn ? "নিয়মাবলী ও যেভাবে কাজ করে" : "How The Rewards Program Works"}</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3.5">
            <span className="text-lg">🛍️</span>
            <p className="mt-2 font-semibold text-foreground text-sm">
              {isBn ? "১. কেনাকাটা করুন ও পয়েন্ট পান" : "1. Shop & Earn Points"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {isBn
                ? `প্রতি ৳১০০ মূল্যের পণ্য কিনলেই পাচ্ছেন ${settings?.pointsPerHundredSpent ?? 5} পয়েন্ট। পয়েন্ট সরাসরি আপনার অ্যাকাউন্টে জমা হবে।`
                : `Earn ${settings?.pointsPerHundredSpent ?? 5} points automatically for every ৳100 spent on completed orders.`}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3.5">
            <span className="text-lg">💵</span>
            <p className="mt-2 font-semibold text-foreground text-sm">
              {isBn ? "২. চেকআউটে টাকা ছাড় নিন" : "2. Redeem for Cash Discounts"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {isBn
                ? `ন্যূনতম ৳${settings?.minOrderAmountToRedeem ?? 500}-এর অর্ডারে যেকোনো সময় আপনার পয়েন্টগুলো সরাসরি ক্যাশ ডিসকাউন্ট হিসেবে ব্যবহার করুন।`
                : `Use points at checkout for direct BDT discounts on orders of ৳${settings?.minOrderAmountToRedeem ?? 500} or more.`}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3.5">
            <span className="text-lg">🚚</span>
            <p className="mt-2 font-semibold text-foreground text-sm">
              {isBn ? "৩. প্রতি ৫ অর্ডারে ফ্রি ডেলিভারি" : "3. Free Shipping Milestones"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {isBn
                ? `প্রতি ${interval}টি ডেলিভারি সম্পন্ন হলে পরবর্তী অর্ডারে পাবেন ১০০% ফ্রি হোম ডেলিভারি (সর্বোচ্চ ${maxWeightKg} কেজি পর্যন্ত)। কোনো পয়েন্ট কাটার প্রয়োজন নেই!`
                : `Every ${interval} delivered orders unlocks 100% Free Shipping on your next order (up to ${maxWeightKg} kg). Zero points deducted!`}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className={`${card} p-5 sm:p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-outfit text-base font-black text-foreground">
            <History className="h-4 w-4 text-primary" />
            <span>{isBn ? "পয়েন্ট লেনদেনের বিবরণ" : "Points Transaction History"}</span>
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {data?.transactions.length ?? 0} {isBn ? "টি লেনদেন" : "transactions"}
          </span>
        </div>

        {(!data?.transactions || data.transactions.length === 0) ? (
          <div className="flex flex-col items-center py-8 text-center">
            <PackageCheck className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isBn ? "এখনো কোনো পয়েন্ট লেনদেনের তথ্য নেই।" : "No points transactions recorded yet."}
            </p>
            <p className="text-xs text-muted-foreground/75 mt-0.5">
              {isBn ? "অর্ডার সম্পন্ন হলেই পয়েন্ট যোগ হবে।" : "Points will be credited automatically when you place orders."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-semibold">{isBn ? "তারিখ" : "Date"}</th>
                  <th className="pb-3 font-semibold">{isBn ? "বিবরণ" : "Description"}</th>
                  <th className="pb-3 font-semibold text-right">{isBn ? "পয়েন্ট" : "Points"}</th>
                  <th className="pb-3 font-semibold text-right">{isBn ? "ব্যালেন্স" : "Balance"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.transactions.map((tx) => {
                  const isPositive = tx.points > 0;
                  return (
                    <tr key={tx.id} className="text-xs sm:text-sm">
                      <td className="py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3 text-foreground">
                        <p className="font-medium">{tx.description}</p>
                        {tx.orderNumber && (
                          <span className="font-mono text-xs text-muted-foreground">
                            #{tx.orderNumber}
                          </span>
                        )}
                      </td>
                      <td className={`py-3 text-right font-black whitespace-nowrap ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                        {isPositive ? `+${tx.points}` : tx.points}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        {tx.balanceAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RewardsPage() {
  return (
    <RequireLogin>
      <RewardsContent />
    </RequireLogin>
  );
}
