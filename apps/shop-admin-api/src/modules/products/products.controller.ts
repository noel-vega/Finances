import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantsDto } from './dto/create-variant.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductOption } from './entities/product-option.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: Product })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [Product] })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: Product })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Get(":id/variants")
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [ProductVariant] })
  findVariants(@Param('id') id: string) {
    return this.productsService.findVariants(+id);
  }

  @Get(":id/options")
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [ProductOption] })
  findOptions(@Param('id') id: string) {
    return this.productsService.findOptions(+id);
  }

  @Patch(':id/options/:optionId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductOption })
  updateOption(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() updateProductOptionDto: UpdateProductOptionDto,
  ) {
    return this.productsService.updateOption(
      +id,
      +optionId,
      updateProductOptionDto,
    );
  }

  @Delete(':id/options/:optionId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductOption })
  removeOption(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
  ) {
    return this.productsService.removeOption(+id, +optionId);
  }

  @Delete(':id/options/:optionId/values/:valueId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductOption })
  removeOptionValue(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Param('valueId') valueId: string,
  ) {
    return this.productsService.removeOptionValue(+id, +optionId, +valueId);
  }


  @Post(":id/variants")
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: [ProductVariant] })
  createVariants(
    @Param('id') id: string,
    @Body() createVariantsDto: CreateVariantsDto,
  ) {
    return this.productsService.createVariants(+id, createVariantsDto);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: Product })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: Product })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
