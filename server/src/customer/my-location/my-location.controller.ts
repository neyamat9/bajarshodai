import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsIn, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentCartOwner, GUEST_TOKEN_HEADER, type CartOwner } from '../../common/cart/cart-owner';
import { IsBdMobile } from '../../common/utils/phone';
import { MyLocationService } from './my-location.service';

class ShareDto {
  @ApiProperty() @Type(() => Number) @IsLatitude() lat: number;
  @ApiProperty() @Type(() => Number) @IsLongitude() lng: number;
  @ApiPropertyOptional({ description: 'How exact the fix was, in metres' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) accuracyM?: number;
  @ApiPropertyOptional({ enum: ['GPS', 'PIN', 'SEARCH'] }) @IsOptional() @IsIn(['GPS', 'PIN', 'SEARCH']) source?: 'GPS' | 'PIN' | 'SEARCH';
  @ApiPropertyOptional() @IsOptional() @IsString() @IsBdMobile() phone?: string;
  @ApiPropertyOptional({ description: 'Cart subtotal, to see whether delivery would be free' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
}

class SubtotalQuery {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
}

class SubmitDto {
  @ApiProperty() @Type(() => Number) @IsLatitude() lat: number;
  @ApiProperty() @Type(() => Number) @IsLongitude() lng: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) accuracyM?: number;
}

// The location a customer chose to share. It belongs to the account when signed in, otherwise to this device (the guest cart id).
// It is the LAST place they chose to share: nothing is tracked in the background.
@ApiTags('Customer - My location')
@ApiBearerAuth()
@ApiHeader({ name: GUEST_TOKEN_HEADER, required: false, description: 'Guest cart id (UUID). Required when not logged in.' })
@UseGuards(OptionalJwtAuthGuard)
@Controller('customer/my-location')
export class MyLocationController {
  constructor(private readonly service: MyLocationService) {}

  @Post()
  @Throttle({ medium: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Share a location (the customer pressed the button): saved, with its place name, distance and delivery charge' })
  share(@CurrentCartOwner() owner: CartOwner, @Body() dto: ShareDto) {
    return this.service.share(owner, dto, dto.subtotal ?? 0);
  }

  @Get()
  @ApiOperation({ summary: 'The last location this customer (or device) shared, with the delivery charge for it' })
  saved(@CurrentCartOwner() owner: CartOwner, @Query() q: SubtotalQuery) {
    return this.service.saved(owner, q.subtotal ?? 0);
  }

  @Delete()
  @ApiOperation({ summary: 'Forget every location this customer (or device) shared' })
  forget(@CurrentCartOwner() owner: CartOwner) {
    return this.service.forget(owner);
  }
}

// The link the shop sends by WhatsApp or Messenger: no account needed.
@ApiTags('Customer - Location links')
@Controller('customer/location-requests')
export class LocationRequestsPublicController {
  constructor(private readonly service: MyLocationService) {}

  @Public()
  @Get(':token')
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'What the share page shows: who asked, the shop, the delivery rules' })
  info(@Param('token') token: string) {
    return this.service.publicInfo(token);
  }

  @Public()
  @Post(':token/submit')
  @HttpCode(HttpStatus.OK)
  @Throttle({ medium: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Share the location through the link' })
  submit(@Param('token') token: string, @Body() dto: SubmitDto) {
    return this.service.submit(token, dto);
  }
}
