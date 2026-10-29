import { Module } from '@nestjs/common';
import { PrescriptionsModule } from '../../customer/prescriptions/prescriptions.module';
import { AdminPrescriptionsController } from './admin-prescriptions.controller';

@Module({
  imports: [PrescriptionsModule],
  controllers: [AdminPrescriptionsController],
})
export class AdminPrescriptionsModule {}

