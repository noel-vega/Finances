import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { jwtConstants } from './auth.constants';
import { AUTH_APP_GUARD } from './auth.guard';
import { PERMISSIONS_APP_GUARD } from './permissions.guard';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: '60s',
      },
    }),
  ],
  // order matters: AuthGuard must populate request.user before
  // PermissionsGuard reads it
  providers: [AUTH_APP_GUARD, PERMISSIONS_APP_GUARD, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
