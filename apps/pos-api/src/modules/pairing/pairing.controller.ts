import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PairingService } from './pairing.service';
import { PairDeviceDto } from './dto/pair-device.dto';
import { PairingResult } from './entities/pairing-result.entity';
import { Public } from '../pos-auth/pos-auth.decorators';

@ApiTags('pairing')
@Controller('pos/pair')
export class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  // the only unauthenticated POS route — a device has no token yet when it
  // calls this
  @Public()
  @Post()
  @ApiCreatedResponse({ type: PairingResult })
  pair(@Body() dto: PairDeviceDto) {
    return this.pairingService.pair(dto);
  }
}
