import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'Home' })
  label: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'line1' })
  line1: string;

  @Column({ name: 'line2', type: 'varchar', nullable: true })
  line2: string | null;

  @Column()
  city: string;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ name: 'postal_code' })
  postalCode: string;

  @Column()
  country: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
