import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBdMobile } from '../../../common/utils/phone';

export class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '01712345678' })
  @IsString()
  @IsBdMobile()
  phone: string;

  @ApiProperty({ description: 'House, lane, area: what the rider reads' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Delivery pin: latitude. Required: the delivery charge comes from it.' })
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty({ description: 'Delivery pin: longitude' })
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ description: 'The place name shown on the map' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeName?: string;

  @ApiPropertyOptional({ description: 'A landmark: "beside the green gate"' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({ description: 'How exact the GPS fix was, in metres' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracyM?: number;

  @ApiPropertyOptional({ enum: ['GPS', 'PIN', 'SEARCH', 'LINK'] })
  @IsOptional()
  @IsIn(['GPS', 'PIN', 'SEARCH', 'LINK'])
  locationSource?: 'GPS' | 'PIN' | 'SEARCH' | 'LINK';

  @ApiPropertyOptional({
    description: 'City / district. Defaults to the district when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'dhaka', description: 'Division id or name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  division?: string;

  @ApiPropertyOptional({ example: 'dhaka', description: 'District id or name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({
    example: 'savar',
    description: 'Upazila or city thana (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  upazila?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class PlaceOrderDto {
  // The language the customer is using. Emails, notifications and the invoice follow it.
  @ApiPropertyOptional({ enum: ['bn', 'en'], default: 'bn' })
  @IsOptional()
  @IsIn(['bn', 'en'])
  language?: 'bn' | 'en';

  // Cash on Delivery or manual mobile banking (bKash / Nagad / Rocket) — no payment gateway.
  @ApiProperty({ enum: ['CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET'] })
  @IsEnum(['CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET'])
  paymentMethod: 'CASH_ON_DELIVERY' | 'BKASH' | 'NAGAD' | 'ROCKET';

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Delivery time slot id, from the delivery settings' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  deliverySlot?: string;

  @ApiPropertyOptional({ example: '2026-10-15', description: 'Wanted delivery day (Bangladesh time)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'deliveryDate must look like 2026-10-15' })
  deliveryDate?: string;

  // Required for bKash / Nagad / Rocket: the transaction ID the customer received
  // after manually sending the payment. An admin verifies it against the
  // merchant account before marking the order PAID. (The field keeps its old
  // "bkash" name but is used for every mobile-banking method.)
  @ApiPropertyOptional({
    description:
      'Transaction ID of the mobile-banking payment (bKash / Nagad / Rocket).',
  })
  @ValidateIf((dto: PlaceOrderDto) => dto.paymentMethod !== 'CASH_ON_DELIVERY')
  @IsString()
  @IsNotEmpty({ message: 'The transaction ID is required for mobile banking' })
  @Matches(/^[A-Za-z0-9]{6,20}$/, {
    message: 'The transaction ID must be 6-20 letters or digits',
  })
  bkashTransactionId?: string;

  // The mobile-banking number the customer sent the payment from, so the
  // admin can match it against the merchant statement.
  @ApiPropertyOptional({
    description: 'The mobile-banking number the payment was sent from.',
  })
  @ValidateIf((dto: PlaceOrderDto) => dto.paymentMethod !== 'CASH_ON_DELIVERY')
  @IsString()
  @IsNotEmpty({ message: 'The sender number is required for mobile banking' })
  bkashSenderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @ApiPropertyOptional({
    description:
      'Guest checkout only: email for the order confirmation (ignored when logged in)',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
