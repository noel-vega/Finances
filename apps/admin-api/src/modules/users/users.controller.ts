import { Controller, Get, Post, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { User } from './entities/user.entity';
import {
  CurrentUser,
  GrantedPermissions,
  RequirePermissions,
  type AuthenticatedUser,
} from '../auth/auth.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users:write')
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: User })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @GrantedPermissions() granted: Set<string> | undefined,
  ) {
    return this.usersService.create(createUserDto, user.accountId, user.sub, granted);
  }

  @Get()
  @RequirePermissions('users:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [User] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.accountId);
  }

  @Patch(':id/roles')
  @RequirePermissions('users:manage_roles')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: User })
  async updateRoles(
    @Param('id') id: string,
    @Body() assignRolesDto: AssignRolesDto,
    @CurrentUser() user: AuthenticatedUser,
    @GrantedPermissions() granted: Set<string> | undefined,
  ) {
    const updated = await this.usersService.updateRoles(
      +id,
      assignRolesDto.roleIds,
      user.accountId,
      user.sub,
      granted,
    );
    if (!updated) throw new NotFoundException();
    return updated;
  }
}
