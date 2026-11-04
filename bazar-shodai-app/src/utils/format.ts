const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts English number/string to Bengali numerals
 */
export function toBengaliNumerals(num: number | string): string {
  return String(num).replace(/\d/g, (digit) => BENGALI_NUMERALS[parseInt(digit, 10)] ?? digit);
}

/**
 * Formats a currency amount into standard BDT currency string (e.g. ৳1,250 or ৳১,২৫০)
 */
export function formatBdt(
  amount: number,
  options?: { locale?: 'en' | 'bn'; showDecimals?: boolean },
): string {
  const { locale = 'bn', showDecimals = false } = options ?? {};

  const rounded = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1];

  // South Asian grouping: 1,00,000 or standard 1,000
  const formattedInt = Number(intPart).toLocaleString('en-IN');
  const fullFormatted = decPart ? `${formattedInt}.${decPart}` : formattedInt;

  if (locale === 'bn') {
    return `৳${toBengaliNumerals(fullFormatted)}`;
  }
  return `৳${fullFormatted}`;
}
