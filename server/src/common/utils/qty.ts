// Quantities are decimals with up to 3 places (0.5 kg, 1.25 kg). Prisma hands them back as
// Decimal objects, JavaScript adds them with float noise: these keep both honest.

type DecimalLike = { toNumber(): number } | number | string | null | undefined;

/** Anything a Prisma Decimal column can come back as. */
export type Num = unknown;

/** A database number (Decimal, string or number) as a plain number. */
export function toNum(input: DecimalLike | Num): number {
  const value = input as DecimalLike;
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

/** Rounds to 3 decimals so 0.1 + 0.2 is 0.3, not 0.30000000000000004. */
export function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** Is `qty` a whole number of `step`s above zero (0.5, 1, 1.5 for step 0.5)? */
export function isOnStep(qty: number, step: number): boolean {
  if (step <= 0) return false;
  const k = round3(qty / step);
  return Math.abs(k - Math.round(k)) < 1e-9;
}

/** "0.5" / "2" without trailing zeros, for messages. */
export function fmtQty(n: number): string {
  return String(round3(n));
}
