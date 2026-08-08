import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './entities/cart.entity';
import { CurrentAccountId } from '../app-key/app-key.decorators';
import { CurrentCartToken } from './cart.decorators';

@ApiSecurity('AppKey-auth')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @ApiCreatedResponse({ type: Cart })
  addItem(
    @Body() dto: AddCartItemDto,
    @CurrentCartToken() cartToken: string | undefined,
    @CurrentAccountId() accountId: number,
  ) {
    return this.cartService.addItem(cartToken, accountId, dto);
  }

  @Get()
  @ApiOkResponse({ type: Cart })
  @ApiNotFoundResponse()
  async getCart(
    @CurrentCartToken() cartToken: string | undefined,
    @CurrentAccountId() accountId: number,
  ) {
    const cart = await this.cartService.getCart(cartToken, accountId);
    if (!cart) throw new NotFoundException();
    return cart;
  }

  @Patch('items/:variantId')
  @ApiOkResponse({ type: Cart })
  @ApiNotFoundResponse()
  async updateItem(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentCartToken() cartToken: string | undefined,
    @CurrentAccountId() accountId: number,
  ) {
    const cart = await this.cartService.updateItem(
      cartToken,
      accountId,
      +variantId,
      dto,
    );
    if (!cart) throw new NotFoundException();
    return cart;
  }

  @Delete('items/:variantId')
  @ApiOkResponse({ type: Cart })
  @ApiNotFoundResponse()
  async removeItem(
    @Param('variantId') variantId: string,
    @CurrentCartToken() cartToken: string | undefined,
    @CurrentAccountId() accountId: number,
  ) {
    const cart = await this.cartService.removeItem(
      cartToken,
      accountId,
      +variantId,
    );
    if (!cart) throw new NotFoundException();
    return cart;
  }

  @Delete()
  @ApiOkResponse({ type: Cart })
  @ApiNotFoundResponse()
  async clear(
    @CurrentCartToken() cartToken: string | undefined,
    @CurrentAccountId() accountId: number,
  ) {
    const cart = await this.cartService.clear(cartToken, accountId);
    if (!cart) throw new NotFoundException();
    return cart;
  }
}
