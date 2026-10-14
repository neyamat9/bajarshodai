import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignInInput {
  // Phone number (01XXXXXXXXX) or email address.
  @IsNotEmpty({ message: 'Phone number or email is required' })
  @IsString()
  @MaxLength(254)
  identifier: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
