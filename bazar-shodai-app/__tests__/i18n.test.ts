import { t, setAppLanguage } from '../src/i18n';

describe('i18n translation engine', () => {
  beforeEach(() => {
    setAppLanguage('en');
  });

  it('translates nested key accurately in English', () => {
    expect(t('common.appName')).toBe('Bazar Shodai');
    expect(t('nav.home')).toBe('Home');
    expect(t('cart.title')).toBe('My Shopping Bag');
  });

  it('interpolates template parameters properly', () => {
    const text = t('cart.freeDeliveryProgress', { amount: 150 });
    expect(text).toBe('Add ৳150 more for FREE delivery!');
  });

  it('switches to Bengali and translates keys properly', () => {
    setAppLanguage('bn');
    expect(t('common.appName')).toBe('বাজার সদাই');
    expect(t('nav.home')).toBe('হোম');
    expect(t('cart.title')).toBe('আমার বাজার ব্যাগ');
  });

  it('falls back to key if neither language has translation', () => {
    expect(t('nonexistent.path.to.key')).toBe('nonexistent.path.to.key');
  });
});
