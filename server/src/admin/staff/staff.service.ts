import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../../common/activity';
import { writeAudit } from '../../common/audit';
import {
  ALL_PERMISSIONS,
  DASHBOARD_ROLES,
  FULL_ACCESS_ROLES,
  PERMISSIONS,
  ROLE_PRESETS,
  permissionsOf,
} from '../../common/permissions';
import { normalizeBdPhone } from '../../common/utils/phone';
import { CreateStaffDto, ListStaffDto, UpdateStaffDto } from './dto/staff.dto';

const select = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  status: true,
  permissions: true,
  canDeliver: true,
  staffTitle: true,
  avatarUrl: true,
  lastLoginAt: true,
  loginCount: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type Row = Prisma.UserGetPayload<{ select: typeof select }>;

/** What the dashboard gets: the permissions a person effectively has (all of them for an admin). */
const view = (r: Row) => ({ ...r, permissions: permissionsOf(r) });

// easy to read out loud: no 0/O, 1/l/I
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const tempPassword = () =>
  Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
    '',
  );

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityLogService,
  ) {}

  meta() {
    return {
      permissions: PERMISSIONS,
      presets: Object.entries(ROLE_PRESETS).map(([key, p]) => ({ key, ...p })),
    };
  }

  private log(
    actor: User,
    action: string,
    summary: string,
    target: { id: string; name: string },
    extra?: Record<string, unknown>,
  ) {
    this.activity.record({
      actorType: 'ADMIN',
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action,
      category: 'staff',
      summary,
      entityType: 'staff member',
      entityId: target.id,
      entityLabel: target.name,
      metadata: extra as never,
    });
  }

  async list(q: ListStaffDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const where: Prisma.UserWhereInput = {
      role: q.role ? (q.role as Role) : { in: DASHBOARD_ROLES },
      ...(q.status ? { status: q.status as 'ACTIVE' | 'SUSPENDED' } : {}),
      ...(q.canDeliver !== undefined ? { canDeliver: q.canDeliver } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { phone: { contains: q.search } },
              { email: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    const counts = await this.deliveryCounts(rows.map((r) => r.id));
    return {
      data: rows.map((r) => ({
        ...view(r),
        deliveries: counts.get(r.id) ?? { delivered: 0, active: 0 },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async deliveryCounts(ids: string[]) {
    const out = new Map<string, { delivered: number; active: number }>();
    if (!ids.length) return out;
    const groups = await this.prisma.delivery.groupBy({
      by: ['assigneeId', 'status'],
      where: { assigneeId: { in: ids } },
      _count: true,
    });
    for (const g of groups) {
      const c = out.get(g.assigneeId) ?? { delivered: 0, active: 0 };
      if (g.status === 'DELIVERED') c.delivered += g._count;
      else if (g.status !== 'FAILED' && g.status !== 'CANCELLED')
        c.active += g._count;
      out.set(g.assigneeId, c);
    }
    return out;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: { in: DASHBOARD_ROLES } },
      select,
    });
    if (!user) throw new NotFoundException('Staff member not found');
    const [counts, cash, recent] = await Promise.all([
      this.deliveryCounts([id]),
      this.prisma.delivery.aggregate({
        where: {
          assigneeId: id,
          status: 'DELIVERED',
          cashHandedOverAt: null,
          cashCollected: { gt: 0 },
        },
        _sum: { cashCollected: true },
        _count: true,
      }),
      this.prisma.activityLog.findMany({
        where: { actorId: id },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          createdAt: true,
          action: true,
          category: true,
          summary: true,
          success: true,
          entityType: true,
          entityLabel: true,
        },
      }),
    ]);
    return {
      ...view(user),
      deliveries: counts.get(id) ?? { delivered: 0, active: 0 },
      cashInHand: Number(cash._sum.cashCollected ?? 0),
      cashInHandCount: cash._count,
      activity: recent,
    };
  }

  /** Only a super admin makes or changes admins and super admins. */
  private assertMayTouch(
    actor: User,
    target: { role: Role },
    makingRole?: Role,
  ) {
    const touchesAdmin =
      FULL_ACCESS_ROLES.includes(target.role) ||
      (makingRole !== undefined && FULL_ACCESS_ROLES.includes(makingRole));
    if (touchesAdmin && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only a super admin can add or change an admin',
      );
    }
  }

  async create(dto: CreateStaffDto, actor: User) {
    const role = (dto.role ?? 'STAFF') as Role;
    this.assertMayTouch(actor, { role }, role);
    const phone = normalizeBdPhone(dto.phone);
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(dto.email
            ? [{ email: { equals: dto.email, mode: 'insensitive' as const } }]
            : []),
        ],
      },
    });
    const convert =
      !!existing &&
      dto.useExistingCustomer &&
      existing.phone === phone &&
      existing.role === 'USER';
    if (existing && !convert) {
      throw new ConflictException(
        existing.role === 'USER' && existing.phone === phone
          ? 'This number belongs to a customer. Tick "Use the existing customer account" to make them staff.'
          : 'This phone number or email is already used by another account',
      );
    }
    const password = dto.password ?? tempPassword();
    const passwordHash = await argon2.hash(password);
    const permissions =
      role === 'ADMIN' ? [] : [...new Set(dto.permissions ?? [])];

    const user = await this.prisma.$transaction(async (tx) => {
      const data = {
        role,
        permissions,
        canDeliver: dto.canDeliver ?? false,
        staffTitle: dto.staffTitle ?? null,
        passwordHash,
        refreshTokenHash: null,
        status: 'ACTIVE' as const,
        ...(dto.email !== undefined ? { email: dto.email } : {}),
      };
      const saved = convert
        ? await tx.user.update({
            where: { id: existing.id },
            data: { ...data, ...(dto.name ? { name: dto.name } : {}) },
            select,
          })
        : await tx.user.create({
            data: {
              ...data,
              name: dto.name,
              phone,
              phoneVerified: true,
              language: 'bn',
            },
            select,
          });
      await writeAudit(tx, {
        adminId: actor.id,
        action: 'STAFF_CREATED',
        entity: 'User',
        entityId: saved.id,
        newValue: {
          name: saved.name,
          phone: saved.phone,
          role,
          permissions,
          canDeliver: saved.canDeliver,
        },
      });
      return saved;
    });
    this.log(
      actor,
      'staff.created',
      `${actor.name} added ${user.name} as ${role === 'ADMIN' ? 'an admin' : (user.staffTitle ?? 'staff')}`,
      user,
      {
        role,
        permissions,
        canDeliver: user.canDeliver,
      },
    );
    // a generated password is shown once and is never stored or logged
    return {
      ...view(user),
      ...(dto.password ? {} : { temporaryPassword: password }),
    };
  }

  async update(id: string, dto: UpdateStaffDto, actor: User) {
    const target = await this.prisma.user.findFirst({
      where: { id, role: { in: DASHBOARD_ROLES } },
    });
    if (!target) throw new NotFoundException('Staff member not found');
    const self = id === actor.id;
    this.assertMayTouch(actor, target, dto.role as Role | undefined);

    if (
      self &&
      (dto.role !== undefined ||
        dto.permissions !== undefined ||
        dto.status !== undefined)
    ) {
      throw new BadRequestException(
        'You cannot change your own role, permissions or status',
      );
    }
    if (
      target.role === 'SUPER_ADMIN' &&
      (dto.role !== undefined ||
        dto.permissions !== undefined ||
        dto.status !== undefined)
    ) {
      throw new ForbiddenException(
        'A super admin account cannot be changed here',
      );
    }
    if (dto.email) {
      const taken = await this.prisma.user.findFirst({
        where: {
          email: { equals: dto.email, mode: 'insensitive' },
          id: { not: id },
        },
        select: { id: true },
      });
      if (taken)
        throw new ConflictException(
          'This email is already used by another account',
        );
    }

    let phoneToUpdate: string | undefined = undefined;
    if (dto.phone) {
      const normalizedPhone = normalizeBdPhone(dto.phone);
      if (normalizedPhone !== target.phone) {
        const taken = await this.prisma.user.findFirst({
          where: {
            phone: normalizedPhone,
            id: { not: id },
          },
          select: { id: true },
        });
        if (taken) {
          throw new ConflictException(
            'This phone number is already used by another account',
          );
        }
        phoneToUpdate = normalizedPhone;
      }
    }

    const role = dto.role ?? target.role;
    const permissions =
      role === 'ADMIN' || role === 'SUPER_ADMIN'
        ? []
        : [...new Set(dto.permissions ?? target.permissions)].filter((p) =>
            (ALL_PERMISSIONS as string[]).includes(p),
          );
    const data: Prisma.UserUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(phoneToUpdate !== undefined ? { phone: phoneToUpdate } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.staffTitle !== undefined ? { staffTitle: dto.staffTitle } : {}),
      ...(dto.canDeliver !== undefined ? { canDeliver: dto.canDeliver } : {}),
      ...(dto.role !== undefined ? { role } : {}),
      ...(dto.permissions !== undefined || dto.role !== undefined
        ? { permissions }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      // a suspended person or someone whose phone changed is signed out now
      ...(dto.status === 'SUSPENDED' || phoneToUpdate !== undefined
        ? { refreshTokenHash: null }
        : {}),
    };
    if (Object.keys(data).length === 0)
      throw new BadRequestException('Nothing to update');

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.user.update({ where: { id }, data, select });
      await writeAudit(tx, {
        adminId: actor.id,
        action: 'STAFF_UPDATED',
        entity: 'User',
        entityId: id,
        oldValue: {
          phone: target.phone,
          role: target.role,
          permissions: target.permissions,
          canDeliver: target.canDeliver,
          status: target.status,
        },
        newValue: {
          phone: saved.phone,
          role: saved.role,
          permissions: saved.permissions,
          canDeliver: saved.canDeliver,
          status: saved.status,
        },
      });
      return saved;
    });

    const phoneChanged = phoneToUpdate !== undefined;
    const statusChanged =
      dto.status !== undefined && dto.status !== target.status;
    const accessChanged =
      dto.permissions !== undefined ||
      (dto.role !== undefined && dto.role !== target.role) ||
      (dto.canDeliver !== undefined && dto.canDeliver !== target.canDeliver);
    if (phoneChanged) {
      this.log(
        actor,
        'staff.phone_changed',
        `${actor.name} changed phone number for ${updated.name} to ${phoneToUpdate}`,
        updated,
        { before: target.phone, after: phoneToUpdate },
      );
    }
    if (statusChanged) {
      this.log(
        actor,
        dto.status === 'SUSPENDED' ? 'staff.deactivated' : 'staff.activated',
        `${actor.name} ${dto.status === 'SUSPENDED' ? 'deactivated' : 'reactivated'} ${updated.name}`,
        updated,
      );
    }
    if (accessChanged) {
      this.log(
        actor,
        'staff.access_changed',
        `${actor.name} changed what ${updated.name} may do`,
        updated,
        {
          role: updated.role,
          permissions: updated.permissions,
          canDeliver: updated.canDeliver,
          before: {
            role: target.role,
            permissions: target.permissions,
            canDeliver: target.canDeliver,
          },
        },
      );
    }
    if (!statusChanged && !accessChanged && !phoneChanged)
      this.log(
        actor,
        'staff.updated',
        `${actor.name} updated ${updated.name}`,
        updated,
      );
    return view(updated);
  }

  async resetPassword(id: string, actor: User) {
    const target = await this.prisma.user.findFirst({
      where: { id, role: { in: DASHBOARD_ROLES } },
    });
    if (!target) throw new NotFoundException('Staff member not found');
    if (id === actor.id)
      throw new BadRequestException(
        'Use "Change password" in your profile for your own account',
      );
    this.assertMayTouch(actor, target);
    const password = tempPassword();
    const passwordHash = await argon2.hash(password);
    await this.prisma.$transaction(async (tx) => {
      if (target.passwordHash) {
        await tx.passwordHistory.create({
          data: { userId: id, passwordHash: target.passwordHash },
        });
      }
      // signed out everywhere: the old sessions stop working
      await tx.user.update({
        where: { id },
        data: { passwordHash, refreshTokenHash: null },
      });
      await writeAudit(tx, {
        adminId: actor.id,
        action: 'USER_PASSWORD_RESET',
        entity: 'User',
        entityId: id,
        oldValue: { phone: target.phone },
        newValue: { passwordReset: true },
      });
    });
    this.log(
      actor,
      'staff.password_reset',
      `${actor.name} set a temporary password for ${target.name}`,
      target,
    );
    return { temporaryPassword: password };
  }
}
