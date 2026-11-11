import { BadRequestException } from '@nestjs/common';
import { assertQuantity, floorToStep, saleRuleOf } from './quantity-rules';
import { fmtQty, isOnStep, round3, toNum } from '../utils/qty';

const kg = { allowDecimal: true, defaultStep: 0.5, defaultMinQty: 0.5 };
const piece = { allowDecimal: false, defaultStep: 1, defaultMinQty: 1 };

describe('qty helpers', () => {
  it('rounds away float noise', () => {
    expect(round3(0.1 + 0.2)).toBe(0.3);
    expect(round3(1.2345)).toBe(1.235);
  });

  it('reads Decimal-like values', () => {
    expect(toNum({ toNumber: () => 2.5 })).toBe(2.5);
    expect(toNum('1.25')).toBe(1.25);
    expect(toNum(null)).toBe(0);
    expect(toNum(3)).toBe(3);
  });

  it('knows what is on a step', () => {
    expect(isOnStep(1.5, 0.5)).toBe(true);
    expect(isOnStep(1.25, 0.5)).toBe(false);
    expect(isOnStep(0.75, 0.25)).toBe(true);
    expect(isOnStep(3, 1)).toBe(true);
    expect(isOnStep(1, 0)).toBe(false);
  });

  it('prints quantities without trailing zeros', () => {
    expect(fmtQty(2)).toBe('2');
    expect(fmtQty(0.5)).toBe('0.5');
  });
});

describe('saleRuleOf', () => {
  it('takes the unit defaults', () => {
    expect(saleRuleOf({ unit: kg })).toEqual({ allowDecimal: true, step: 0.5, min: 0.5, max: null });
    expect(saleRuleOf({ unit: piece })).toEqual({ allowDecimal: false, step: 1, min: 1, max: null });
  });

  it('lets the product override step and minimum', () => {
    expect(saleRuleOf({ unit: kg, sellStep: 0.25, minQty: 1 })).toEqual({
      allowDecimal: true,
      step: 0.25,
      min: 1,
      max: null,
    });
  });

  it('safely ensures minimum is on step even if DB has a smaller or misaligned minimum', () => {
    expect(saleRuleOf({ unit: kg, sellStep: 1, minQty: 0.5 })).toEqual({
      allowDecimal: true,
      step: 1,
      min: 1,
      max: null,
    });
  });

  it('treats a product without a unit as whole pieces', () => {
    expect(saleRuleOf({})).toEqual({ allowDecimal: false, step: 1, min: 1, max: null });
  });

  it('respects maximum order quantity when set', () => {
    expect(saleRuleOf({ unit: kg, maxQty: 5 })).toEqual({
      allowDecimal: true,
      step: 0.5,
      min: 0.5,
      max: 5,
    });
  });
});

describe('assertQuantity', () => {
  const rule = saleRuleOf({ unit: kg, minQty: 1 });

  it('accepts a quantity on the step above the minimum', () => {
    expect(() => assertQuantity(1, rule, 'Rui')).not.toThrow();
    expect(() => assertQuantity(1.5, rule, 'Rui')).not.toThrow();
  });

  it('refuses less than the minimum', () => {
    expect(() => assertQuantity(0.5, rule, 'Rui')).toThrow(BadRequestException);
  });

  it('refuses a quantity off the step', () => {
    expect(() => assertQuantity(1.3, rule, 'Rui')).toThrow(/steps of 0.5/);
  });

  it('refuses halves for a whole-number unit', () => {
    const pieces = saleRuleOf({ unit: piece });
    expect(() => assertQuantity(1.5, pieces, 'Soap')).toThrow(/whole numbers/);
    expect(() => assertQuantity(2, pieces, 'Soap')).not.toThrow();
  });

  it('refuses zero and negatives', () => {
    expect(() => assertQuantity(0, rule, 'Rui')).toThrow();
    expect(() => assertQuantity(-1, rule, 'Rui')).toThrow();
  });
});

describe('floorToStep', () => {
  it('stops at the last full step the stock allows', () => {
    expect(floorToStep(7.4, { allowDecimal: true, step: 0.5, min: 0.5 })).toBe(7);
    expect(floorToStep(3, { allowDecimal: false, step: 1, min: 1 })).toBe(3);
    expect(floorToStep(0.4, { allowDecimal: true, step: 0.5, min: 0.5 })).toBe(0);
  });
});
