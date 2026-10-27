import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeaturedProductsService } from './featured-products.service';
import { UpdateFeaturedProductsDto } from './dto/featured-products.dto';

@ApiTags('Admin - Featured Products')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/featured-products')
export class FeaturedProductsController {
  constructor(private readonly service: FeaturedProductsService) {}

  @Get()
  @RequirePermissions('products.view')
  @ApiOperation({ summary: 'Get current featured 18 products list for আজকের তাজা বাজার' })
  async getFeatured() {
    return this.service.getFeaturedProducts();
  }

  @Put()
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: 'Update ordered list of up to 18 featured products' })
  async updateFeatured(
    @Body() dto: UpdateFeaturedProductsDto,
    @CurrentUser() adminUser: User,
  ) {
    return this.service.updateFeaturedProducts(dto, adminUser);
  }
}
