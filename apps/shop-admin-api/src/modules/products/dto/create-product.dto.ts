import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { InsertProduct, productStatusEnum } from "db/schema";

export class CreateProductDto implements InsertProduct {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(8)
  description: string;

  @IsOptional()
  @IsIn(productStatusEnum.enumValues)
  status?: (typeof productStatusEnum.enumValues)[number];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }
}