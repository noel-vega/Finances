import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { CurrentUser, type AuthenticatedUser } from '../auth/auth.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: User })
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(createUserDto, user.accountId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [User] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.accountId);
  }
}
