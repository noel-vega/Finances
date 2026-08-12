import { ApiProperty } from '@nestjs/swagger';

// deliberately not `implements SelectUser` like Account/Location — the
// usersTable columns are firstname/lastname (see auth.service.ts signup,
// which maps firstName -> firstname by hand), but every other response in
// this API is camelCase, so the service maps rows onto this shape instead
// of passing them through. password is never included here.
export class User {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  accountId!: number;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  phone!: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
