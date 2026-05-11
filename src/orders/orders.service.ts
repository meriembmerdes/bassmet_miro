import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Address } from '../users/entities/address.entity';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrderStatus } from '../common/enums/order-status.enum';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
    private readonly dataSource: DataSource,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const address = await this.addressRepo.findOne({
      where: { id: dto.addressId, user: { id: userId } },
    });
    if (!address) throw new NotFoundException('Address not found');

    const cart = await this.cartService.getMine(userId);
    if (!cart.items?.length) {
      throw new BadRequestException('Cart is empty');
    }

    let subtotal = 0;
    for (const line of cart.items) {
      const price = Number(line.product.price);
      subtotal += price * line.quantity;
    }

    let discount = 0;
    let coupon: Coupon | null = null;
    if (dto.couponCode) {
      const v = await this.couponsService.validateForSubtotal(
        dto.couponCode,
        subtotal,
      );
      discount = Number(v.discount);
      coupon = v.coupon;
    }

    const total = Math.max(0, subtotal - discount);
    const shippingSnapshot = {
      label: address.label,
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const line of cart.items) {
        const fresh = await queryRunner.manager.findOne(Product, {
          where: { id: line.product.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!fresh || fresh.stock < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${line.product.name}`,
          );
        }
      }

      const order = queryRunner.manager.create(Order, {
        user: { id: userId } as User,
        status: OrderStatus.PENDING,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        coupon: coupon ? ({ id: coupon.id } as Coupon) : null,
        couponCode: coupon?.code ?? null,
        shippingAddress: shippingSnapshot,
        items: cart.items.map((line) =>
          queryRunner.manager.create(OrderItem, {
            product: line.product,
            quantity: line.quantity,
            unitPrice: line.product.price,
            title: line.product.name,
          }),
        ),
      });
      const saved = await queryRunner.manager.save(order);

      for (const line of cart.items) {
        await queryRunner.manager.decrement(
          Product,
          { id: line.product.id },
          'stock',
          line.quantity,
        );
        await queryRunner.manager.increment(
          Product,
          { id: line.product.id },
          'sold_count',
          line.quantity,
        );
      }

      if (coupon) {
        await queryRunner.manager.increment(
          Coupon,
          { id: coupon.id },
          'usedCount',
          1,
        );
      }

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('cart_items')
        .where('cart_id = :id', { id: cart.id })
        .execute();

      await queryRunner.commitTransaction();
      return this.orderRepo.findOne({
        where: { id: saved.id },
        relations: { items: { product: true }, coupon: true, user: true },
      });
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async listMine(userId: string) {
    return this.orderRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: { items: { product: true }, coupon: true },
    });
  }

  async track(userId: string, id: string) {
    const order = await this.orderRepo.findOne({
      where: { id, user: { id: userId } },
      relations: { items: { product: true } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      items: order.items,
    };
  }

  async cancel(userId: string, id: string) {
    const order = await this.orderRepo.findOne({
      where: { id, user: { id: userId } },
      relations: { items: { product: true } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PAID
    ) {
      throw new BadRequestException('Order cannot be cancelled');
    }
    for (const line of order.items) {
      if (line.product) {
        await this.productRepo.increment(
          { id: line.product.id },
          'stock',
          line.quantity,
        );
        await this.productRepo.decrement(
          { id: line.product.id },
          'sold_count',
          line.quantity,
        );
      }
    }
    order.status = OrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }

  async setStripePaymentIntentId(orderId: string, paymentIntentId: string) {
    await this.orderRepo.update(orderId, {
      stripePaymentIntentId: paymentIntentId,
    });
    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  async markPaidForUser(userId: string, orderId: string) {
    const order = await this.findOneForUser(userId, orderId);
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is cancelled');
    }
    if (order.status === OrderStatus.PAID) {
      return order;
    }
    order.status = OrderStatus.PAID;
    return this.orderRepo.save(order);
  }

  async listAll(page = 1, limit = 20) {
    const [data, total] = await this.orderRepo.findAndCount({
      order: { createdAt: 'DESC' },
      relations: { items: true, user: true, coupon: true },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async updateStatusAdmin(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = dto.status;
    if (dto.trackingNumber !== undefined) {
      order.trackingNumber = dto.trackingNumber;
    }
    return this.orderRepo.save(order);
  }

  async findOneForUser(userId: string, id: string) {
    const order = await this.orderRepo.findOne({
      where: { id, user: { id: userId } },
      relations: { items: { product: true }, coupon: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findOneAdmin(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: { product: true }, user: true, coupon: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getForPaymentIntent(userId: string, orderId: string) {
    const order = await this.findOneForUser(userId, orderId);
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is cancelled');
    }
    return order;
  }

}
