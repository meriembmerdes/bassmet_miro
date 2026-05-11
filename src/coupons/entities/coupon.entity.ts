import { CouponType } from '../../common/enums/coupon-type.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: string;

  @Column({ name: 'min_order', type: 'decimal', precision: 12, scale: 2, default: 0 })
  minOrder: string;

  @Column({
    name: 'max_discount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  maxDiscount: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Order, (o) => o.coupon)
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
