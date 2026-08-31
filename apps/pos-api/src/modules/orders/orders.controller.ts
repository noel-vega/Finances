import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PosOrder } from "./entities/pos-order.entity";
import {
  CurrentPosDevice,
  type PosDeviceContext,
} from "../pos-auth/pos-auth.decorators";

@ApiTags("orders")
@ApiSecurity("PosDevice-auth")
@Controller("pos")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("orders")
  @ApiCreatedResponse({ type: PosOrder })
  create(
    @Body() dto: CreateOrderDto,
    @CurrentPosDevice() device: PosDeviceContext,
  ) {
    return this.ordersService.createOrder(dto, device);
  }
}
