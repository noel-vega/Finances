import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './modules/products/products.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { CartsModule } from './modules/carts/carts.module';
import { StripeConnectModule } from './modules/stripe-connect/stripe-connect.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AccountModule } from './modules/account/account.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    BrandsModule,
    CategoriesModule,
    LocationsModule,
    InventoryModule,
    ApiKeysModule,
    CartsModule,
    StripeConnectModule,
    OrdersModule,
    AccountModule,
    CustomersModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
