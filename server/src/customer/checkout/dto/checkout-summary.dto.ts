import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsBdMobile } from '../../../common/utils/phone';

export class CheckoutSummaryDto {
  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Delivery pin: latitude. The delivery charge is worked out from it.' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ description: 'Delivery pin: longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({
    description:
      'Guest checkout: the customer phone, used for per-customer coupon rules',
  })
  @IsOptional()
  @IsBdMobile()
  phone?: string;

  @ApiPropertyOptional({ description: 'Number of loyalty points to redeem for discount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  redeemPoints?: number;
}
