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
import { Category } from '../../categories/entities/category.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  compareAtPrice: string | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'sold_count', type: 'int', default: 0 })
  soldCount: number;

  @Column({ default: '' })
  brand: string;

  @Column('simple-array', { nullable: true })
  sizes: string[];

  @Column('simple-array', { nullable: true })
  colors: string[];

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (c) => c.products, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @OneToMany(() => CartItem, (ci) => ci.product)
  cartItems: CartItem[];

  @OneToMany(() => Wishlist, (w) => w.product)
  wishlistEntries: Wishlist[];

  @OneToMany(() => OrderItem, (oi) => oi.product)
  orderItems: OrderItem[];

  @OneToMany(() => Review, (r) => r.product)
  reviews: Review[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
