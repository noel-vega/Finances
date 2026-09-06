import { Body, Controller, Get, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  InventoryRecord,
  InventoryMovementRecord,
} from './entities/inventory.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import {
  CurrentUser,
  type AuthenticatedUser,
} from 'src/shared/auth/decorators';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [InventoryRecord] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.findAll(user.accountId);
  }

  @Post('movements')
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: InventoryMovementRecord })
  createMovement(
    @Body() createInventoryMovementDto: CreateInventoryMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.createMovement(
      createInventoryMovementDto,
      user.sub,
      user.accountId,
    );
  }

  @Get('movements')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [InventoryMovementRecord] })
  findMovements(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.findMovements(user.accountId);
  }
}
