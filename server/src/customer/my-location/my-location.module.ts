import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ShippingModule } from '../shipping/shipping.module';
import { LocationRequestsPublicController, MyLocationController } from './my-location.controller';
import { MyLocationService } from './my-location.service';

@Module({
  imports: [PrismaModule, ShippingModule],
  controllers: [MyLocationController, LocationRequestsPublicController],
  providers: [MyLocationService],
  exports: [MyLocationService],
})
export class MyLocationModule {}
