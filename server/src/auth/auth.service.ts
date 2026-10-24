import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { permissionsOf } from '../common/permissions';
import { CreateUserInput } from './dto/create-user.input';
import * as argon2 from 'argon2';
import { Prisma, User } from '@prisma/client';
import { SignInInput } from './dto/sign-in.input';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from './types/auth-payload.type';
import { ConfigService } from '@nestjs/config';
import { normalizeBdPhone, parseLoginIdentifier } from '../common/utils/phone';

// Precomputed valid argon2 hash to ensure constant-time response for unknown users (Point 8)
const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$dHVtbXlfc2FsdF9iYXphcl9zaG9kYWk$0gV5m1RzVp2D9M9G8K3X7Q6A1Z4E2W5Y8U9I0O';

// Maximum concurrent login sessions/devices per user
const MAX_SESSIONS_PER_USER = 5;
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user with safe error handling and clean 409 Conflict.
   */
  async registerUser(createUserInput: CreateUserInput): Promise<User> {
    const { password, name } = createUserInput;
    // The phone number is the account identity: one account per number.
    const phone = normalizeBdPhone(createUserInput.phone);
    // Emails are optional and stored lower-case, so "A@x.com" and "a@x.com" are one account.
    const email = createUserInput.email?.trim().toLowerCase() || null;
    const language = createUserInput.language === 'en' ? 'en' : 'bn';

    const existingUserByPhone = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingUserByPhone) {
      throw new ConflictException(
        'This phone number already has an account. Please log in.',
      );
    }

    if (email) {
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      if (existingUserByEmail) {
        throw new ConflictException('Email is already registered');
      }
    }

    try {
      const passwordHash = await argon2.hash(password);

      const newUser = await this.prisma.user.create({
        data: {
          phone,
          email,
          name,
          passwordHash,
          language,
        },
      });

      return newUser;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[] | undefined) || [];
        if (target.includes('phone')) {
          throw new ConflictException(
            'This phone number already has an account. Please log in.',
          );
        }
        if (target.includes('email')) {
          throw new ConflictException('Email is already registered');
        }
        throw new ConflictException(
          'An account with these details already exists.',
        );
      }
      this.logger.error(
        `Registration failed: ${error instanceof Error ? error.stack : String(error)}`,
      );
      throw new InternalServerErrorException(
        'Registration failed due to a server error. Please try again.',
      );
    }
  }

  // Log in with the phone number (normal) or the email (if the account has one).
  async validateLocalUser({ identifier, password }: SignInInput) {
    const who = parseLoginIdentifier(identifier);
    const user =
      who.type === 'email'
        ? await this.prisma.user.findFirst({
            where: { email: { equals: who.email, mode: 'insensitive' } },
          })
        : await this.prisma.user.findUnique({ where: { phone: who.phone } });

    // Check account lockout
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new HttpException(
        `Account temporarily locked due to repeated failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        HttpStatus.LOCKED,
      );
    }

    // Always run argon2 verification so response latency never exposes if user exists
    const passwordMatched = user
      ? await argon2.verify(user.passwordHash, password).catch(() => false)
      : await argon2.verify(DUMMY_ARGON2_HASH, password).catch(() => false);

    if (!user || !passwordMatched) {
      if (user) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const isLocked = attempts >= MAX_LOGIN_FAILURES;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: isLocked
              ? new Date(Date.now() + LOCKOUT_DURATION_MS)
              : null,
          },
        });
      }
      throw new UnauthorizedException('Invalid Credentials');
    }

    // Password matched: reset failed login attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Checked after the password so the message is only shown to the owner.
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'This account has been suspended. Please contact support.',
      );
    }

    return user;
  }

  async getTokens(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '1h', // Access token expires quickly
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: '7d', // Refresh token lasts longer
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Multi-device session storage
  async saveUserSession(
    userId: string,
    refreshToken: string,
    meta?: { device?: string; ip?: string },
  ) {
    const hash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save session in UserSession table
    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: hash,
        device: meta?.device ?? null,
        ip: meta?.ip ?? null,
        expiresAt,
      },
    });

    // Also update user.refreshTokenHash for backward compatibility
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });

    // Prune excess sessions (keep newest MAX_SESSIONS_PER_USER)
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (sessions.length > MAX_SESSIONS_PER_USER) {
      const toDelete = sessions.slice(MAX_SESSIONS_PER_USER).map((s) => s.id);
      await this.prisma.userSession.deleteMany({
        where: { id: { in: toDelete } },
      });
    }
  }

  // login
  async login(
    user: User,
    meta?: { device?: string; ip?: string },
  ): Promise<AuthPayload> {
    const tokens = await this.getTokens(user.id);
    await this.saveUserSession(user.id, tokens.refreshToken, meta);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
    });

    return {
      userId: user.id,
      ...tokens,
      user,
    };
  }

  // logout (revokes current session or all)
  async logout(userId: string) {
    await Promise.all([
      this.prisma.userSession.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }),
    ]);
    return true;
  }

  async refreshTokens(
    userIdOrRefreshToken: string,
    optionalRefreshToken?: string,
    meta?: { device?: string; ip?: string },
  ) {
    // Support both signatures: refreshTokens(userId, refreshToken) or refreshTokens(refreshToken)
    const token = optionalRefreshToken || userIdOrRefreshToken;
    let userId: string;

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );
      userId = payload.sub;
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('Access Denied');
    }

    // Verify token against active sessions for this user
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });

    let matchedSessionId: string | null = null;
    for (const session of sessions) {
      const match = await argon2
        .verify(session.refreshTokenHash, token)
        .catch(() => false);
      if (match) {
        matchedSessionId = session.id;
        break;
      }
    }

    // Fallback: check legacy single user.refreshTokenHash
    if (!matchedSessionId && user.refreshTokenHash) {
      const legacyMatch = await argon2
        .verify(user.refreshTokenHash, token)
        .catch(() => false);
      if (!legacyMatch) {
        throw new ForbiddenException('Access Denied');
      }
    } else if (!matchedSessionId && sessions.length > 0) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id);
    const newHash = await argon2.hash(tokens.refreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (matchedSessionId) {
      await this.prisma.userSession.update({
        where: { id: matchedSessionId },
        data: {
          refreshTokenHash: newHash,
          expiresAt: newExpiresAt,
          device: meta?.device ?? undefined,
          ip: meta?.ip ?? undefined,
        },
      });
    } else {
      await this.saveUserSession(user.id, tokens.refreshToken, meta);
    }

    return tokens;
  }

  async validateJwtUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    // A suspended / banned account stops working immediately, even with a
    // token that has not expired yet.
    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  }

  // What may be sent to a browser: never the password hash, refresh-token
  // hash or other internal fields.
  toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      language: user.language,
      role: user.role,
      // what a staff member may do (admins may do everything), and whether they can be sent to deliver
      permissions: permissionsOf(user),
      canDeliver: user.canDeliver,
      staffTitle: user.staffTitle,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    };
  }
}
