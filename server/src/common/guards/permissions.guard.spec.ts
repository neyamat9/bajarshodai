import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

const ctx = (user: unknown, method = 'GET') =>
  ({
    getHandler: () => 'h',
    getClass: () => 'c',
    switchToHttp: () => ({ getRequest: () => ({ user, method }) }),
  }) as unknown as ExecutionContext;

const guardWith = (rule: unknown) => {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) =>
      key === PERMISSIONS_KEY ? rule : undefined,
    ),
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
};

describe('PermissionsGuard', () => {
  const rule = { read: ['orders.view'], write: ['orders.manage'] };

  it('lets everything through when the route has no rule', () => {
    expect(guardWith(undefined).canActivate(ctx({ role: 'USER' }))).toBe(true);
  });

  it('reading needs the read permission, changing needs the write one', () => {
    const viewer = { role: 'STAFF', permissions: ['orders.view'] };
    expect(guardWith(rule).canActivate(ctx(viewer, 'GET'))).toBe(true);
    expect(() => guardWith(rule).canActivate(ctx(viewer, 'PATCH'))).toThrow(
      ForbiddenException,
    );
  });

  it('admins always pass; customers never do', () => {
    expect(
      guardWith(rule).canActivate(
        ctx({ role: 'ADMIN', permissions: [] }, 'DELETE'),
      ),
    ).toBe(true);
    expect(() =>
      guardWith(rule).canActivate(ctx({ role: 'USER', permissions: [] })),
    ).toThrow(ForbiddenException);
  });

  it('"staff" lets any signed-in staff member in', () => {
    const open = { read: 'staff', write: 'staff' };
    expect(
      guardWith(open).canActivate(
        ctx({ role: 'STAFF', permissions: [] }, 'POST'),
      ),
    ).toBe(true);
  });

  it('no user, no entry', () => {
    expect(guardWith(rule).canActivate(ctx(undefined))).toBe(false);
  });
});
