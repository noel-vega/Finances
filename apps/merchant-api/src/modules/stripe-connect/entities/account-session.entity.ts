import { ApiProperty } from '@nestjs/swagger';

export class AccountSessionResponse {
  @ApiProperty()
  clientSecret!: string;
}
