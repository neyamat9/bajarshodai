import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminOrdersModule } from '../orders/orders.module';
import {
  AdminDeliveriesController,
  MyDeliveriesController,
} from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [PrismaModule, AdminOrdersModule],
  controllers: [AdminDeliveriesController, MyDeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
