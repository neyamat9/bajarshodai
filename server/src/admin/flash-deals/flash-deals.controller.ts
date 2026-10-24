import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { AdminFlashDealsService } from './flash-deals.service';

@ApiTags('Admin - Flash Deals')
@ApiBearerAuth('JWT')
@RequirePermissions('products.view', 'products.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/flash-deals')
export class AdminFlashDealsController {
  constructor(private readonly flashDealsService: AdminFlashDealsService) {}

  @Get()
  @ApiOperation({ summary: 'List all flash deals' })
  async findAll() {
    return this.flashDealsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flash deal detail' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.flashDealsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a flash deal' })
  async create(@Body() data: any) {
    return this.flashDealsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a flash deal' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.flashDealsService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a flash deal' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.flashDealsService.remove(id);
  }
}

