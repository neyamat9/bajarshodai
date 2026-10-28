import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions, ResponseMessage } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { MedicineService } from './medicine.service';
import {
  MedicineListQueryDto,
  ApplyDriftDto,
  SetGlobalMedicineDiscountDto,
  UpdateMedicinePricingDto,
} from './dto/medicine.dto';

@ApiTags('Admin - Medicine Catalog & Price Sync')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('products.view', 'products.manage')
@Controller('admin/medicine')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get('lookup')
  @ApiOperation({ summary: 'Live search brands from MedEx for autocomplete' })
  @ApiResponse({ status: 200, description: 'List of matching brand medicines' })
  lookup(@Query('q') query: string) {
    return this.medicineService.lookup(query);
  }

  @Get('detail')
  @ApiOperation({ summary: 'Fetch full medicine details & MRP from MedEx brand page' })
  @ApiResponse({ status: 200, description: 'Detailed medicine information' })
  getDetail(@Query('url') url: string) {
    return this.medicineService.getDetail(url);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all medicines with search, generic filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated medicine products list' })
  list(@Query() query: MedicineListQueryDto) {
    return this.medicineService.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get KPI statistics for Medicine Hub' })
  getStats() {
    return this.medicineService.getStats();
  }

  @Post('sync-price/:productId')
  @ResponseMessage('Medicine price synced from MedEx successfully')
  @ApiOperation({ summary: 'Sync price of a single medicine product from MedEx' })
  syncProductPrice(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() admin: User,
  ) {
    return this.medicineService.syncProductPrice(productId, admin.id);
  }

  @Post('audit-drift')
  @ResponseMessage('Market price drift audit completed')
  @ApiOperation({ summary: 'Scan all active medicines against MedEx to detect market price drifts' })
  auditDrift(@CurrentUser() admin: User) {
    return this.medicineService.auditDrift(admin.id);
  }

  @Post('accept-drift/:productId')
  @ResponseMessage('Price drift accepted and product price updated')
  @ApiOperation({ summary: 'Accept the detected price drift and apply to store catalog' })
  acceptDrift(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() admin: User,
    @Body() dto: ApplyDriftDto,
  ) {
    return this.medicineService.acceptDrift(productId, admin.id, dto.sellingPrice);
  }

  @Post('accept-all-drifts')
  @ResponseMessage('All detected price drifts accepted')
  @ApiOperation({ summary: 'Batch accept all detected price drift revisions in 1 click' })
  acceptAllDrifts(@CurrentUser() admin: User) {
    return this.medicineService.acceptAllDrifts(admin.id);
  }

  @Get('discount-settings')
  @ApiOperation({ summary: 'Get global medicine discount settings and breakdown' })
  getDiscountSettings() {
    return this.medicineService.getDiscountSettings();
  }

  @Post('global-discount')
  @ResponseMessage('Global medicine discount updated and applied')
  @ApiOperation({ summary: 'Set global medicine discount percentage for all medicines' })
  setGlobalDiscount(
    @Body() dto: SetGlobalMedicineDiscountDto,
    @CurrentUser() admin: User,
  ) {
    return this.medicineService.setGlobalDiscount(dto.discountPercent, admin.id);
  }

  @Post('single-pricing/:productId')
  @ResponseMessage('Medicine pricing updated successfully')
  @ApiOperation({ summary: 'Set custom pricing or discount override for an individual medicine' })
  setSingleMedicinePricing(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateMedicinePricingDto,
    @CurrentUser() admin: User,
  ) {
    return this.medicineService.setSingleMedicinePricing(productId, dto, admin.id);
  }
}
