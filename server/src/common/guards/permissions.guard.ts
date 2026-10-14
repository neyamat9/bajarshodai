import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@prisma/client';
import {
  PERMISSIONS_KEY,
  type PermissionRule,
} from '../decorators/permissions.decorator';
import { can } from '../permissions';

const READ = new Set(['GET', 'HEAD', 'OPTIONS']);

// Use after JwtAuthGuard. Reads the rule from @RequirePermissions and checks it against the signed-in user.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rule = this.reflector.getAllAndOverride<PermissionRule | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!rule) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ user?: User; method: string }>();
    if (!req.user) return false;

    const needed = READ.has(req.method.toUpperCase()) ? rule.read : rule.write;
    const ok = needed === 'staff' ? can(req.user) : can(req.user, ...needed);
    if (!ok)
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource',
      );
    return true;
  }
}
