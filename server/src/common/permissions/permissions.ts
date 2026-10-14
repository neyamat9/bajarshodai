import type { Role } from '@prisma/client';

// What a staff member can be allowed to do. ADMIN and SUPER_ADMIN may do all of it.
// Being sent to deliver is not here: it is the separate canDeliver switch on the user, for any role.
export const PERMISSIONS = [
  { key: 'orders.view', group: 'Orders', label: 'See orders' },
  {
    key: 'orders.manage',
    group: 'Orders',
    label: 'Change orders (status, items, payments, phone orders)',
  },
  { key: 'orders.assign', group: 'Orders', label: 'Give orders to riders' },
  {
    key: 'delivery.manage',
    group: 'Deliveries',
    label: 'Run the delivery board, cash handover and delivery statistics',
  },
  {
    key: 'products.view',
    group: 'Catalog',
    label: 'See products and categories',
  },
  {
    key: 'products.manage',
    group: 'Catalog',
    label: 'Add and change products, categories, units, brands, pictures',
  },
  {
    key: 'inventory.manage',
    group: 'Catalog',
    label: 'Change stock and the daily price sheet',
  },
  { key: 'customers.view', group: 'Customers', label: 'See customers' },
  {
    key: 'customers.manage',
    group: 'Customers',
    label: 'Change customers (suspend, reset password, notes)',
  },
  {
    key: 'reports.view',
    group: 'Reports',
    label: 'See the dashboard numbers and reports',
  },
  { key: 'logs.view', group: 'Reports', label: 'See the activity log' },
  { key: 'settings.manage', group: 'Settings', label: 'Change shop settings' },
  { key: 'staff.manage', group: 'Settings', label: 'Add and change staff' },
] as const;

export type Permission = (typeof PERMISSIONS)[number]['key'];
export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((p) => p.key);

/** A starting point when adding staff: the admin can still tick or untick each one. */
export const ROLE_PRESETS: Record<
  string,
  { label: string; role: Role; permissions: Permission[]; canDeliver: boolean }
> = {
  admin: {
    label: 'Admin (everything)',
    role: 'ADMIN',
    permissions: [],
    canDeliver: false,
  },
  manager: {
    label: 'Manager',
    role: 'STAFF',
    permissions: [
      'orders.view',
      'orders.manage',
      'orders.assign',
      'delivery.manage',
      'products.view',
      'products.manage',
      'inventory.manage',
      'customers.view',
      'customers.manage',
      'reports.view',
      'logs.view',
    ],
    canDeliver: false,
  },
  packer: {
    label: 'Packer',
    role: 'STAFF',
    permissions: [
      'orders.view',
      'orders.manage',
      'products.view',
      'inventory.manage',
    ],
    canDeliver: false,
  },
  rider: { label: 'Rider', role: 'STAFF', permissions: [], canDeliver: true },
  'order-taker': {
    label: 'Order taker',
    role: 'STAFF',
    permissions: [
      'orders.view',
      'orders.manage',
      'orders.assign',
      'customers.view',
      'products.view',
    ],
    canDeliver: false,
  },
};

export const FULL_ACCESS_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];
/** Roles that may sign in to the dashboard. */
export const DASHBOARD_ROLES: Role[] = ['STAFF', 'ADMIN', 'SUPER_ADMIN'];

export function permissionsOf(user: {
  role: Role;
  permissions?: string[] | null;
}): Permission[] {
  if (FULL_ACCESS_ROLES.includes(user.role)) return ALL_PERMISSIONS;
  if (user.role !== 'STAFF') return [];
  return (user.permissions ?? []).filter((p): p is Permission =>
    (ALL_PERMISSIONS as string[]).includes(p),
  );
}

/** True when the user holds at least one of the permissions (an empty list means "any signed-in staff"). */
export function can(
  user: { role: Role; permissions?: string[] | null },
  ...anyOf: Permission[]
): boolean {
  if (FULL_ACCESS_ROLES.includes(user.role)) return true;
  if (user.role !== 'STAFF') return false;
  if (anyOf.length === 0) return true;
  const mine = permissionsOf(user);
  return anyOf.some((p) => mine.includes(p));
}
