import { compareSemver } from '../src/services/versionCheck';

describe('compareSemver version compatibility', () => {
  it('returns 0 for identical semver versions', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('2.15.3', '2.15.3')).toBe(0);
  });

  it('returns 1 when version A is higher than version B', () => {
    expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    expect(compareSemver('1.1.0', '1.0.9')).toBe(1);
    expect(compareSemver('2.0.0', '1.99.99')).toBe(1);
  });

  it('returns -1 when version A is lower than version B', () => {
    expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
    expect(compareSemver('0.9.5', '1.0.0')).toBe(-1);
    expect(compareSemver('1.2.0', '1.2.5')).toBe(-1);
  });
});
