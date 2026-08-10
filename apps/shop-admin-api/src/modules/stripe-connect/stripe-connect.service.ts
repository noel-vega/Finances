import { Inject, Injectable } from '@nestjs/common';
import { eq, stripeAccountsTable, type db as Db } from 'db';
import { DRIZZLE } from 'src/database/database.constants';
import { stripe } from './stripe.client';
import { StripeConnectStatus } from './entities/stripe-connect-status.entity';
import { AccountSessionResponse } from './entities/account-session.entity';

@Injectable()
export class StripeConnectService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async createAccountSession(accountId: number): Promise<AccountSessionResponse> {
    const stripeAccountId = await this.ensureConnectedAccount(accountId);

    const session = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        account_onboarding: { enabled: true },
        account_management: { enabled: true },
        balances: { enabled: true },
        notification_banner: { enabled: true },
      },
    });

    return { clientSecret: session.client_secret };
  }

  async getStatus(accountId: number, refresh: boolean): Promise<StripeConnectStatus> {
    const [stripeAccount] = await this.db
      .select()
      .from(stripeAccountsTable)
      .where(eq(stripeAccountsTable.accountId, accountId));

    if (!stripeAccount) {
      return { connected: false, chargesEnabled: false, detailsSubmitted: false };
    }

    if (!refresh) {
      return {
        connected: true,
        chargesEnabled: stripeAccount.chargesEnabled,
        detailsSubmitted: stripeAccount.detailsSubmitted,
      };
    }

    const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);
    await this.syncAccountStatus(stripeAccount.stripeAccountId, {
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
    });

    return {
      connected: true,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    };
  }

  // handles the `account.updated` webhook event — the durable path for
  // keeping charges_enabled/details_submitted in sync; the refresh=true
  // path above is a local-dev/UI fallback for when that hasn't landed yet
  async handleAccountUpdated(stripeAccountId: string, status: {
    charges_enabled: boolean;
    details_submitted: boolean;
  }): Promise<void> {
    await this.syncAccountStatus(stripeAccountId, status);
  }

  private async syncAccountStatus(
    stripeAccountId: string,
    status: { charges_enabled: boolean; details_submitted: boolean },
  ): Promise<void> {
    await this.db
      .update(stripeAccountsTable)
      .set({
        chargesEnabled: status.charges_enabled,
        detailsSubmitted: status.details_submitted,
        updatedAt: new Date(),
      })
      .where(eq(stripeAccountsTable.stripeAccountId, stripeAccountId));
  }

  private async ensureConnectedAccount(accountId: number): Promise<string> {
    const [existing] = await this.db
      .select()
      .from(stripeAccountsTable)
      .where(eq(stripeAccountsTable.accountId, accountId));

    if (existing) return existing.stripeAccountId;

    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await this.db.insert(stripeAccountsTable).values({
      accountId,
      stripeAccountId: stripeAccount.id,
    });

    return stripeAccount.id;
  }
}
