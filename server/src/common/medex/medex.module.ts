import { Module, Global } from '@nestjs/common';
import { MedExService } from './medex.service';

@Global()
@Module({
  providers: [MedExService],
  exports: [MedExService],
})
export class MedExModule {}
