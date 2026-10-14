import {
  ALL_PERMISSIONS,
  ROLE_PRESETS,
  can,
  permissionsOf,
} from './permissions';

describe('permissions', () => {
  const staff = (permissions: string[]) => ({
    role: 'STAFF' as const,
    permissions,
  });

  it('admins and super admins may do everything', () => {
    expect(can({ role: 'ADMIN', permissions: [] }, 'staff.manage')).toBe(true);
    expect(can({ role: 'SUPER_ADMIN' }, 'settings.manage')).toBe(true);
    expect(permissionsOf({ role: 'ADMIN' })).toEqual(ALL_PERMISSIONS);
  });

  it('staff may do only what they hold; any one of several is enough', () => {
    expect(can(staff(['orders.view']), 'orders.view')).toBe(true);
    expect(can(staff(['orders.view']), 'orders.manage')).toBe(false);
    expect(
      can(staff(['orders.assign']), 'delivery.manage', 'orders.assign'),
    ).toBe(true);
  });

  it('an empty list means "any signed-in staff" for staff, never for customers', () => {
    expect(can(staff([]))).toBe(true);
    expect(can({ role: 'USER', permissions: [] })).toBe(false);
    expect(
      can({ role: 'USER', permissions: ['orders.view'] }, 'orders.view'),
    ).toBe(false);
  });

  it('ignores permission names that do not exist', () => {
    expect(permissionsOf(staff(['orders.view', 'made.up']))).toEqual([
      'orders.view',
    ]);
  });

  it('every preset only uses real permissions', () => {
    for (const p of Object.values(ROLE_PRESETS))
      expect(p.permissions.every((x) => ALL_PERMISSIONS.includes(x))).toBe(
        true,
      );
  });

  it('the rider preset can deliver but may not see orders in the dashboard', () => {
    expect(ROLE_PRESETS.rider).toMatchObject({
      role: 'STAFF',
      canDeliver: true,
      permissions: [],
    });
  });
});
