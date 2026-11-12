import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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

  @ApiPropertyOptional({ description: 'Delivery pin: latitude. Required when sharing location.' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Delivery pin: longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

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

  // Optional for bKash / Nagad / Rocket: customer may provide TrxID if available
  @ApiPropertyOptional({
    description:
      'Optional transaction ID of the mobile-banking payment (bKash / Nagad / Rocket).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bkashTransactionId?: string;

  // The mobile-banking number or last 4 digits the customer sent the payment from.
  @ApiPropertyOptional({
    description:
      'The sender mobile-banking phone number (11 digits) or last 4 digits.',
  })
  @ValidateIf((dto: PlaceOrderDto) => dto.paymentMethod !== 'CASH_ON_DELIVERY')
  @IsString()
  @IsNotEmpty({ message: 'The sender number (or last 4 digits) is required for mobile banking' })
  @Matches(/^(\d{4}|01[3-9]\d{8})$/, {
    message:
      'Sender number must be either full 11-digit BD number (e.g. 01712345678) or last 4 digits (e.g. 5678)',
  })
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

  @ApiPropertyOptional({ description: 'Number of loyalty points to redeem for discount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  redeemPoints?: number;

  @ApiPropertyOptional({ description: 'Skip location pin (abroad / remote order)' })
  @IsOptional()
  @IsBoolean()
  skipLocation?: boolean;

  @ApiPropertyOptional({ description: 'True when the buyer is placing the order from abroad' })
  @IsOptional()
  @IsBoolean()
  isAbroadOrder?: boolean;

  @ApiPropertyOptional({ description: 'Buyer country of residence (e.g. Saudi Arabia, UAE, UK, USA)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderCountry?: string;

  @ApiPropertyOptional({ enum: ['WHATSAPP', 'IMO', 'PHONE'], description: 'Buyer contact method' })
  @IsOptional()
  @IsIn(['WHATSAPP', 'IMO', 'PHONE'])
  senderContactMethod?: 'WHATSAPP' | 'IMO' | 'PHONE';

  @ApiPropertyOptional({ description: 'Buyer WhatsApp / IMO phone number with country code' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  senderContactNumber?: string;
}
