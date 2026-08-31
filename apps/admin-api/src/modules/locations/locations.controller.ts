import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Location } from './entities/location.entity';
import { CurrentUser, type AuthenticatedUser } from '../auth/auth.decorators';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: Location })
  create(
    @Body() createLocationDto: CreateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.locationsService.create(createLocationDto, user.accountId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [Location] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.locationsService.findAll(user.accountId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: Location })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const location = await this.locationsService.update(
      +id,
      updateLocationDto,
      user.accountId,
    );
    if (!location) throw new NotFoundException();
    return location;
  }
}
