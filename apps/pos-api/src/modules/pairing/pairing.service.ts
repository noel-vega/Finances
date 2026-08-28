import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  accountsTable,
  and,
  eq,
  isNull,
  locationsTable,
  posDevicesTable,
  type db as Db,
} from 'db';
import { DRIZZLE } from '../../database/database.constants';
import { generateDeviceToken } from '../../common/token.util';
import { PairDeviceDto } from './dto/pair-device.dto';
import { PairingResult } from './entities/pairing-result.entity';

@Injectable()
export class PairingService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async pair(dto: PairDeviceDto): Promise<PairingResult> {
    // pairing codes are cleared on redemption, so a match here is always an
    // unpaired device
    const [device] = await this.db
      .select()
      .from(posDevicesTable)
      .where(
        and(
          eq(posDevicesTable.pairingCode, dto.pairingCode.trim().toUpperCase()),
          isNull(posDevicesTable.revokedAt),
        ),
      );

    if (!device) {
      throw new NotFoundException('Invalid pairing code');
    }
    if (
      !device.pairingExpiresAt ||
      device.pairingExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Pairing code has expired');
    }

    const token = generateDeviceToken();
    await this.db
      .update(posDevicesTable)
      .set({
        token,
        pairedAt: new Date(),
        pairingCode: null,
        pairingExpiresAt: null,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posDevicesTable.id, device.id));

    const [account] = await this.db
      .select({ name: accountsTable.name })
      .from(accountsTable)
      .where(eq(accountsTable.id, device.accountId));
    const [location] = await this.db
      .select({ name: locationsTable.name })
      .from(locationsTable)
      .where(eq(locationsTable.id, device.locationId));

    return {
      token,
      accountId: device.accountId,
      accountName: account?.name ?? '',
      locationId: device.locationId,
      locationName: location?.name ?? '',
      deviceName: device.name,
    };
  }
}
