import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Address } from '../users/entities/address.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Address, Product]),
    CartModule,
    CouponsModule,
    PaymentModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
