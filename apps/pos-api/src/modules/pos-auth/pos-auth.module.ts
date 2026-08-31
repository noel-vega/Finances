import { Module } from "@nestjs/common";
import { POS_DEVICE_APP_GUARD } from "./pos-auth.guard";

@Module({
  providers: [POS_DEVICE_APP_GUARD],
})
export class PosAuthModule {}
