import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Product, Coupon])],
  providers: [SeedService],
})
export class DatabaseModule {}
