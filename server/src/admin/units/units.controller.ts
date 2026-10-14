import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { ResponseMessage, Roles } from '../../common/decorators';
import { DisplayOrderService, ReorderDto } from '../../common/display-order';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@ApiTags('Admin - Units')
@ApiBearerAuth('JWT')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/units')
export class UnitsController {
  constructor(
    private readonly units: UnitsService,
    private readonly displayOrder: DisplayOrderService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'All units (including switched-off ones) with the number of products using each',
  })
  findAll() {
    return this.units.findAll();
  }

  @Put('reorder')
  @ApiOperation({
    summary:
      'Save the order of the units (drag & drop). Send all ids in the wanted order.',
  })
  reorder(@Body() dto: ReorderDto) {
    return this.displayOrder.reorder('unit', dto.ids);
  }

  @Post()
  @ResponseMessage('Unit created successfully')
  @ApiOperation({ summary: 'Add a unit (kg, bottle, bundle…)' })
  create(@Body() dto: CreateUnitDto) {
    return this.units.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Change a unit. Old orders keep the text they were placed with.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.units.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a unit that no product uses (switch it off otherwise)',
  })
  remove(@Param('id') id: string) {
    return this.units.remove(id);
  }
}
