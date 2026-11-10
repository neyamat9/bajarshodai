import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Signed Google ID Token (credential) returned by Google Identity Services',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional({
    description:
      'Guest cart id (x-guest-token). If sent, the guest cart is moved into the account.',
  })
  @IsOptional()
  @IsUUID()
  guestToken?: string;
}

