import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { CreateStaffDto, ListStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Admin - Staff')
@ApiBearerAuth('JWT')
@RequirePermissions('staff.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('meta')
  @ApiOperation({
    summary:
      'The list of permissions and the role presets (Manager, Packer, Rider, Order taker)',
  })
  meta() {
    return this.staff.meta();
  }

  @Get()
  @ApiOperation({
    summary:
      'Everyone who can sign in to the dashboard, with their delivery counts',
  })
  list(@Query() q: ListStaffDto) {
    return this.staff.list(q);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'One person: access, delivery counts, cash in hand and their latest activity',
  })
  one(@Param('id', ParseUUIDPipe) id: string) {
    return this.staff.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Add a staff member (a temporary password is returned once when none is given)',
  })
  create(@Body() dto: CreateStaffDto, @CurrentUser() actor: User) {
    return this.staff.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Change name, title, role, permissions, can-deliver, or deactivate / reactivate. Nothing is ever deleted.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() actor: User,
  ) {
    return this.staff.update(id, dto, actor);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Set a temporary password (shown once); the person is signed out everywhere',
  })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
  ) {
    return this.staff.resetPassword(id, actor);
  }
}
