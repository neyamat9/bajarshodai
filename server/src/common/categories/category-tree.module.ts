import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoryTreeService } from './category-tree.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [CategoryTreeService],
  exports: [CategoryTreeService],
})
export class CategoryTreeModule {}
