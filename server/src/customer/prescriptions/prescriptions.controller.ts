import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { User } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CreatePrescriptionDto } from './prescriptions.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('Prescriptions')
@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  /**
   * Public / Customer prescription upload (attaches user if authenticated)
   */
  @Post('prescriptions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ medium: { ttl: 60000, limit: 10 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['phone', 'file'],
      properties: {
        phone: { type: 'string' },
        notes: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload doctor prescription photo or document' })
  async upload(
    @CurrentUser() user: User | undefined,
    @Body() dto: CreatePrescriptionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Prescription photo or document is required');
    }
    return this.prescriptions.create(user, dto, file);
  }

  /**
   * Get all prescriptions uploaded by the logged-in customer
   */
  @Get('customer/prescriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get customer's uploaded prescriptions" })
  async listMyPrescriptions(@CurrentUser() user: User) {
    return this.prescriptions.findByCustomer(user.id);
  }

  /**
   * Customer deletes their own prescription
   */
  @Delete('customer/prescriptions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete own uploaded prescription' })
  async deleteMyPrescription(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.prescriptions.removeByCustomer(user.id, id);
  }
}

