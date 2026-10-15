import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DeliveryReportsService } from './delivery-reports.service';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [ReportsController],
  providers: [ReportsService, DeliveryReportsService],
})
export class AdminReportsModule {}
