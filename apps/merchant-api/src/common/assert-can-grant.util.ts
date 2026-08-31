import { ForbiddenException } from '@nestjs/common';

// a caller can never hand out a permission they don't hold themselves —
// used both when defining a role's permissions and when assigning an
// existing role to a user
export function assertCanGrant(permissionKeys: string[], granted: Set<string>) {
  const notOwned = permissionKeys.filter((key) => !granted.has(key));
  if (notOwned.length > 0) {
    throw new ForbiddenException(
      `Cannot grant a permission you do not hold: ${notOwned.join(', ')}`,
    );
  }
}
