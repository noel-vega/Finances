import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginatedProducts } from './entities/paginated-products.entity';
import { ProductDetail } from './entities/product-detail.entity';
import { CurrentAccountId } from '../app-key/app-key.decorators';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedProducts })
  findAll(
    @Query() query: ListProductsQueryDto,
    @CurrentAccountId() accountId: number,
  ) {
    return this.productsService.findAll(query, accountId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductDetail })
  @ApiNotFoundResponse()
  async findOne(
    @Param('id') id: string,
    @CurrentAccountId() accountId: number,
  ) {
    const product = await this.productsService.findOne(+id, accountId);
    if (!product) {
      throw new NotFoundException();
    }
    return product;
  }
}
