import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrescriptionStatus } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { PrescriptionsService } from '../../customer/prescriptions/prescriptions.service';

@ApiTags('Admin - Prescriptions')
@ApiBearerAuth('JWT')
@RequirePermissions('orders.view', 'customers.view')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/prescriptions')
export class AdminPrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List customer prescriptions' })
  async list(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PrescriptionStatus,
    @Query('search') search?: string,
  ) {
    return this.prescriptions.listForAdmin({ page, limit, status, search });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update prescription status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PrescriptionStatus,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.prescriptions.updateStatus(id, status, adminNotes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete prescription' })
  async remove(@Param('id') id: string) {
    return this.prescriptions.removeByAdmin(id);
  }
}

