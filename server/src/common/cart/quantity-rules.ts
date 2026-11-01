import { BadRequestException } from '@nestjs/common';
import { fmtQty, isOnStep, round3, toNum } from '../utils/qty';

/** How a product may be bought: whole numbers only, the step of the + / − buttons, the smallest quantity. */
export interface SaleRule {
  allowDecimal: boolean;
  step: number;
  min: number;
}

interface RuleSource {
  sellStep?: unknown;
  minQty?: unknown;
  unit?: {
    allowDecimal: boolean;
    defaultStep: unknown;
    defaultMinQty: unknown;
  } | null;
}

/** The rule of a product: its own step / minimum if set, else the unit's, else whole pieces. */
export function saleRuleOf(p: RuleSource): SaleRule {
  const u = p.unit;
  if (!u) return { allowDecimal: false, step: 1, min: 1 };
  const step = toNum(p.sellStep ?? u.defaultStep) || 1;
  const rawMin = toNum(p.minQty ?? u.defaultMinQty) || step;
  // A product's minimum quantity cannot be less than its step, and must align with the step.
  const min = Math.max(
    step,
    isOnStep(rawMin, step) ? rawMin : Math.ceil(round3(rawMin / step)) * step,
  );
  return {
    allowDecimal: u.allowDecimal,
    step,
    min,
  };
}

/** Throws a clear message when `qty` is not something this product can be sold as. */
export function assertQuantity(qty: number, rule: SaleRule, name: string) {
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new BadRequestException('Enter a quantity above zero');
  }
  if (!rule.allowDecimal && !Number.isInteger(qty)) {
    throw new BadRequestException(`${name} is sold in whole numbers`);
  }
  if (qty + 1e-9 < rule.min) {
    throw new BadRequestException(
      `The smallest quantity of ${name} is ${fmtQty(rule.min)}`,
    );
  }
  if (!isOnStep(qty, rule.step)) {
    throw new BadRequestException(
      `${name} is sold in steps of ${fmtQty(rule.step)}`,
    );
  }
}

/** The largest quantity that is on the product's step and not above `limit`. */
export function floorToStep(limit: number, rule: SaleRule): number {
  const k = Math.floor(round3(limit / rule.step) + 1e-9);
  return round3(k * rule.step);
}
