import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PaginatedOrders } from './entities/paginated-orders.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { OrderStatusChange } from './entities/order-status-change.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from 'src/shared/auth/decorators';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: PaginatedOrders })
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findAll(limit, offset, user.accountId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: OrderDetail })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const order = await this.ordersService.findOne(+id, user.accountId);
    if (!order) throw new NotFoundException();
    return order;
  }

  // Narrow manual status correction — for the cases the refund / cancel flows
  // don't cover (e.g. marking a payment_failed order canceled). It does not
  // issue refunds or restock; moving a paid order to refunded is rejected here
  // (use POST /orders/:id/refunds).
  @Patch(':id/status')
  @RequirePermissions('orders:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: OrderStatusChange })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, user.accountId, dto, user.sub);
  }
}
