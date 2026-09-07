import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { GetShippingOptionsDto } from './dto/shipping-options.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutConfig } from './entities/checkout-config.entity';
import { CheckoutSessionStatus } from './entities/checkout-session-status.entity';
import { ShippingOptionsResult } from './entities/shipping-options-result.entity';
import { CurrentAccountId, Public } from '../app-key/app-key.decorators';
import { CurrentCartToken } from '../cart/cart.decorators';

@ApiSecurity('AppKey-auth')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // lets the storefront decide whether to show embedded checkout at all,
  // and gives it the connected account id Stripe.js needs on the client
  @Get('config')
  @ApiOkResponse({ type: CheckoutConfig })
  getConfig(@CurrentAccountId() accountId: number) {
    return this.checkoutService.getConfig(accountId);
  }

  @Post('session')
  @ApiCreatedResponse({ type: CheckoutSession })
  createSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentCartToken() cartToken: string | undefined,
    @CurrentAccountId() accountId: number,
  ) {
    return this.checkoutService.createSession(cartToken, accountId, dto);
  }

  // called by the storefront's onShippingDetailsChange callback
  @Post('shipping-options')
  @ApiOkResponse({ type: ShippingOptionsResult })
  getShippingOptions(
    @Body() dto: GetShippingOptionsDto,
    @CurrentAccountId() accountId: number,
  ) {
    return this.checkoutService.getShippingOptions(accountId, dto);
  }

  // polled by the return page — embedded checkout has no server-confirmed
  // redirect, just this session id, so the client checks status itself
  @Get('session/:sessionId')
  @ApiOkResponse({ type: CheckoutSessionStatus })
  getSessionStatus(
    @Param('sessionId') sessionId: string,
    @CurrentAccountId() accountId: number,
  ) {
    return this.checkoutService.getSessionStatus(accountId, sessionId);
  }

  // subscribed in the Stripe dashboard to "events on connected accounts",
  // separate endpoint/secret from merchant-api's account webhook
  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint()
  async webhook(@Req() req: RawBodyRequest<Request>) {
    await this.checkoutService.handleWebhookEvent(
      req.rawBody,
      req.headers['stripe-signature'],
    );
    return { received: true };
  }
}
