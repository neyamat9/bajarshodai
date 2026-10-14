import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsBdMobile } from '../../common/utils/phone';
import { MyLocationService } from '../../customer/my-location/my-location.service';

class CreateRequestDto {
  @ApiPropertyOptional({
    description:
      'The customer phone: when they share, it is saved to their number',
  })
  @IsOptional()
  @IsString()
  @IsBdMobile()
  phone?: string;
  @ApiPropertyOptional({
    description: 'The name shown on the share page ("Hello Rahim")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
  @ApiPropertyOptional({ description: 'The order this location is for' })
  @IsOptional()
  @IsUUID()
  orderId?: string;
  @ApiPropertyOptional({ description: 'How long the link works (default 24)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  hours?: number;
}

class ListQuery {
  @ApiPropertyOptional({ enum: ['PENDING', 'SHARED', 'EXPIRED'] })
  @IsOptional()
  @IsString()
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() orderId?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

@ApiTags('Admin - Locations')
@ApiBearerAuth('JWT')
@RequirePermissions('orders.view', ['orders.manage', 'orders.assign'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/location-requests')
export class AdminLocationsController {
  constructor(private readonly service: MyLocationService) {}

  @Post()
  @ApiOperation({
    summary:
      'Make a "share your location" link to send by WhatsApp or Messenger',
  })
  create(@Body() dto: CreateRequestDto, @CurrentUser() admin: User) {
    return this.service.createRequest(admin.id, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'The links sent, newest first, with the place each customer shared',
  })
  list(@Query() q: ListQuery) {
    return this.service.listRequests(q);
  }

  @Get('customer/:userId')
  @ApiOperation({
    summary:
      'The last place a customer shared (by account or phone), with the delivery charge for it',
  })
  customer(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.lastForCustomer(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One link and what was shared through it' })
  one(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRequest(id);
  }
}
