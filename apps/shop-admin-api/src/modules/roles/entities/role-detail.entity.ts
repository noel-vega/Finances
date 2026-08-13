import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

export class RoleDetail extends Role {
  @ApiProperty({ type: () => [Permission] })
  permissions!: Permission[];
}
