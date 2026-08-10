import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AppKeyModule } from './modules/app-key/app-key.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';

@Module({
  imports: [DatabaseModule, AppKeyModule, ProductsModule, CartModule, CheckoutModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
