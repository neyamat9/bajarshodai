import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type { Response } from 'express';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { resolveRange } from '../../common/export/date-range';
import { EXPORT_FORMATS, sendTable } from '../../common/export/table-export';
import type { ExportFormat } from '../../common/export/table-export';
import { toBool } from '../../common/utils/transforms';
import { GRANULARITIES } from '../analytics/analytics.service';
import type { Granularity } from '../analytics/analytics.service';
import { autoGranularity, RangeQueryDto } from '../dashboard/dashboard.dto';
import { ReportsService } from './reports.service';
import { DeliveryReportsService } from './delivery-reports.service';

class ReportQueryDto extends RangeQueryDto {
  @ApiPropertyOptional({
    enum: EXPORT_FORMATS,
    default: 'json',
    description: 'json (view), csv or xlsx (Excel download)',
  })
  @IsOptional()
  @IsIn(EXPORT_FORMATS)
  format: ExportFormat = 'json';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

class SalesReportQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({ enum: GRANULARITIES })
  @IsOptional()
  @IsIn(GRANULARITIES)
  granularity?: Granularity;
}

class ProductReportQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({
    default: false,
    description: 'false = only products that sold in the range',
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeUnsold: boolean = false;
}

class StockReportQueryDto {
  @ApiPropertyOptional({ enum: EXPORT_FORMATS, default: 'json' })
  @IsOptional()
  @IsIn(EXPORT_FORMATS)
  format: ExportFormat = 'json';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@ApiTags('Admin - Reports')
@ApiBearerAuth('JWT')
@RequirePermissions('reports.view')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/reports')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly deliveryReports: DeliveryReportsService,
  ) {}

  @Get('deliveries-by-rider')
  @ApiOperation({
    summary:
      'Per rider: delivered, not delivered, success %, customers, average time and the cash taken / handed over / still held. format=json|csv|xlsx',
  })
  async deliveriesByRider(@Query() q: ReportQueryDto, @Res() res: Response) {
    await sendTable(
      res,
      q.format,
      await this.deliveryReports.byRider(resolveRange(q.from, q.to)),
    );
  }

  @Get('deliveries-by-day')
  @ApiOperation({
    summary:
      'Per Bangladesh day: delivered, not delivered, customers, order value, delivery charges and cash taken. format=json|csv|xlsx',
  })
  async deliveriesByDay(@Query() q: ReportQueryDto, @Res() res: Response) {
    await sendTable(
      res,
      q.format,
      await this.deliveryReports.byDay(resolveRange(q.from, q.to)),
    );
  }

  @Get('cod-reconciliation')
  @ApiOperation({
    summary:
      'Cash on delivery, one row per delivery: what the order said, what the rider took, what reached the shop. format=json|csv|xlsx',
  })
  async codReconciliation(@Query() q: ReportQueryDto, @Res() res: Response) {
    await sendTable(
      res,
      q.format,
      await this.deliveryReports.codReconciliation(resolveRange(q.from, q.to)),
    );
  }

  @Get('sales')
  @ApiOperation({
    summary:
      'Sales report per day/week/month with totals. format=json|csv|xlsx',
  })
  @ApiQuery({ name: 'format', required: false, enum: EXPORT_FORMATS })
  async sales(@Query() q: SalesReportQueryDto, @Res() res: Response) {
    const r = resolveRange(q.from, q.to);
    const table = await this.reports.sales(
      r,
      q.granularity ?? autoGranularity(r.from, r.to),
    );
    await sendTable(res, q.format, table);
  }

  @Get('product-performance')
  @ApiOperation({
    summary:
      'Units, revenue, estimated profit, stock, views and rating per product. format=json|csv|xlsx',
  })
  async products(@Query() q: ProductReportQueryDto, @Res() res: Response) {
    const table = await this.reports.productPerformance(
      resolveRange(q.from, q.to),
      q.includeUnsold,
      q.format === 'json' ? { page: q.page ?? 1, limit: q.limit ?? 20 } : undefined,
    );
    await sendTable(res, q.format, table);
  }

  @Get('stock-valuation')
  @ApiOperation({
    summary:
      'Stock on hand valued at cost and at selling price, per SKU with totals. format=json|csv|xlsx',
  })
  async stock(@Query() q: StockReportQueryDto, @Res() res: Response) {
    await sendTable(
      res,
      q.format,
      await this.reports.stockValuation(
        q.format === 'json' ? { page: q.page ?? 1, limit: q.limit ?? 20 } : undefined,
      ),
    );
  }

  @Get('coupon-performance')
  @ApiOperation({
    summary:
      'Uses, customers, discount given and order revenue per coupon. format=json|csv|xlsx',
  })
  async coupons(@Query() q: ReportQueryDto, @Res() res: Response) {
    await sendTable(
      res,
      q.format,
      await this.reports.couponPerformance(resolveRange(q.from, q.to)),
    );
  }

  @Get('customers')
  @ApiOperation({
    summary:
      'Customers who ordered in the range: orders, spent, average order, lifetime value. format=json|csv|xlsx',
  })
  async customers(@Query() q: ReportQueryDto, @Res() res: Response) {
    await sendTable(
      res,
      q.format,
      await this.reports.customers(
        resolveRange(q.from, q.to),
        q.format === 'json' ? { page: q.page ?? 1, limit: q.limit ?? 20 } : undefined,
      ),
    );
  }
}
