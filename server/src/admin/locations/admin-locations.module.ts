import { Module } from '@nestjs/common';
import { MyLocationModule } from '../../customer/my-location/my-location.module';
import { AdminLocationsController } from './admin-locations.controller';

@Module({
  imports: [MyLocationModule],
  controllers: [AdminLocationsController],
})
export class AdminLocationsModule {}
