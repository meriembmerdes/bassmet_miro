import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  async dashboard() {
    const [users, products, orders] = await Promise.all([
      this.usersRepo.count(),
      this.productsRepo.count(),
      this.ordersRepo.count(),
    ]);
    const revenueRow = await this.ordersRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(CAST(o.total AS DECIMAL)),0)', 'sum')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne<{ sum: string }>();
    const pendingOrders = await this.ordersRepo.count({
      where: { status: OrderStatus.PENDING },
    });
    return {
      users,
      products,
      orders,
      revenue: Number(revenueRow?.sum ?? 0),
      pendingOrders,
    };
  }

  async salesReport(from?: string, to?: string) {
    const qb = this.ordersRepo
      .createQueryBuilder('o')
      .select('DATE(o.created_at)', 'day')
      .addSelect('COALESCE(SUM(CAST(o.total AS DECIMAL)),0)', 'total')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('day')
      .orderBy('day', 'ASC');
    if (from) qb.andWhere('o.created_at >= :from', { from });
    if (to) qb.andWhere('o.created_at <= :to', { to });
    return qb.getRawMany();
  }
}
