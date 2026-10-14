import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '01712345678',
    description: 'Phone number (or the email, if the account has one)',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(254)
  identifier: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description:
      'Guest cart id (x-guest-token). If sent, the guest cart is moved into the account.',
  })
  @IsOptional()
  @IsUUID()
  guestToken?: string;
}
