import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { env } from 'src/shared/env';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectStatus } from './entities/stripe-connect-status.entity';
import { AccountSessionResponse } from './entities/account-session.entity';
import {
  CurrentUser,
  Public,
  type AuthenticatedUser,
} from 'src/shared/auth/decorators';
import { stripe } from './stripe.client';

@Controller('stripe-connect')
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @Post('account-session')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: AccountSessionResponse })
  createAccountSession(@CurrentUser() user: AuthenticatedUser) {
    return this.stripeConnectService.createAccountSession(user.accountId);
  }

  @Get('status')
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({ name: 'refresh', required: false, type: Boolean })
  @ApiOkResponse({ type: StripeConnectStatus })
  getStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query('refresh') refresh?: string,
  ) {
    return this.stripeConnectService.getStatus(
      user.accountId,
      refresh === 'true',
    );
  }

  // subscribed in the Stripe dashboard to "events on connected accounts",
  // separate endpoint/secret from storefront-api's checkout webhook
  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint()
  async webhook(@Req() req: RawBodyRequest<FastifyRequest>) {
    const signature = req.headers['stripe-signature'];
    if (!req.rawBody || typeof signature !== 'string') {
      throw new BadRequestException('Missing signature');
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      env.STRIPE_ACCOUNT_WEBHOOK_SECRET,
    );

    if (event.type === 'account.updated' && event.account) {
      const account = event.data.object;
      await this.stripeConnectService.handleAccountUpdated(event.account, {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
      });
    }

    return { received: true };
  }
}
