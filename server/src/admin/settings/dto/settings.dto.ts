import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  Matches,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// All fields are optional: a PUT only changes the fields it sends.
// Send `null` to clear a nullable field.

export class SocialLinksDto {
  @ApiPropertyOptional() @IsOptional() @IsString() facebook?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instagram?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() youtube?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tiktok?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() twitter?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linkedin?: string;
}

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() storeName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tagline?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({ require_tld: false })
  logoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({ require_tld: false })
  faviconUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  contactEmail?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  hotline?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  whatsapp?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  businessHours?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currencySymbol?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  metaTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  metaDescription?: string | null;

  @ApiPropertyOptional({ type: SocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}

export class UpdatePaymentSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() codEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() bkashEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  bkashNumber?: string | null;

  @ApiPropertyOptional({ enum: ['personal', 'merchant', 'agent'] })
  @IsOptional()
  @IsIn(['personal', 'merchant', 'agent'])
  bkashAccountType?: 'personal' | 'merchant' | 'agent';

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  bkashInstructions?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() nagadEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  nagadNumber?: string | null;

  @ApiPropertyOptional({ enum: ['personal', 'merchant', 'agent'] })
  @IsOptional()
  @IsIn(['personal', 'merchant', 'agent'])
  nagadAccountType?: 'personal' | 'merchant' | 'agent';

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  nagadInstructions?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() rocketEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  rocketNumber?: string | null;

  @ApiPropertyOptional({ enum: ['personal', 'merchant', 'agent'] })
  @IsOptional()
  @IsIn(['personal', 'merchant', 'agent'])
  rocketAccountType?: 'personal' | 'merchant' | 'agent';

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  rocketInstructions?: string | null;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class DeliverySlotDto {
  @ApiProperty({ example: 'morning' }) @IsString() @MaxLength(40) id: string;
  @ApiProperty({ example: 'Morning (9am–12pm)' }) @IsString() @MaxLength(60) label: string;
  @ApiProperty({ example: 'সকাল (৯টা–১২টা)' }) @IsString() @MaxLength(60) labelBn: string;
  @ApiProperty({ example: '09:00' }) @Matches(HHMM, { message: 'Use the form 09:00' }) from: string;
  @ApiProperty({ example: '12:00' }) @Matches(HHMM, { message: 'Use the form 12:00' }) to: string;
}

export class UpdateDeliverySettingsDto {
  @ApiPropertyOptional({ description: 'Take delivery orders at all' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'The pin of Kalibari Bazar: every distance is measured from here' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsLatitude()
  originLat?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsLongitude()
  originLng?: number | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) originLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) originLabelBn?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Centre of the service area (empty = the origin)' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsLatitude()
  centerLat?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsLongitude()
  centerLng?: number | null;

  @ApiPropertyOptional({ example: 20 }) @IsOptional() @IsNumber() @Min(0.5) @Max(500) serviceRadiusKm?: number;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsNumber() @Min(0) @Max(100) baseKm?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @IsNumber() @Min(0) baseCharge?: number;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Min(0) perKmRate?: number;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Min(0.1) @Max(50) stepKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;

  @ApiPropertyOptional({ nullable: true, description: 'Delivery is free at or above this subtotal. null disables it.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsNumber()
  @Min(0)
  freeDeliveryThreshold?: number | null;

  @ApiPropertyOptional({ type: [DeliverySlotDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => DeliverySlotDto)
  slots?: DeliverySlotDto[];

  @ApiPropertyOptional({ example: '08:00' }) @IsOptional() @Matches(HHMM) openFrom?: string;
  @ApiPropertyOptional({ example: '22:00' }) @IsOptional() @Matches(HHMM) openTo?: string;
  @ApiPropertyOptional({ description: 'The manual open / closed switch' }) @IsOptional() @IsBoolean() shopOpen?: boolean;

  @ApiPropertyOptional({ example: 1.3, description: 'When no road route is found: straight line times this' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  routeFactor?: number;

  @ApiPropertyOptional({ description: 'Restrict delivery strictly to Shahrasti Upazila delivery zone' })
  @IsOptional()
  @IsBoolean()
  restrictToZone?: boolean;
}

export class UpdateMapsSettingsDto {
  @ApiPropertyOptional({ enum: ['osm', 'google'], description: 'Which map the shop uses. Switch any time.' })
  @IsOptional()
  @IsIn(['osm', 'google'])
  provider?: 'osm' | 'google';

  @ApiPropertyOptional({ nullable: true, description: 'Public key for the map in the browser (limit it to your website address in Google Cloud)' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  googleBrowserKey?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Secret: routes and place names. Write-only; send "" to remove.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  googleServerKey?: string | null;

  @ApiPropertyOptional({ example: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
  @IsOptional()
  @IsString()
  @Matches(/^https:\/\/.*\{z\}.*\{x\}.*\{y\}/, { message: 'A tile address must be https and contain {z}, {x} and {y}' })
  @MaxLength(300)
  osmTileUrl?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Secret: OpenRouteService key. Write-only; send "" to remove.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  orsApiKey?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'A contact email: OpenStreetMap asks for one' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail()
  contactEmail?: string | null;

  @ApiPropertyOptional({ example: 2000, description: 'Routes and place names per day, so a bug or bot cannot run up a bill. 0 = no limit.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  dailyRequestCap?: number;

  @ApiPropertyOptional({ description: 'Show search bar on the map picker' })
  @IsOptional()
  @IsBoolean()
  enableMapSearch?: boolean;

  @ApiPropertyOptional({ description: 'Automatically fetch place names from map dynamically' })
  @IsOptional()
  @IsBoolean()
  dynamicPlaceNames?: boolean;
}

export class UpdateReturnSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() returnsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  returnWindowDays?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  policyText?: string | null;
}

// Secrets (smtpPass, resendApiKey): omit to keep the stored value, send a
// new string to replace it, or send null / "" to remove it. Stored values are
// never returned — responses show smtpPassSet / resendApiKeySet instead.
export class UpdateEmailSettingsDto {
  @ApiPropertyOptional({ enum: ['none', 'smtp', 'resend'] })
  @IsOptional()
  @IsIn(['none', 'smtp', 'resend'])
  provider?: 'none' | 'smtp' | 'resend';

  @ApiPropertyOptional({ example: 'Bazar Shodai' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromName?: string;

  @ApiPropertyOptional({ nullable: true, example: 'orders@bazarshodai.com' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  fromEmail?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  replyTo?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'smtp.gmail.com' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(255)
  smtpHost?: string | null;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ description: 'true for port 465, false for 587' })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(255)
  smtpUser?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Write-only secret' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  smtpPass?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Write-only secret (re_...)',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  resendApiKey?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Receives new-order and contact-form alerts',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  adminNotificationEmail?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyCustomerOrderPlaced?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyCustomerOrderStatus?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyAdminNewOrder?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyAdminContactMessage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyAdminSupportTicket?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyCustomerTicketReply?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendNewsletterWelcome?: boolean;
}

export class TestEmailDto extends UpdateEmailSettingsDto {
  @ApiProperty({ description: 'Where to send the test email' })
  @IsEmail()
  to: string;
}
