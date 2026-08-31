import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
// opt a route out of PosDeviceGuard — used for pairing and health
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface PosDeviceContext {
  deviceId: number;
  accountId: number;
  locationId: number;
}

// PosDeviceGuard stashes the resolved device on request.posDevice — this
// pulls it out for handlers/services that scope a query to the device's
// tenant + location
export const CurrentPosDevice = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PosDeviceContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.posDevice;
  },
);
