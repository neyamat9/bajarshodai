import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address or 11-digit phone number' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

