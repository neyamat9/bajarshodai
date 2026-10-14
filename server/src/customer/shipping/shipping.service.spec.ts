import { DEFAULT_SETTINGS, type DeliverySettings } from '../../common/settings/settings.types';
import { ShippingService } from './shipping.service';

const ORIGIN = { lat: 23.2, lng: 90.9 };

function make(overrides: Partial<DeliverySettings> = {}, route = { km: 5, seconds: 900, estimated: false }) {
  const delivery: DeliverySettings = { ...DEFAULT_SETTINGS.delivery, originLat: ORIGIN.lat, originLng: ORIGIN.lng, ...overrides };
  const settings = { get: jest.fn().mockResolvedValue(delivery) };
  const maps = { route: jest.fn().mockResolvedValue({ ...route, meters: route.km * 1000, path: [] }) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { service: new ShippingService(settings as any, maps as any), maps };
}

describe('ShippingService.quote', () => {
  it('says why delivery is not possible', async () => {
    expect((await make({ enabled: false }).service.quote(500, { lat: 23.21, lng: 90.9 })).block).toBe('DISABLED');
    expect((await make({ originLat: null, originLng: null }).service.quote(500, { lat: 23.21, lng: 90.9 })).block).toBe('ORIGIN_NOT_SET');
    expect((await make().service.quote(500, {})).block).toBe('NO_LOCATION');
    const far = await make().service.quote(500, { lat: 23.5, lng: 90.9 });
    expect(far.block).toBe('OUT_OF_AREA');
    expect(far.available).toBe(false);
  });

  it('prices by road distance with the formula', async () => {
    const q = await make({}, { km: 5, seconds: 900, estimated: false }).service.quote(500, { lat: 23.25, lng: 90.9 });
    expect(q.available).toBe(true);
    // the road (5 km) is shorter than the straight line (about 5.56 km): the straight line is charged
    expect(q.distanceKm).toBeGreaterThanOrEqual(5.55);
    expect(q.calculatedFee).toBe(20 + 10 * Math.ceil((q.distanceKm! - 2) / 1));
  });

  it('keeps the road distance when it is longer than the straight line', async () => {
    const q = await make({}, { km: 9, seconds: 1200, estimated: false }).service.quote(500, { lat: 23.25, lng: 90.9 });
    expect(q.distanceKm).toBe(9);
    expect(q.calculatedFee).toBe(90);
    expect(q.estimated).toBe(false);
  });

  it('passes on that the distance was estimated', async () => {
    const q = await make({}, { km: 8, seconds: 1000, estimated: true }).service.quote(500, { lat: 23.25, lng: 90.9 });
    expect(q.estimated).toBe(true);
  });

  it('makes delivery free above the threshold, and says how much is missing below it', async () => {
    const { service } = make({ freeDeliveryThreshold: 1000 }, { km: 9, seconds: 1000, estimated: false });
    const paid = await service.quote(700, { lat: 23.25, lng: 90.9 });
    expect(paid.isFree).toBe(false);
    expect(paid.cost).toBe(90);
    expect(paid.amountForFreeDelivery).toBe(300);
    const free = await service.quote(1000, { lat: 23.25, lng: 90.9 });
    expect(free).toMatchObject({ isFree: true, cost: 0, calculatedFee: 90 });
  });

  it('is free when every product ships free', async () => {
    const q = await make().service.quote(100, { lat: 23.25, lng: 90.9, allItemsFreeShipping: true });
    expect(q.cost).toBe(0);
    expect(q.isFree).toBe(true);
  });

  it('uses the service centre for the radius when one is set', async () => {
    // the origin is at 23.2 but the centre is 33 km north: a point near the origin is out of that circle
    const q = await make({ centerLat: 23.5, centerLng: 90.9 }).service.quote(500, { lat: 23.21, lng: 90.9 });
    expect(q.block).toBe('OUT_OF_AREA');
  });
});
