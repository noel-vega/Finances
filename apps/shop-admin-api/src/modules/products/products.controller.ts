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
import { UpdateVariantDto } from './dto/update-variant.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { ProductDetail } from './entities/product-detail.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductOption } from './entities/product-option.entity';
import { CurrentUser, type AuthenticatedUser } from '../auth/auth.decorators';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: Product })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.create(createProductDto, user.accountId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [Product] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findAll(user.accountId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductDetail })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findOne(+id, user.accountId);
  }

  @Get(":id/variants")
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [ProductVariant] })
  findVariants(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findVariants(+id, user.accountId);
  }

  @Get(":id/options")
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [ProductOption] })
  findOptions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findOptions(+id, user.accountId);
  }

  @Patch(':id/options/:optionId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductOption })
  updateOption(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() updateProductOptionDto: UpdateProductOptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.updateOption(
      +id,
      +optionId,
      updateProductOptionDto,
      user.accountId,
    );
  }

  @Delete(':id/options/:optionId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductOption })
  removeOption(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.removeOption(+id, +optionId, user.accountId);
  }

  @Delete(':id/options/:optionId/values/:valueId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductOption })
  removeOptionValue(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Param('valueId') valueId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.removeOptionValue(
      +id,
      +optionId,
      +valueId,
      user.accountId,
    );
  }


  @Post(":id/variants")
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ type: [ProductVariant] })
  createVariants(
    @Param('id') id: string,
    @Body() createVariantsDto: CreateVariantsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.createVariants(
      +id,
      createVariantsDto,
      user.accountId,
    );
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: Product })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.update(+id, updateProductDto, user.accountId);
  }

  @Patch(':id/variants/:variantId')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: ProductVariant })
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() updateVariantDto: UpdateVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.updateVariant(
      +id,
      +variantId,
      updateVariantDto,
      user.accountId,
    );
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: Product })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.remove(+id, user.accountId);
  }
}
