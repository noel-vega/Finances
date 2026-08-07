import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  key: string;

  @ApiProperty({ nullable: true, type: String })
  label: string | null;

  @ApiProperty()
  createdAt: Date;
}
