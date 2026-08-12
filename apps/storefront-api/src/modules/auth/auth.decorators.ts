import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedCustomer {
  sub: number;
  email: string;
  accountId: number;
  firstName: string;
  lastName: string;
}

// CustomerAuthGuard stashes the verified JWT payload on request.customer —
// this just pulls it out for handlers that need to attribute an action to a
// signed-in customer
export const CurrentCustomer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedCustomer => {
    const request = ctx.switchToHttp().getRequest();
    return request.customer;
  },
);
