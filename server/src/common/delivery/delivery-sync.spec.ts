import { syncDeliveryWithOrder } from './delivery-sync';

const makeDb = (delivery: { id: string; status: string } | null) => {
  const db = {
    delivery: {
      findUnique: jest.fn().mockResolvedValue(delivery),
      update: jest.fn().mockResolvedValue({}),
    },
    deliveryEvent: { create: jest.fn().mockResolvedValue({}) },
  };
  return db;
};

describe('syncDeliveryWithOrder', () => {
  it('an order marked delivered finishes its open delivery', async () => {
    const db = makeDb({ id: 'd1', status: 'ON_THE_WAY' });
    await syncDeliveryWithOrder(db as never, 'o1', 'DELIVERED', null);
    expect(db.delivery.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({ status: 'DELIVERED' }),
    });
    expect(db.deliveryEvent.create).toHaveBeenCalledTimes(1);
  });

  it('a cancelled order cancels its open delivery', async () => {
    const db = makeDb({ id: 'd1', status: 'ASSIGNED' });
    await syncDeliveryWithOrder(db as never, 'o1', 'CANCELLED', {
      id: 'a',
      name: 'Admin',
    });
    expect(db.delivery.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('leaves finished deliveries and other order statuses alone', async () => {
    const done = makeDb({ id: 'd1', status: 'DELIVERED' });
    await syncDeliveryWithOrder(done as never, 'o1', 'CANCELLED', null);
    expect(done.delivery.update).not.toHaveBeenCalled();

    const other = makeDb({ id: 'd1', status: 'ASSIGNED' });
    await syncDeliveryWithOrder(other as never, 'o1', 'PROCESSING', null);
    expect(other.delivery.findUnique).not.toHaveBeenCalled();
  });

  it('does nothing when the order has no delivery', async () => {
    const db = makeDb(null);
    await syncDeliveryWithOrder(db as never, 'o1', 'DELIVERED', null);
    expect(db.delivery.update).not.toHaveBeenCalled();
  });
});
