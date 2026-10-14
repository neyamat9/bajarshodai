import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

export const PERMISSIONS_KEY = 'permissions';

type OneOrMore = Permission | Permission[] | 'staff';

export interface PermissionRule {
  /** needed for GET / HEAD (any one of them). 'staff' = any signed-in staff member. */
  read: Permission[] | 'staff';
  /** needed for everything else */
  write: Permission[] | 'staff';
}

const list = (p: OneOrMore): Permission[] | 'staff' =>
  p === 'staff' ? 'staff' : Array.isArray(p) ? p : [p];

/**
 * Who may call this: ADMIN and SUPER_ADMIN always, STAFF when they hold the permission.
 * One argument is used for every method; with two, the first is for reading (GET) and the second for changing.
 * Put it on a controller, and on a method to override the controller's rule.
 */
export const RequirePermissions = (read: OneOrMore, write: OneOrMore = read) =>
  SetMetadata(PERMISSIONS_KEY, {
    read: list(read),
    write: list(write),
  } satisfies PermissionRule);
