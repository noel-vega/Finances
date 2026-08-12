import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomerModule } from '../customer/customer.module';
import { CartModule } from '../cart/cart.module';
import { EmailModule } from '../email/email.module';
import { jwtConstants } from './auth.constants';

@Module({
  imports: [
    CustomerModule,
    CartModule,
    EmailModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
