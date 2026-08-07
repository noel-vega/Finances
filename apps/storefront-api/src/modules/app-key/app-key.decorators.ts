import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// AppKeyGuard stashes the resolved tenant on request.accountId — this just
// pulls it out for handlers/services that need to scope a query to the tenant
export const CurrentAccountId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.accountId;
  },
);
