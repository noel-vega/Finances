import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { createRedisConnection } from 'queue';
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
import { FulfillmentsModule } from './modules/fulfillments/fulfillments.module';
import { AccountModule } from './modules/account/account.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { PosDevicesModule } from './modules/pos-devices/pos-devices.module';

@Module({
  imports: [
    // 5s command timeout — this app only ever enqueues, never blocks
    // waiting on jobs, so a bounded timeout lets a Redis outage fail fast
    // instead of hanging the request indefinitely (see createRedisConnection)
    BullModule.forRoot({ connection: createRedisConnection({ commandTimeout: 5000 }) }),
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
    FulfillmentsModule,
    AccountModule,
    CustomersModule,
    DashboardModule,
    HealthModule,
    PermissionsModule,
    RolesModule,
    PosDevicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
