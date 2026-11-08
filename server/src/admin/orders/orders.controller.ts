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
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { InvoiceService } from '../../common/invoice';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminOrdersService } from './orders.service';
import { OrderEditService } from './order-edit.service';
import { OrderPaymentsService } from './order-payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import {
  BulkDeleteOrdersDto,
  BulkOrderStatusDto,
  OverrideDeliveryFeeDto,
  SetDeliveryPinDto,
  CreateOrderDto,
  ExportOrdersQueryDto,
  ListOrdersDto,
  OrderFilterDto,
  ShippingQuoteQueryDto,
  RecordPaymentDto,
  RecordRefundDto,
  UpdateOrderAddressDto,
  UpdateOrderItemsDto,
  UpdatePackerWeightsDto,
  UpdateOrderNotesDto,
  UpdateOrderStatusDto,
  UpdateShippingInfoDto,
  UpdateOrderDeliveryTimeDto,
} from './dto/order-admin.dto';

@ApiTags('Admin - Orders')
@ApiBearerAuth('JWT')
@RequirePermissions('orders.view', 'orders.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly orders: AdminOrdersService,
    private readonly edit: OrderEditService,
    private readonly payments: OrderPaymentsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List orders. Filters: status, paymentStatus, paymentMethod, source (WEB/ADMIN), from/to, search (number, name, phone, email, tracking, txn id, or a product name / SKU in the order). Sort: newest, oldest, total-desc, total-asc.',
  })
  findAll(@Query() q: ListOrdersDto) {
    return this.orders.findAll(q);
  }

  @Get('stats')
  @ApiOperation({
    summary:
      'Numbers for the cards above the list (counts per stage, payments to verify, revenue). Same filters as the list except status.',
  })
  stats(@Query() q: OrderFilterDto) {
    return this.orders.stats(q);
  }

  @Get('export')
  @ApiOperation({
    summary:
      'Download the filtered orders as CSV (same filters as the list, up to 20,000 orders)',
  })
  async export(@Query() q: ExportOrdersQueryDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    await this.orders.exportCsv(q, (chunk) => res.write(chunk));
    res.end();
  }

  @Put(':id/delivery-fee')
  @ApiOperation({
    summary:
      'Set the delivery charge of one order by hand (a reason is required and goes in the activity log), or send fee: null to go back to the distance charge',
  })
  overrideDeliveryFee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideDeliveryFeeDto,
    @CurrentUser() admin: User,
  ) {
    return this.edit.overrideDeliveryFee(id, dto, admin.id);
  }

  @Put(':id/delivery-pin')
  @ApiOperation({
    summary:
      'Put or move the delivery pin of an order and work out the distance and charge again',
  })
  setDeliveryPin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDeliveryPinDto,
    @CurrentUser() admin: User,
  ) {
    return this.edit.setDeliveryPin(id, dto, admin.id);
  }

  @Get(':id/route')
  @ApiOperation({
    summary:
      'The road from the shop to the delivery pin (for the map on the order page)',
  })
  route(@Param('id', ParseUUIDPipe) id: string) {
    return this.edit.route(id);
  }

  @Get('shipping-quote')
  @ApiOperation({
    summary:
      'Distance and delivery charge for a subtotal and a pin on the map (used while building a phone order)',
  })
  shippingQuote(@Query() q: ShippingQuoteQueryDto) {
    return this.edit.quoteShipping(
      q.subtotal,
      q.lat,
      q.lng,
      q.productIds ? q.productIds.split(',').filter(Boolean) : [],
    );
  }

  @Post()
  @ApiOperation({
    summary:
      'Create an order for a customer who ordered by phone/message: pick products, address, payment; optional coupon, manual discount/shipping, amount already paid',
  })
  create(@Body() dto: CreateOrderDto, @CurrentUser() admin: User) {
    return this.edit.create(dto, admin.id);
  }

  @Patch('bulk-status')
  @ApiOperation({
    summary:
      'Change the status of up to 100 orders at once. Each order is checked on its own; the answer lists what failed.',
  })
  bulkStatus(@Body() dto: BulkOrderStatusDto, @CurrentUser() admin: User) {
    return this.orders.bulkStatus(dto.ids, dto.status, dto.note, admin.id);
  }

  @Post('bulk-delete')
  @ApiOperation({
    summary:
      'Bulk delete multiple orders by their IDs. Delivered or in-transit orders are skipped/blocked.',
  })
  bulkDelete(@Body() dto: BulkDeleteOrdersDto, @CurrentUser() admin: User) {
    return this.orders.bulkDelete(dto.ids, admin.id);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Order detail: items, address, timeline, payments, refunds, returns',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.findOne(id);
  }

  @Get(':id/invoice')
  @ApiOperation({
    summary: 'Order invoice. format=html (default, printable) or json',
  })
  @ApiQuery({ name: 'format', required: false, enum: ['html', 'json'] })
  invoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.invoiceService.respond(res, { id }, format);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update order status (cancelling puts stock and the coupon back; delivering a COD order marks it paid)',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() admin: User,
  ) {
    return this.orders.updateStatus(id, dto.status, dto.note, admin.id);
  }

  @Patch(':id/shipping')
  @ApiOperation({ summary: 'Courier name, tracking number and tracking link' })
  shippingInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingInfoDto,
  ) {
    return this.orders.updateShippingInfo(id, dto);
  }

  @Patch(':id/delivery-time')
  @ApiOperation({
    summary: 'Update estimated delivery time, slot, and calendar date of an order',
  })
  deliveryTime(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDeliveryTimeDto,
    @CurrentUser() admin: User,
  ) {
    return this.orders.updateDeliveryTime(id, dto, admin.id);
  }

  @Patch(':id/notes')
  @ApiOperation({
    summary:
      'Internal notes (never shown to the customer) and the delivery note',
  })
  notes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderNotesDto,
  ) {
    return this.orders.updateNotes(id, dto);
  }

  @Put(':id/address')
  @ApiOperation({
    summary:
      'Change the delivery address (before the order is handed to the courier). recalculateShipping updates the shipping cost.',
  })
  address(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderAddressDto,
    @CurrentUser() admin: User,
  ) {
    return this.edit.updateAddress(id, dto, admin.id);
  }

  @Put(':id/items')
  @ApiOperation({
    summary:
      'Change the products of an order (add, remove, quantity, price). Stock and totals follow. Send the complete list of lines.',
  })
  items(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderItemsDto,
    @CurrentUser() admin: User,
  ) {
    return this.edit.updateItems(id, dto, admin.id);
  }

  @Put(':id/weights')
  @ApiOperation({
    summary:
      'Packer scale recording: record actual measured weights for weighed items in an order and adjust totals',
  })
  weights(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePackerWeightsDto,
    @CurrentUser() admin: User,
  ) {
    return this.edit.updatePackerWeights(id, dto, admin.id);
  }

  @Patch(':id/verify-payment')
  @ApiOperation({
    summary:
      'Verify or reject a manually submitted bKash payment (COD orders are not verified here — they are settled on delivery)',
  })
  verifyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() admin: User,
  ) {
    return this.orders.verifyPayment(id, dto.paymentStatus, dto.note, admin.id);
  }

  @Get(':id/payments')
  @ApiOperation({
    summary:
      'Payments and refunds of an order, with received / refunded / due totals',
  })
  listPayments(@Param('id', ParseUUIDPipe) id: string) {
    return this.payments.list(id);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record money received (cash at the shop, bKash, deposit)',
  })
  recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() admin: User,
  ) {
    return this.payments.record(id, dto, admin.id);
  }

  @Post(':id/refunds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record a refund given to the customer (full or partial)',
  })
  recordRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordRefundDto,
    @CurrentUser() admin: User,
  ) {
    return this.payments.refund(id, dto, admin.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete a single order (only pending, processing, on-hold or cancelled orders; delivered or in-transit orders cannot be deleted)',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
  ) {
    return this.orders.remove(id, admin.id);
  }
}
