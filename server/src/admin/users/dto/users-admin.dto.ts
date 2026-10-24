import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Role, UserStatus } from '@prisma/client';
import type { ExportFormat } from '../../../common/export/table-export';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/;

export const USER_SORTS = [
  'newest',
  'oldest',
  'name',
  'spent',
  'orders',
  'last-login',
] as const;

export class UserFilterDto {
  @ApiPropertyOptional({ description: 'Name, email or phone' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsIn(Object.values(UserStatus))
  status?: UserStatus;

  @ApiPropertyOptional({
    enum: Role,
    description: 'Default: customers only (USER)',
  })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiPropertyOptional({
    example: '2026-09-01',
    description: 'Registered on or after (Bangladesh day)',
  })
  @IsOptional()
  @Matches(DATE_INPUT)
  registeredFrom?: string;

  @ApiPropertyOptional({
    example: '2026-09-30',
    description: 'Registered on or before (Bangladesh day)',
  })
  @IsOptional()
  @Matches(DATE_INPUT)
  registeredTo?: string;

  @ApiPropertyOptional({
    description:
      'true = customers with at least one order, false = never ordered',
  })
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const v = obj[key];
    return v === 'true' || v === true
      ? true
      : v === 'false' || v === false
        ? false
        : v;
  })
  @IsBoolean()
  hasOrdered?: boolean;
}

export class ListUsersDto extends UserFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: USER_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn(USER_SORTS)
  sortBy?: (typeof USER_SORTS)[number];
}

export class ExportUsersDto extends UserFilterDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx'], default: 'csv' })
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format: Exclude<ExportFormat, 'json'> = 'csv';
}

export class PageDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsIn(Object.values(UserStatus))
  status: UserStatus;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role })
  @IsIn(Object.values(Role))
  role: Role;
}

export class CreateNoteDto {
  @ApiProperty({
    example: 'Called to confirm address, prefers evening delivery',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}

export class ListPasswordResetRequestsDto extends PageDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'CONTACTED', 'RESOLVED', 'REJECTED'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdatePasswordResetRequestDto {
  @ApiProperty({ enum: ['PENDING', 'CONTACTED', 'RESOLVED', 'REJECTED'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'CONTACTED', 'RESOLVED', 'REJECTED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AdminDirectResetPasswordDto {
  @ApiPropertyOptional({ description: 'Optional new password. If omitted, a random secure one is generated.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword?: string;
}

export class UpdateBlacklistDto {
  @ApiProperty({ description: 'Blacklist customer from placing COD orders' })
  @IsBoolean()
  isBlacklisted: boolean;

  @ApiPropertyOptional({ description: 'Reason for blacklisting' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

