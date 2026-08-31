import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString()
  addressLine1?: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString()
  addressCity?: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString()
  addressState?: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString()
  addressPostalCode?: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString()
  addressCountry?: string | null;
}
