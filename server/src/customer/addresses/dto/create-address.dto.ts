import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsBdMobile } from '../../../common/utils/phone';

export class CreateAddressDto {
  @ApiPropertyOptional({ default: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '01712345678' })
  @IsBdMobile()
  phone: string;

  @ApiPropertyOptional({ example: '01812345678' })
  @IsOptional()
  @IsBdMobile()
  alternatePhone?: string;

  @ApiProperty()
  @IsString()
  line1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional({
    description: 'City / district. Defaults to the district when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'dhaka',
    description: 'Division id or name (see /customer/locations)',
  })
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
    description:
      'Upazila or city thana (optional) — must belong to the district',
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

  @ApiPropertyOptional({ description: 'Delivery pin: latitude' })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeNameBn?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
