import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Provider } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions/permissions.service';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, type AuthenticatedUser } from './auth.decorators';

// authorization ("what"), separate from AuthGuard's authentication ("who").
// A no-op for any route without @RequirePermissions() — every existing
// route is unaffected until explicitly annotated. Does a live DB lookup
// per request rather than trusting anything on the JWT, so revoking a
// role takes effect immediately instead of waiting out the access token's
// lifetime (see the RBAC plan for why).
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      // AuthGuard runs first and always populates this for a non-@Public()
      // route — reaching here with no user means something upstream is
      // broken, not that access should be silently allowed
      throw new ForbiddenException('Missing required permission');
    }

    const granted = await this.permissionsService.getEffectivePermissionKeys(user.sub);
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException('Missing required permission');
    }

    // available to handlers via @GrantedPermissions(), so a route needing
    // a second, narrower permission check on the same request doesn't
    // have to re-query it
    request.grantedPermissions = granted;

    return true;
  }
}

export const PERMISSIONS_APP_GUARD: Provider = {
  provide: APP_GUARD,
  useClass: PermissionsGuard,
};
