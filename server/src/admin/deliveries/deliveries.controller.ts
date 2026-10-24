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
import {
  AssignDto,
  BoardQueryDto,
  CreateSettlementDto,
  DeliveredDto,
  FailedDto,
  HandoverDto,
  ListSettlementsDto,
  MyScopeDto,
  NoteDto,
  RangeDto,
  SettleSettlementDto,
} from './dto/deliveries.dto';
import { DeliveriesService } from './deliveries.service';

@ApiTags('Admin - Deliveries')
@ApiBearerAuth('JWT')
@RequirePermissions(
  ['delivery.manage', 'orders.assign', 'orders.view'],
  ['delivery.manage', 'orders.assign'],
)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/deliveries')
export class AdminDeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get('board')
  @ApiOperation({
    summary:
      'The delivery board: unassigned orders, assigned, on the way, delivered (one day) and failed',
  })
  board(@Query() q: BoardQueryDto) {
    return this.deliveries.board(q);
  }

  @Get('riders')
  @ApiOperation({
    summary:
      'Everyone who can be given a delivery, with what they are carrying now',
  })
  riders() {
    return this.deliveries.riders();
  }

  @Get('stats')
  @RequirePermissions('delivery.manage')
  @ApiOperation({
    summary:
      'Total deliveries, unique customers, repeat customers, average time, cash to collect, per-rider numbers and a daily series',
  })
  stats(@Query() q: RangeDto) {
    return this.deliveries.stats(q);
  }

  @Get('cash')
  @RequirePermissions('delivery.manage')
  @ApiOperation({
    summary:
      'Cash the riders have collected and not yet handed to the shop, per rider',
  })
  cash() {
    return this.deliveries.cashByRider();
  }

  @Post('cash/handover')
  @RequirePermissions('delivery.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark cash as handed over to the shop (one delivery or many)',
  })
  handover(@Body() dto: HandoverDto, @CurrentUser() actor: User) {
    return this.deliveries.handOver(dto.deliveryIds, actor);
  }

  @Get('settlements')
  @RequirePermissions('delivery.manage')
  @ApiOperation({ summary: 'List rider daily cash settlements' })
  listSettlements(@Query() q: ListSettlementsDto) {
    return this.deliveries.listSettlements(q);
  }

  @Post('settlements')
  @RequirePermissions('delivery.manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate or record daily cash settlement for a rider' })
  createSettlement(@Body() dto: CreateSettlementDto, @CurrentUser() actor: User) {
    return this.deliveries.createSettlement(dto, actor.id);
  }

  @Patch('settlements/:id/settle')
  @RequirePermissions('delivery.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm receipt of cash for a settlement' })
  settleSettlement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SettleSettlementDto,
    @CurrentUser() actor: User,
  ) {
    return this.deliveries.settleSettlement(id, dto, actor);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Give orders to one rider (also moves an order from one rider to another). Each order answers on its own.',
  })
  assign(@Body() dto: AssignDto, @CurrentUser() actor: User) {
    return this.deliveries.assign(
      dto.orderIds,
      dto.assigneeId,
      actor,
      dto.note,
    );
  }

  @Post(':id/unassign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Take an order back from the rider (the order goes back to Unassigned)',
  })
  unassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NoteDto,
    @CurrentUser() actor: User,
  ) {
    return this.deliveries.unassign(id, actor, dto.note);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One delivery with its history' })
  one(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveries.findOne(id);
  }
}

// The rider's own screen: only their deliveries, and only the steps of a delivery.
@ApiTags('Admin - My deliveries')
@ApiBearerAuth('JWT')
@RequirePermissions('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/my-deliveries')
export class MyDeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get()
  @ApiOperation({
    summary: 'My deliveries: active (to do now) or done (the last 7 days)',
  })
  mine(@CurrentUser() me: User, @Query() q: MyScopeDto) {
    return this.deliveries.mine(me, q.scope ?? 'active');
  }

  @Get('summary')
  @ApiOperation({ summary: 'My numbers today and the cash I am holding' })
  summary(@CurrentUser() me: User) {
    return this.deliveries.mySummary(me);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'I take this delivery' })
  accept(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() me: User) {
    return this.deliveries.step(id, me, 'ACCEPTED', {});
  }

  @Post(':id/picked-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'I have the parcel (the order becomes Shipped)' })
  pickedUp(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() me: User,
    @Body() dto: NoteDto,
  ) {
    return this.deliveries.step(id, me, 'PICKED_UP', { note: dto.note });
  }

  @Post(':id/on-the-way')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'I am on the way (the order becomes Out for delivery and the customer is told)',
  })
  onTheWay(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() me: User,
    @Body() dto: NoteDto,
  ) {
    return this.deliveries.step(id, me, 'ON_THE_WAY', { note: dto.note });
  }

  @Post(':id/delivered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delivered. Cash collected defaults to what is due.',
  })
  delivered(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() me: User,
    @Body() dto: DeliveredDto,
  ) {
    return this.deliveries.step(id, me, 'DELIVERED', {
      note: dto.note,
      cashCollected: dto.cashCollected,
    });
  }

  @Post(':id/failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Could not deliver (with the reason). The order is put on hold for the shop to decide.',
  })
  failed(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() me: User,
    @Body() dto: FailedDto,
  ) {
    return this.deliveries.step(id, me, 'FAILED', {
      note: dto.note,
      reason: dto.reason,
    });
  }
}
