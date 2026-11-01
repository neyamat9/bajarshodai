import { formatQuantity } from "./format";
import { clientLocale, type Locale } from "./locale";
import type { ProductUnit } from "./types";

// Quantities can be parts of a unit (0.5 kg). These helpers keep the + / − buttons, the cart and the
// labels in step with the unit rules the server also enforces.

const DEFAULT_RULE = { allowDecimal: false, step: 1, minQty: 1 };

export const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

type Rule = Pick<ProductUnit, "allowDecimal" | "step" | "minQty">;
const ruleOf = (unit?: Rule | null): Rule => unit ?? DEFAULT_RULE;

/** The first quantity put in the cart: the smallest one allowed. */
export function startQty(unit?: Rule | null): number {
  const { step, minQty } = ruleOf(unit);
  return Math.max(step, minQty);
}

/**
 * What the + button gives: one step more, never above what is in stock (rounded down to a full step).
 * Returns null when there is no room for another step.
 */
export function stepUp(current: number, unit: Rule | null | undefined, stock: number): number | null {
  const { step } = ruleOf(unit);
  const next = round3(current + step);
  return next <= stock + 1e-9 ? next : null;
}

/** What the − button gives: one step less, or null when that goes below the minimum (the line is removed). */
export function stepDown(current: number, unit: Rule | null | undefined): number | null {
  const { step, minQty } = ruleOf(unit);
  const min = Math.max(step, minQty);
  const next = round3(current - step);
  return next + 1e-9 >= min ? next : null;
}

/** "২ কেজি" / "0.5 kg" / "3 pcs": the amount with its unit, in the page language. */
export function formatWithUnit(qty: number, unit: Pick<ProductUnit, "label"> | null | undefined, locale: Locale = clientLocale()): string {
  const n = formatQuantity(qty, locale);
  return unit?.label ? `${n} ${unit.label}` : n;
}
