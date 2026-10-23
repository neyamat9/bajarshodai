import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { CartModule } from '../cart/cart.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [PrismaModule, CheckoutModule, CartModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
