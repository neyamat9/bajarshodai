import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '../../common/cache';
import { StorefrontModule } from '../../common/storefront/storefront.module';
import { FeaturedProductsController } from './featured-products.controller';
import { FeaturedProductsService } from './featured-products.service';

@Module({
  imports: [PrismaModule, CacheModule, StorefrontModule],
  controllers: [FeaturedProductsController],
  providers: [FeaturedProductsService],
  exports: [FeaturedProductsService],
})
export class FeaturedProductsModule {}
