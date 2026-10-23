import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { LoyaltyService } from './loyalty.service';

@ApiTags('Customer - Loyalty & Rewards')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('customer/loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get customer loyalty points balance, milestone status, and history',
  })
  async getSummary(@CurrentUser() user: User) {
    return this.loyaltyService.getCustomerSummary(user.id);
  }
}
