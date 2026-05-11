import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Address } from './users/entities/address.entity';
import { Category } from './categories/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { Wishlist } from './wishlist/entities/wishlist.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Review } from './reviews/entities/review.entity';
import { Coupon } from './coupons/entities/coupon.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'ecommerce'),
        synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
        logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
        entities: [
          User,
          Address,
          Category,
          Product,
          Cart,
          CartItem,
          Wishlist,
          Order,
          OrderItem,
          Review,
          Coupon,
        ],
      }),
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    ReviewsModule,
    CouponsModule,
    AdminModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
