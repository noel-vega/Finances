import { Controller, Get, Post, Body } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { Brand } from './entities/brand.entity';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: Brand })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [Brand] })
  findAll() {
    return this.brandsService.findAll();
  }
}
