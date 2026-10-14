import { isBdMobile, normalizeBdPhone, parseLoginIdentifier } from './phone';

describe('phone helpers', () => {
  it('normalises the common ways of writing a number', () => {
    expect(normalizeBdPhone('+88 01712-345678')).toBe('01712345678');
    expect(normalizeBdPhone('8801712345678')).toBe('01712345678');
    expect(normalizeBdPhone('1712345678')).toBe('01712345678');
    expect(normalizeBdPhone('01712 345678')).toBe('01712345678');
  });

  it('accepts only Bangladeshi mobile numbers', () => {
    expect(isBdMobile('01712345678')).toBe(true);
    expect(isBdMobile('01212345678')).toBe(false);
    expect(isBdMobile('0171234')).toBe(false);
  });

  it('tells a phone login from an email login', () => {
    expect(parseLoginIdentifier(' +8801712345678 ')).toEqual({
      type: 'phone',
      phone: '01712345678',
    });
    expect(parseLoginIdentifier(' Rahim@Example.COM ')).toEqual({
      type: 'email',
      email: 'rahim@example.com',
    });
  });
});
