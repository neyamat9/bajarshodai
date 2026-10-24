import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Body,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import {
  DisplayOrderService,
  ReorderBannersDto,
} from '../../common/display-order';
import { AdminBannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './banner.dto';

@ApiTags('Admin - Banners')
@ApiBearerAuth('JWT')
@RequirePermissions('settings.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/banners')
export class AdminBannersController {
  constructor(
    private readonly bannersService: AdminBannersService,
    private readonly displayOrder: DisplayOrderService,
  ) {}

  @Put('reorder')
  @ApiOperation({
    summary:
      'Save the display order of the banners of one position. Send position and all its banner ids in the wanted order.',
  })
  reorder(@Body() dto: ReorderBannersDto) {
    return this.displayOrder.reorder('banner', dto.ids, {
      position: dto.position,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all banners' })
  async findAll() {
    return this.bannersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a banner' })
  async create(@Body() data: CreateBannerDto) {
    return this.bannersService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a banner' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateBannerDto,
  ) {
    return this.bannersService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a banner' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.remove(id);
  }
}

