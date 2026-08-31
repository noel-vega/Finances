import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

// empty array is valid — it's how you strip a user down to zero roles
export class AssignRolesDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  roleIds: number[];

  constructor(roleIds: number[]) {
    this.roleIds = roleIds;
  }
}
