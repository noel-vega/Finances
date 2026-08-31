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

// what PosDeviceGuard stashes on the request object
export interface PosDeviceRequest {
  posDevice?: PosDeviceContext;
}

// PosDeviceGuard stashes the resolved device on request.posDevice — this
// pulls it out for handlers/services that scope a query to the device's
// tenant + location
export const CurrentPosDevice = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PosDeviceContext => {
    const request = ctx.switchToHttp().getRequest<PosDeviceRequest>();
    // PosDeviceGuard runs first for every guarded route and always sets this
    return request.posDevice as PosDeviceContext;
  },
);
