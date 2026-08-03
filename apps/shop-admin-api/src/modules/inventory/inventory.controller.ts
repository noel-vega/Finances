import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { InventoryRecord } from './entities/inventory.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [InventoryRecord] })
  findAll() {
    return this.inventoryService.findAll();
  }
}
