import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsBdMobile } from '../../../common/utils/phone';
import { ALL_PERMISSIONS } from '../../../common/permissions';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' ? null : trim({ value });
const ROLES = ['STAFF', 'ADMIN'];

export class ListStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
  @ApiPropertyOptional({ enum: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] })
  @IsOptional()
  @IsIn(['STAFF', 'ADMIN', 'SUPER_ADMIN'])
  role?: string;
  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: string;
  @ApiPropertyOptional({
    description: 'Only people who can be sent to deliver',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  canDeliver?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

class StaffFields {
  @ApiPropertyOptional({ example: 'Rafiq' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @IsEmail()
  email?: string | null;
  @ApiPropertyOptional({
    description: 'What they are called in the shop (Packer, Rider…)',
    nullable: true,
  })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(60)
  staffTitle?: string | null;
  @ApiPropertyOptional({
    enum: ROLES,
    description:
      'ADMIN may do everything; STAFF only what the permissions allow. Only a super admin can make an admin.',
  })
  @IsOptional()
  @IsIn(ROLES)
  role?: 'STAFF' | 'ADMIN';
  @ApiPropertyOptional({ isArray: true, enum: ALL_PERMISSIONS })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(ALL_PERMISSIONS, { each: true })
  permissions?: string[];
  @ApiPropertyOptional({
    description: 'Can be given orders to deliver (any role)',
  })
  @IsOptional()
  @IsBoolean()
  canDeliver?: boolean;
}

export class CreateStaffDto extends StaffFields {
  @ApiProperty({ example: 'Rafiq' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  declare name: string;
  @ApiProperty({ example: '01712345678' })
  @IsString()
  @IsBdMobile()
  phone: string;
  @ApiPropertyOptional({
    description: 'Leave empty to get a temporary one back',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;
  @ApiPropertyOptional({
    description:
      'The number already belongs to a customer: turn that account into a staff account',
  })
  @IsOptional()
  @IsBoolean()
  useExistingCustomer?: boolean;
}

export class UpdateStaffDto extends StaffFields {
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'SUSPENDED'],
    description: 'SUSPENDED = cannot sign in (nothing is deleted)',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'SUSPENDED';
}
