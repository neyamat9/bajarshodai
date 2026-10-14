import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenInput {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
