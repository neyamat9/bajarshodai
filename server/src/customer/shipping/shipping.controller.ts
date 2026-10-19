import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { MapsService } from '../../common/maps';
import { ShippingService } from './shipping.service';

class QuoteDto {
  @ApiProperty() @Type(() => Number) @IsLatitude() lat: number;
  @ApiProperty() @Type(() => Number) @IsLongitude() lng: number;
  @ApiPropertyOptional({ description: 'Order subtotal, to see whether delivery would be free' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
}

class PlaceQuery {
  @ApiProperty() @Type(() => Number) @IsLatitude() lat: number;
  @ApiProperty() @Type(() => Number) @IsLongitude() lng: number;
  @ApiPropertyOptional({ enum: ['bn', 'en'] }) @IsOptional() @IsIn(['bn', 'en']) lang?: 'bn' | 'en';
}

class SearchQuery {
  @ApiProperty() @IsString() @MaxLength(120) q: string;
  @ApiPropertyOptional({ enum: ['bn', 'en'] }) @IsOptional() @IsIn(['bn', 'en']) lang?: 'bn' | 'en';
}

@ApiTags('Customer - Delivery')
@Controller('customer/shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly maps: MapsService,
  ) {}

  @Public()
  @Get('options')
  @ApiOperation({ summary: 'The delivery rules: origin, service radius, rates, minimum order, time slots, shop hours' })
  async getOptions() {
    return this.shippingService.getOptions();
  }

  @Public()
  @Post('quote')
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Distance and delivery charge for a point on the map ("check my delivery charge")' })
  quote(@Body() dto: QuoteDto) {
    return this.shippingService.quote(dto.subtotal ?? 0, { lat: dto.lat, lng: dto.lng });
  }

  @Public()
  @Get('place')
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'A readable place name for a point (reverse geocoding, cached)' })
  async place(@Query() q: PlaceQuery) {
    const lang = q.lang ?? 'bn';
    return { lang, name: await this.maps.placeName({ lat: q.lat, lng: q.lng }, lang) };
  }

  @Public()
  @Get('search')
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Address search for the "find my street" box' })
  async search(@Query() q: SearchQuery) {
    const opts = await this.shippingService.getOptions();
    const near =
      opts.origin && opts.origin.lat !== null && opts.origin.lng !== null
        ? { lat: opts.origin.lat, lng: opts.origin.lng }
        : undefined;
    return { results: await this.maps.search(q.q, q.lang ?? 'bn', near) };
  }
}
