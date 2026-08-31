import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'permissions';
// opt-in: a route with no @RequirePermissions() is unaffected by
// PermissionsGuard, regardless of what roles/permissions the caller has
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export interface AuthenticatedUser {
  sub: number;
  email: string;
  accountId: number;
  firstName: string;
  lastName: string;
}

// AuthGuard stashes the verified JWT payload on request.user — this just
// pulls it out for handlers that need to attribute an action to a user
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// PermissionsGuard stashes the caller's full effective-permission set on
// request.grantedPermissions when a route has @RequirePermissions() — lets
// a handler reuse that instead of re-querying getEffectivePermissionKeys
// for an additional, narrower check on the same request
export const GrantedPermissions = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Set<string> | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.grantedPermissions;
  },
);
