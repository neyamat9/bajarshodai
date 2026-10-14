import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsBdMobile } from '../../common/utils/phone';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateUserInput {
  // The phone number is the account's main identity.
  @IsBdMobile()
  phone: string;

  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100)
  name: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128)
  password: string;

  // Optional: only needed for email receipts and password reset links.
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(254)
  email?: string;

  // Language the customer is using (bn is the default).
  @IsOptional()
  @IsString()
  @IsIn(['bn', 'en'])
  language?: string;
}
