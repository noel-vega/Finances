import { Controller, Get, Post, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { Category } from './entities/category.entity';
import { CurrentUser, type AuthenticatedUser } from '../auth/auth.decorators';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: Category })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.create(createCategoryDto, user.accountId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [Category] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.findAll(user.accountId);
  }
}
