import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import type { Response } from 'express';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { sendTable } from '../../common/export/table-export';
import { AdminUsersService } from './users.service';
import {
  AdminDirectResetPasswordDto,
  CreateNoteDto,
  ExportUsersDto,
  ListPasswordResetRequestsDto,
  ListUsersDto,
  PageDto,
  UpdateBlacklistDto,
  UpdatePasswordResetRequestDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/users-admin.dto';

@ApiTags('Admin - Customers')
@ApiBearerAuth('JWT')
@RequirePermissions('customers.view', 'customers.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary:
      'Customers: search, filter (status, registered between, ordered or not), sort (newest, spent, orders, last login). role=ADMIN lists admins.',
  })
  findAll(@Query() q: ListUsersDto) {
    return this.users.findAll(q);
  }

  @Get('export')
  @ApiOperation({
    summary:
      'Download customers (same filters as the list) as CSV or Excel: contact, orders, lifetime value, last order',
  })
  async export(@Query() q: ExportUsersDto, @Res() res: Response) {
    await sendTable(res, q.format, await this.users.exportTable(q));
  }

  @Get('password-reset-requests')
  @ApiOperation({ summary: 'List customer password reset requests' })
  findPasswordResetRequests(@Query() q: ListPasswordResetRequestsDto) {
    return this.users.findPasswordResetRequests(q);
  }

  @Patch('password-reset-requests/:id')
  @ApiOperation({ summary: 'Update status/notes for a password reset request' })
  updatePasswordResetRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePasswordResetRequestDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.updatePasswordResetRequest(id, dto, admin.id);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Customer detail: profile, lifetime value, order and ticket counts, addresses, latest orders',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'All orders of a customer, newest first' })
  orders(@Param('id', ParseUUIDPipe) id: string, @Query() q: PageDto) {
    return this.users.orders(id, q);
  }

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Saved addresses of a customer' })
  addresses(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.addresses(id);
  }

  @Get(':id/tickets')
  @ApiOperation({ summary: 'Support tickets of a customer' })
  tickets(@Param('id', ParseUUIDPipe) id: string, @Query() q: PageDto) {
    return this.users.tickets(id, q);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Reviews written by a customer' })
  reviews(@Param('id', ParseUUIDPipe) id: string, @Query() q: PageDto) {
    return this.users.reviews(id, q);
  }

  @Get(':id/coupons')
  @ApiOperation({ summary: 'Coupons a customer has used' })
  coupons(@Param('id', ParseUUIDPipe) id: string, @Query() q: PageDto) {
    return this.users.couponUsage(id, q);
  }

  @Get(':id/notes')
  @ApiOperation({
    summary:
      'Private admin notes about a customer (never shown to the customer)',
  })
  notes(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.notes(id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a private note about a customer' })
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.addNote(id, dto.note, admin.id);
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a note' })
  removeNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    return this.users.removeNote(id, noteId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Set ACTIVE / SUSPENDED / BANNED. A blocked customer is signed out. You cannot change your own account.',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.updateStatus(id, dto.status, admin);
  }

  @Patch(':id/blacklist')
  @ApiOperation({ summary: 'Update customer COD blacklist status and reason' })
  updateBlacklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlacklistDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.updateBlacklist(id, dto.isBlacklisted, dto.reason, admin);
  }

  @Post(':id/reset-password')
  @ApiOperation({
    summary:
      'Set a temporary password for a customer (shown once). Used for customers with no email, who cannot get the reset link.',
  })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
    @Body() dto?: AdminDirectResetPasswordDto,
  ) {
    return this.users.resetPassword(id, admin, dto);
  }

  @Patch(':id/role')
  @RequirePermissions('staff.manage')
  @ApiOperation({
    summary:
      'Change a role. Granting or removing admin access needs a super admin.',
  })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.updateRole(id, dto.role, admin);
  }
}
