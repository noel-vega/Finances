import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { productsTable, type db as Db } from 'db';

@Injectable()
export class ProductsService {

  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}
  create(createProductDto: CreateProductDto) {
    this.db.insert(productsTable).values(createProductDto)
    return 'This action adds a new product';
  }

  findAll() {
    return []
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
