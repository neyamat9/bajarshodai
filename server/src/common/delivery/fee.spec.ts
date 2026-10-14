import { feeForDistance, haversineKm, withinRadius } from './fee';

const rule = { baseKm: 2, baseCharge: 20, perKmRate: 10, stepKm: 1 };

describe('feeForDistance', () => {
  it.each([
    [0, 20],
    [0.5, 20],
    [2, 20],
    [2.0000001, 20], // rounds to 2.00 first
    [2.01, 30],
    [3, 30],
    [3.01, 40],
    [4, 40],
    [19.5, 200],
    [19.01, 200],
    [20, 200],
  ])('%s km costs %s', (km, fee) => {
    expect(feeForDistance(km, rule)).toBe(fee);
  });

  it('follows the rates the admin sets', () => {
    expect(feeForDistance(5, { baseKm: 3, baseCharge: 30, perKmRate: 15, stepKm: 1 })).toBe(60);
    expect(feeForDistance(5, { baseKm: 2, baseCharge: 20, perKmRate: 10, stepKm: 0.5 })).toBe(80);
  });

  it('never goes below the base charge and ignores a negative distance', () => {
    expect(feeForDistance(-3, rule)).toBe(20);
  });

  it('does not loop on a zero step', () => {
    expect(feeForDistance(5, { ...rule, stepKm: 0 })).toBe(50);
  });
});

describe('distances', () => {
  it('measures a known distance', () => {
    // Dhaka to Chittagong is about 215 km in a straight line
    const km = haversineKm({ lat: 23.8103, lng: 90.4125 }, { lat: 22.3569, lng: 91.7832 });
    expect(km).toBeGreaterThan(200);
    expect(km).toBeLessThan(230);
  });

  it('is zero for the same point', () => {
    expect(haversineKm({ lat: 23.2, lng: 90.9 }, { lat: 23.2, lng: 90.9 })).toBe(0);
  });

  it('checks the service radius', () => {
    const centre = { lat: 23.2, lng: 90.9 };
    expect(withinRadius(centre, { lat: 23.25, lng: 90.9 }, 20).ok).toBe(true); // about 5.6 km
    expect(withinRadius(centre, { lat: 23.5, lng: 90.9 }, 20).ok).toBe(false); // about 33 km
    expect(withinRadius(centre, centre, 20).km).toBe(0);
  });
});
