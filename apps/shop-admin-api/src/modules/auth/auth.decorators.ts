import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface AuthenticatedUser {
  sub: number;
  email: string;
  accountId: number;
}

// AuthGuard stashes the verified JWT payload on request.user — this just
// pulls it out for handlers that need to attribute an action to a user
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
