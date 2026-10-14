import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsBdMobile } from '../../../common/utils/phone';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class RegisterDto {
  @ApiProperty({ example: '01712345678', description: 'Bangladeshi mobile' })
  @IsBdMobile()
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ description: 'Optional, for email receipts' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ enum: ['bn', 'en'], default: 'bn' })
  @IsOptional()
  @IsIn(['bn', 'en'])
  language?: string;

  @ApiPropertyOptional({
    description:
      'Guest cart id (x-guest-token). If sent, the guest cart is moved into the account.',
  })
  @IsOptional()
  @IsUUID()
  guestToken?: string;
}
