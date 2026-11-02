import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminOrdersService } from './orders.service';

describe('AdminOrdersService - Deletion', () => {
  let service: AdminOrdersService;
  let prismaMock: any;
  let notifierMock: any;
  let notificationsMock: any;
  let adminFeedMock: any;
  let auditMock: any;

  beforeEach(() => {
    prismaMock = {
      order: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
      loyaltyTransaction: { updateMany: jest.fn() },
      locationRequest: { updateMany: jest.fn() },
      supportTicket: { updateMany: jest.fn() },
      review: { updateMany: jest.fn() },
      refundTransaction: { deleteMany: jest.fn() },
      payment: { deleteMany: jest.fn() },
      returnItem: { deleteMany: jest.fn() },
      returnRequest: { deleteMany: jest.fn() },
      deliveryEvent: { deleteMany: jest.fn() },
      delivery: { deleteMany: jest.fn() },
      couponUsage: { deleteMany: jest.fn() },
      orderStatusHistory: { deleteMany: jest.fn() },
      orderItem: { deleteMany: jest.fn() },
    };

    notifierMock = { paymentUpdated: jest.fn() };
    notificationsMock = {};
    adminFeedMock = { resolve: jest.fn() };
    auditMock = { recordSafe: jest.fn() };

    service = new AdminOrdersService(
      prismaMock,
      notifierMock,
      notificationsMock,
      adminFeedMock,
      auditMock,
    );
  });

  it('throws NotFoundException if order does not exist', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);
    await expect(service.remove('unknown-id', 'admin-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('blocks deletion of DELIVERED, SHIPPED, IN_TRANSIT, or OUT_FOR_DELIVERY orders', async () => {
    for (const status of ['DELIVERED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']) {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'BS-20261015-0001',
        status,
        items: [],
      });

      await expect(service.remove('ord-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    }
  });

  it('successfully deletes a CANCELLED order without re-triggering stock restoration', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'ord-2',
      orderNumber: 'BS-20261015-0002',
      status: 'CANCELLED',
      total: 500,
      paymentStatus: 'FAILED',
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [],
    });

    const res = await service.remove('ord-2', 'admin-1');

    expect(res.deleted).toBe(true);
    expect(res.orderNumber).toBe('BS-20261015-0002');
    expect(prismaMock.order.delete).toHaveBeenCalledWith({ where: { id: 'ord-2' } });
    expect(adminFeedMock.resolve).toHaveBeenCalledWith('NEW_ORDER', 'ord-2');
    expect(auditMock.recordSafe).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ORDER_DELETED',
        entityId: 'ord-2',
      }),
    );
  });

  it('bulkDelete returns summary of deleted vs blocked orders', async () => {
    prismaMock.order.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === 'ord-deliv') {
        return Promise.resolve({
          id: 'ord-deliv',
          orderNumber: 'BS-20261015-0001',
          status: 'DELIVERED',
          items: [],
        });
      }
      return Promise.resolve({
        id: 'ord-canc',
        orderNumber: 'BS-20261015-0002',
        status: 'CANCELLED',
        total: 200,
        paymentStatus: 'FAILED',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [],
      });
    });

    const res = await service.bulkDelete(['ord-deliv', 'ord-canc'], 'admin-1');

    expect(res.total).toBe(2);
    expect(res.deleted).toBe(1);
    expect(res.blocked).toBe(1);
    expect(res.results[0].deleted).toBe(false);
    expect(res.results[1].deleted).toBe(true);
  });
});

