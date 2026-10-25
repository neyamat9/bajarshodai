import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { MailService } from '../../common/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { parseLoginIdentifier } from '../../common/utils/phone';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const maskedUser = user.length <= 2 ? user[0] + '***' : user[0] + '***' + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

// everyone who may sign in to the dashboard (what each can do is decided by permissions)
const ADMIN_ROLES: Role[] = [Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN];
const PASSWORD_HISTORY = 5;

// After this many wrong passwords for one account, logins for it are paused.
const MAX_FAILURES = 8;
const LOCK_MS = 15 * 60 * 1000;

@Injectable()
export class AdminAccountService {
  private readonly logger = new Logger(AdminAccountService.name);

  // email → failures; kept in memory (resets on restart, per server)
  private readonly failures = new Map<
    string,
    { count: number; until?: number }
  >();

  // A real argon2 hash of a random string: verifying against it takes as long
  // as a genuine check, so unknown emails cannot be told apart by timing.
  private readonly dummyHash = argon2.hash(randomBytes(16).toString('hex'));

  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private mail: MailService,
    private jwt: JwtService,
  ) {}

  isAdmin(user: Pick<User, 'role'>) {
    return ADMIN_ROLES.includes(user.role);
  }

  async login(
    identifier: string,
    password: string,
    clientMeta?: { ip?: string; userAgent?: string },
  ) {
    const who = parseLoginIdentifier(identifier);
    const key = who.type === 'email' ? who.email : who.phone;
    this.assertNotLocked(key);

    const user =
      who.type === 'email'
        ? await this.prisma.user.findFirst({
            where: { email: { equals: who.email, mode: 'insensitive' } },
          })
        : await this.prisma.user.findUnique({ where: { phone: who.phone } });

    // Always verify a password so the response time does not reveal whether
    // the email is an admin account.
    const ok = user
      ? await argon2.verify(user.passwordHash, password).catch(() => false)
      : await this.dummyHash
          .then((h) => argon2.verify(h, password))
          .catch(() => false);

    if (!user || !ok || !this.isAdmin(user)) {
      this.recordFailure(key);
      throw new UnauthorizedException('Invalid Credentials');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('This account has been suspended.');
    }

    this.failures.delete(key);

    // If admin has an email configured, trigger 2FA email OTP
    if (user.email) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await argon2.hash(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate existing OTPs
      await this.prisma.adminTwoFactorOtp.deleteMany({
        where: { userId: user.id },
      });

      await this.prisma.adminTwoFactorOtp.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt,
        },
      });

      // Send OTP email
      const mailRes = await this.mail.send({
        to: user.email,
        subject: 'Bazar Shodai Admin Security Code',
        text: `Your security verification code is: ${otp}. It will expire in 10 minutes. If you did not request this, please secure your account immediately.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">Admin Security Verification</h2>
            <p style="color: #475569; font-size: 15px;">A login attempt was made for your Bazar Shodai admin account.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not attempt this login, please change your password immediately.</p>
          </div>
        `,
      });

      // If email delivery is not configured in .env or Settings (provider === 'none'),
      // fallback to direct login so the admin is never locked out of their store.
      if (!mailRes.ok && mailRes.provider === 'none') {
        this.logger.warn(
          `2FA skipped for admin ${user.email}: email provider is unconfigured in .env or Settings. Allowing direct login.`,
        );
        await this.prisma.adminTwoFactorOtp.deleteMany({
          where: { userId: user.id },
        });
        const session = await this.auth.login(user, clientMeta);
        return {
          requires2FA: false,
          userId: session.userId,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: this.auth.toPublicUser(user),
        };
      }

      // Sign short-lived temp token
      const tempToken = await this.jwt.signAsync(
        { sub: user.id, is2faPending: true },
        { expiresIn: '10m' },
      );

      return {
        requires2FA: true,
        tempToken,
        maskedEmail: maskEmail(user.email),
      };
    }

    // Direct login fallback if no email is set
    const session = await this.auth.login(user, clientMeta);
    return {
      requires2FA: false,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: this.auth.toPublicUser(user),
    };
  }

  async verify2FA(
    tempToken: string,
    otp: string,
    clientMeta?: { ip?: string; userAgent?: string },
  ) {
    let payload: { sub: string; is2faPending?: boolean };
    try {
      payload = await this.jwt.verifyAsync(tempToken);
    } catch {
      throw new UnauthorizedException(
        'Security session expired or invalid. Please log in again.',
      );
    }

    if (!payload.sub || !payload.is2faPending) {
      throw new UnauthorizedException('Invalid security token.');
    }

    const otpRecord = await this.prisma.adminTwoFactorOtp.findFirst({
      where: {
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException(
        'Security code has expired. Please log in again to receive a new code.',
      );
    }

    const isMatch = await argon2
      .verify(otpRecord.otpHash, otp.trim())
      .catch(() => false);
    if (!isMatch) {
      throw new UnauthorizedException(
        'Invalid security code. Please check and try again.',
      );
    }

    // Clean up OTP record
    await this.prisma.adminTwoFactorOtp.deleteMany({
      where: { userId: payload.sub },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !this.isAdmin(user) || user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not allowed to access admin portal.');
    }

    const session = await this.auth.login(user, clientMeta);
    return {
      requires2FA: false,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: this.auth.toPublicUser(user),
    };
  }

  async refresh(
    userId: string,
    refreshToken: string,
    clientMeta?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !this.isAdmin(user))
      throw new ForbiddenException('Access Denied');
    return this.auth.refreshTokens(userId, refreshToken, clientMeta);
  }

  me(user: User) {
    return this.auth.toPublicUser(user);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    if (data.phone) {
      const taken = await this.prisma.user.findFirst({
        where: { phone: data.phone, id: { not: userId } },
        select: { id: true },
      });
      if (taken)
        throw new ConflictException('This phone number is already in use');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
    });
    return this.auth.toPublicUser(updated);
  }

  async changePassword(user: User, current: string, next: string) {
    if (!(await argon2.verify(user.passwordHash, current).catch(() => false))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.assertNotReused(user, next);
    await this.setPassword(user, next);

    // The old refresh token is dead; hand back a fresh session so the
    // dashboard stays signed in.
    const fresh = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const session = await this.auth.login(fresh);
    return {
      success: true,
      message: 'Password changed. Other sessions have been signed out.',
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.auth.logout(userId);
    return { success: true };
  }

  // Used by the reset-password flow after the token was checked.
  async assertPasswordAllowed(userId: string, next: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.assertNotReused(user, next);
  }

  private async setPassword(user: User, next: string) {
    const passwordHash = await argon2.hash(next);
    await this.prisma.$transaction([
      this.prisma.passwordHistory.create({
        data: { userId: user.id, passwordHash: user.passwordHash },
      }),
      // Clearing the refresh token signs the account out everywhere.
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, refreshTokenHash: null },
      }),
    ]);
  }

  private async assertNotReused(user: User, next: string) {
    const recent = await this.prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_HISTORY - 1,
    });
    for (const hash of [
      user.passwordHash,
      ...recent.map((r) => r.passwordHash),
    ]) {
      if (await argon2.verify(hash, next).catch(() => false)) {
        throw new BadRequestException(
          `Choose a password you have not used in your last ${PASSWORD_HISTORY} passwords`,
        );
      }
    }
  }

  private assertNotLocked(key: string) {
    const f = this.failures.get(key);
    if (f?.until && f.until > Date.now()) {
      throw new HttpException(
        'Too many failed attempts. Try again in a few minutes, or reset your password.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailure(key: string) {
    const f = this.failures.get(key) ?? { count: 0 };
    if (f.until && f.until <= Date.now()) {
      f.count = 0;
      f.until = undefined;
    }
    f.count++;
    if (f.count >= MAX_FAILURES) f.until = Date.now() + LOCK_MS;
    this.failures.set(key, f);
    if (this.failures.size > 5000) {
      for (const [k, v] of this.failures)
        if (!v.until || v.until < Date.now()) this.failures.delete(k);
    }
  }
}
