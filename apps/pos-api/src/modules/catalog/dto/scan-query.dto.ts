import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ScanQueryDto {
  @ApiProperty({ description: "A scanned barcode or a variant SKU" })
  @IsString()
  @MinLength(1)
  code!: string;
}
