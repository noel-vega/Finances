import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PaginatedOrders } from './entities/paginated-orders.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { BuyShippingLabelDto } from './dto/buy-shipping-label.dto';
import { CurrentUser, type AuthenticatedUser } from '../auth/auth.decorators';

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

  @Post(':id/shipping-rates')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [ShippingRate] })
  getShippingRates(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getShippingRates(+id, user.accountId);
  }

  @Post(':id/shipping-label')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: OrderDetail })
  buyShippingLabel(
    @Param('id') id: string,
    @Body() dto: BuyShippingLabelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.buyShippingLabel(+id, user.accountId, dto);
  }
}
