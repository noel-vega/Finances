import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadUrl {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  key!: string;
}
