import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Address } from './address.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ name: 'reset_password_token', type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires', type: 'timestamptz', nullable: true })
  resetPasswordExpires: Date | null;

  @OneToMany(() => Address, (a) => a.user, { cascade: true })
  addresses: Address[];

  @OneToOne(() => Cart, (c) => c.user)
  cart: Cart;

  @OneToMany(() => Wishlist, (w) => w.user)
  wishlistItems: Wishlist[];

  @OneToMany(() => Order, (o) => o.user)
  orders: Order[];

  @OneToMany(() => Review, (r) => r.user)
  reviews: Review[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
