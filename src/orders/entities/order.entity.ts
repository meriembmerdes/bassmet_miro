import { OrderStatus } from '../../common/enums/order-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: string;

  @ManyToOne(() => Coupon, (c) => c.orders, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon | null;

  @Column({ name: 'coupon_code', type: 'varchar', nullable: true })
  couponCode: string | null;

  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress: Record<string, unknown>;

  @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', nullable: true })
  stripePaymentIntentId: string | null;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
