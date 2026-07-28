import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { InsertProduct, productStatusEnum } from "db/schema";

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  description: string;

  @ApiProperty()
  @IsNumber()
  priceCents: number;


  @ApiProperty()
  @IsOptional()
  stock?: number 

  @ApiProperty({ enum: productStatusEnum.enumValues })
  @IsOptional()
  @IsIn(productStatusEnum.enumValues)
  status?: (typeof productStatusEnum.enumValues)[number];


  @ApiProperty()
  @IsOptional()
  barcodes?: string[]

  constructor(name: string, description: string, priceCents: number) {
    this.name = name;
    this.description = description;
    this.priceCents = priceCents
  }
}